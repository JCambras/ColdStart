/**
 * Scrape home teams from MyHockeyRankings.com
 *
 * Phase 1: Build MHR ID mapping by fetching state rink directories
 * Phase 2: Scrape "Home Ice Teams" from each mapped rink page
 *
 * Usage: npx tsx scripts/scrape-home-teams.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as cheerio from 'cheerio';

const MHR_BASE = 'https://myhockeyrankings.com';
const DELAY_MS = 200;
const DATA_DIR = join(process.cwd(), 'public', 'data');
const MAPPING_PATH = join(process.cwd(), 'data', 'mhr-mapping.json');
const OUTPUT_PATH = join(DATA_DIR, 'home-teams.json');

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
];

interface OurRink {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface MhrRink {
  name: string;
  city: string;
  mhrId: string;
}

// ── Utilities ──

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ColdStartHockey/1.0 (contact: hello@coldstarthockey.com)',
      },
    });
    if (!res.ok) {
      console.warn(`  HTTP ${res.status} for ${url}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`  Fetch error for ${url}:`, (err as Error).message);
    return null;
  }
}

/** Normalize a string for fuzzy matching: lowercase, strip punctuation, collapse spaces */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/['''`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Simple token-overlap similarity score (0–1) */
function similarity(a: string, b: string): number {
  const tokensA = new Set(normalize(a).split(' ').filter(Boolean));
  const tokensB = new Set(normalize(b).split(' ').filter(Boolean));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let overlap = 0;
  tokensA.forEach(t => {
    if (tokensB.has(t)) overlap++;
  });
  return (2 * overlap) / (tokensA.size + tokensB.size);
}

// ── Phase 1: Build MHR ID Mapping ──

async function parseStateRinks(state: string): Promise<MhrRink[]> {
  const url = `${MHR_BASE}/rinks?state=${state}`;
  const html = await fetchPage(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const rinks: MhrRink[] = [];

  // MHR rink directory pages list rinks as links to /rink-info?r=XXXX
  $('a[href*="rink-info?r="]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const match = href.match(/[?&]r=(\d+)/);
    if (!match) return;

    const mhrId = match[1];
    const name = $(el).text().trim();
    if (!name) return;

    // Try to find city from surrounding text or parent row
    const parentRow = $(el).closest('tr, div, li');
    const rowText = parentRow.text();
    // City is typically shown alongside the rink name in the table
    const city = extractCity(rowText, name);

    rinks.push({ name, city, mhrId });
  });

  return rinks;
}

/** Try to extract city from the row text, removing the rink name portion */
function extractCity(rowText: string, rinkName: string): string {
  // Remove the rink name from the row text
  const remaining = rowText.replace(rinkName, '').trim();
  // The city is often what's left, possibly with state abbreviation
  const parts = remaining.split(/[,\t\n]+/).map(s => s.trim()).filter(Boolean);
  return parts[0] || '';
}

function matchRinks(
  mhrRinks: MhrRink[],
  ourRinks: OurRink[],
  state: string
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const stateRinks = ourRinks.filter(r => r.state === state);

  for (const mhr of mhrRinks) {
    let bestScore = 0;
    let bestRink: OurRink | null = null;

    for (const our of stateRinks) {
      // Name similarity
      const nameSim = similarity(mhr.name, our.name);
      // City match bonus
      const cityMatch = mhr.city && our.city &&
        normalize(mhr.city) === normalize(our.city) ? 0.15 : 0;
      const score = nameSim + cityMatch;

      if (score > bestScore) {
        bestScore = score;
        bestRink = our;
      }
    }

    // Require at least 0.5 similarity to avoid false matches
    if (bestRink && bestScore >= 0.5) {
      mapping[bestRink.id] = mhr.mhrId;
    }
  }

  return mapping;
}

async function buildMapping(ourRinks: OurRink[]): Promise<Record<string, string>> {
  // Check for existing mapping to support resuming
  if (existsSync(MAPPING_PATH)) {
    console.log('Found existing MHR mapping, loading...');
    return JSON.parse(readFileSync(MAPPING_PATH, 'utf-8'));
  }

  console.log('Phase 1: Building MHR ID mapping...');
  const fullMapping: Record<string, string> = {};

  for (const state of US_STATES) {
    process.stdout.write(`  Fetching ${state}...`);
    const mhrRinks = await parseStateRinks(state);
    if (mhrRinks.length === 0) {
      console.log(' no rinks found');
      await sleep(DELAY_MS);
      continue;
    }

    const stateMapping = matchRinks(mhrRinks, ourRinks, state);
    Object.assign(fullMapping, stateMapping);
    console.log(` ${mhrRinks.length} MHR rinks, ${Object.keys(stateMapping).length} matched`);
    await sleep(DELAY_MS);
  }

  // Ensure data directory exists
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    const { mkdirSync } = await import('fs');
    mkdirSync(dataDir, { recursive: true });
  }

  writeFileSync(MAPPING_PATH, JSON.stringify(fullMapping, null, 2));
  console.log(`Mapping saved: ${Object.keys(fullMapping).length} rinks mapped`);
  return fullMapping;
}

// ── Phase 2: Scrape Home Teams ──

interface HomeTeamEntry {
  name: string;
  category?: string;
}

function categorizeTeam(name: string, sectionTitle: string): string | undefined {
  const lower = name.toLowerCase() + ' ' + sectionTitle.toLowerCase();
  if (lower.includes('high school') || lower.includes(' hs') || lower.includes('h.s.')) return 'high_school';
  if (lower.includes('college') || lower.includes('university') || lower.includes('ncaa')) return 'college';
  if (lower.includes('junior') || lower.includes(' jr ') || lower.includes('nahl') || lower.includes('ushl')) return 'junior';
  if (lower.includes('youth') || lower.includes('association') || lower.includes('minor')) return 'youth';
  return undefined;
}

async function scrapeHomeTeams(mhrId: string): Promise<HomeTeamEntry[]> {
  const url = `${MHR_BASE}/rink-info?r=${mhrId}`;
  const html = await fetchPage(url);
  if (!html) return [];

  const $ = cheerio.load(html);
  const teams: HomeTeamEntry[] = [];
  const seen = new Set<string>();

  // Look for "Home Ice Teams" section or similar headings
  // MHR typically shows teams in a section with links
  const homeTeamSelectors = [
    // Try finding a section header with "Home" or "Teams"
    'h2, h3, h4, strong, b',
  ];

  let foundSection = false;
  let sectionTitle = '';

  $('h2, h3, h4, strong, b, th').each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (text.includes('home') && (text.includes('team') || text.includes('ice'))) {
      foundSection = true;
      sectionTitle = $(el).text().trim();
    }
  });

  // Strategy 1: Find team links near the "Home Ice Teams" heading
  if (foundSection) {
    // Look for links to team pages
    $('a[href*="team_page"], a[href*="teampage"], a[href*="team-page"]').each((_, el) => {
      const name = $(el).text().trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        teams.push({ name, category: categorizeTeam(name, sectionTitle) });
      }
    });
  }

  // Strategy 2: Look for team links more broadly on the page
  if (teams.length === 0) {
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      // MHR team pages typically have team IDs in the URL
      if (href.includes('team_page') || href.includes('teampage') || href.match(/[?&]t=\d+/)) {
        const name = $(el).text().trim();
        if (name && name.length > 2 && name.length < 100 && !seen.has(name.toLowerCase())) {
          // Filter out navigation links and generic text
          const lower = name.toLowerCase();
          if (lower === 'home' || lower === 'back' || lower === 'top' || lower === 'more') return;
          seen.add(lower);
          teams.push({ name, category: categorizeTeam(name, '') });
        }
      }
    });
  }

  // Strategy 3: Parse table rows in the home teams area
  if (teams.length === 0) {
    $('table').each((_, table) => {
      const tableText = $(table).text().toLowerCase();
      if (tableText.includes('home') && (tableText.includes('team') || tableText.includes('ice'))) {
        $(table).find('tr').each((_, row) => {
          const cells = $(row).find('td, th');
          cells.each((_, cell) => {
            const link = $(cell).find('a');
            if (link.length > 0) {
              const name = link.first().text().trim();
              if (name && name.length > 2 && !seen.has(name.toLowerCase())) {
                seen.add(name.toLowerCase());
                teams.push({ name, category: categorizeTeam(name, '') });
              }
            }
          });
        });
      }
    });
  }

  return teams;
}

async function scrapeAllHomeTeams(mapping: Record<string, string>): Promise<Record<string, string[]>> {
  // Check for existing partial results to support resuming
  let results: Record<string, string[]> = {};
  if (existsSync(OUTPUT_PATH)) {
    console.log('Found existing home-teams.json, loading for resume...');
    results = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
  }

  const entries = Object.entries(mapping);
  const toScrape = entries.filter(([rinkId]) => !(rinkId in results));

  console.log(`Phase 2: Scraping home teams for ${toScrape.length} rinks (${entries.length - toScrape.length} already done)...`);

  let done = 0;
  for (const [rinkId, mhrId] of toScrape) {
    const teams = await scrapeHomeTeams(mhrId);
    if (teams.length > 0) {
      results[rinkId] = teams.map(t => t.name);
    }
    done++;
    if (done % 50 === 0 || done === toScrape.length) {
      console.log(`  ${done}/${toScrape.length} scraped (${Object.keys(results).length} rinks with teams)`);
      // Save progress periodically
      writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    }
    await sleep(DELAY_MS);
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  console.log(`Done! ${Object.keys(results).length} rinks with home teams saved to ${OUTPUT_PATH}`);
  return results;
}

// ── Main ──

async function main() {
  console.log('=== MHR Home Teams Scraper ===\n');

  // Load our rinks
  const rinksPath = join(DATA_DIR, 'rinks.json');
  const ourRinks: OurRink[] = JSON.parse(readFileSync(rinksPath, 'utf-8'));
  console.log(`Loaded ${ourRinks.length} rinks from rinks.json`);

  // Phase 1
  const mapping = await buildMapping(ourRinks);
  console.log(`\nMapped ${Object.keys(mapping).length} rinks to MHR IDs\n`);

  // Phase 2
  const results = await scrapeAllHomeTeams(mapping);

  // Summary
  const totalTeams = Object.values(results).reduce((sum, teams) => sum + teams.length, 0);
  console.log(`\n=== Summary ===`);
  console.log(`Rinks with home teams: ${Object.keys(results).length}`);
  console.log(`Total team entries: ${totalTeams}`);

  // Spot check
  const iceLine = Object.entries(results).find(([id]) => id.includes('ice-line'));
  if (iceLine) {
    console.log(`\nSpot check — ${iceLine[0]}:`);
    console.log(`  Teams: ${iceLine[1].join(', ')}`);
  }
}

main().catch((err) => {
  console.error('Scrape failed:', err);
  process.exit(1);
});
