#!/usr/bin/env node
/**
 * Verify nearby places: check for permanently closed businesses
 * and obvious misclassifications using Google Places API.
 *
 * Usage:
 *   node scripts/verify-nearby.mjs           # Scan all target-state rinks
 *   node scripts/verify-nearby.mjs --fix     # Scan AND remove bad entries
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'public', 'data');
const NEARBY_DIR = path.join(DATA_DIR, 'nearby');
const TARGET_STATES = ['PA', 'NJ', 'NY', 'IL', 'MA', 'MD', 'VA', 'CT'];

const FIX_MODE = process.argv.includes('--fix');

// ── Load API key ──
function loadApiKey() {
  try {
    const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
    const match = env.match(/GOOGLE_PLACES_API_KEY=(.+)/);
    return match?.[1]?.trim();
  } catch { return null; }
}

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || loadApiKey();
if (!API_KEY) { console.error('Missing GOOGLE_PLACES_API_KEY'); process.exit(1); }

const PLACES_URL = 'https://places.googleapis.com/v1/places';

// ── Rate limiter ──
let lastRequestTime = 0;
let requestCount = 0;
async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 100) await new Promise(r => setTimeout(r, 100 - elapsed));
  lastRequestTime = Date.now();
}

// ── Look up a place by its Google Place ID ──
async function getPlaceDetails(placeId) {
  await rateLimit();
  const url = `${PLACES_URL}/${placeId}`;
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'id,displayName,businessStatus,types,primaryType',
    },
  });
  requestCount++;
  if (!res.ok) {
    if (res.status === 404) return { notFound: true };
    const err = await res.text();
    throw new Error(`Place details failed (${res.status}): ${err}`);
  }
  return res.json();
}

// ── Extract place_id from a Google Maps URL ──
function extractPlaceId(url) {
  if (!url) return null;
  const match = url.match(/query_place_id=([^&]+)/);
  return match ? match[1] : null;
}

// ── Category → expected Google types mapping ──
// If a place's types don't overlap with expected types, it's likely miscategorized
const CATEGORY_EXPECTED_TYPES = {
  coffee: new Set(['coffee_shop', 'cafe', 'bakery']),
  quick_bite: new Set(['fast_food_restaurant', 'meal_takeaway', 'restaurant', 'bakery', 'sandwich_shop']),
  team_lunch: new Set(['restaurant', 'meal_takeaway', 'fast_food_restaurant', 'bakery', 'sandwich_shop', 'cafe']),
  dinner: new Set(['restaurant', 'meal_takeaway', 'cafe', 'bakery']),
  hotels: new Set(['hotel', 'motel', 'lodging', 'resort_hotel', 'extended_stay_hotel']),
  bowling: new Set(['bowling_alley']),
  arcade: new Set(['amusement_center', 'amusement_park']),
  movies: new Set(['movie_theater']),
  fun: new Set(['amusement_center', 'amusement_park', 'tourist_attraction', 'museum', 'park', 'zoo', 'aquarium']),
  gas: new Set(['gas_station']),
};

// Types that indicate a place is a bar (not coffee)
const BAR_TYPES = new Set(['bar', 'night_club', 'pub', 'wine_bar', 'brewery']);

// ── Main ──
async function main() {
  const rinks = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'rinks.json'), 'utf8'));
  const targetRinks = rinks.filter(r => TARGET_STATES.includes(r.state));
  console.log(`Verifying nearby data for ${targetRinks.length} rinks in ${TARGET_STATES.join(', ')}`);
  if (FIX_MODE) console.log('  FIX MODE: will remove bad entries\n');
  else console.log('  DRY RUN: use --fix to remove bad entries\n');

  // Progress tracking
  const progressFile = path.join(ROOT, 'data', 'verify_progress.json');
  let verified = {};
  if (fs.existsSync(progressFile)) {
    verified = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
    console.log(`  Resuming: ${Object.keys(verified).length} places already checked`);
  }

  let totalPlaces = 0;
  let closedCount = 0;
  let notFoundCount = 0;
  let miscategorizedCount = 0;
  let noPlaceIdCount = 0;
  let filesFixed = 0;

  const problems = [];

  for (let ri = 0; ri < targetRinks.length; ri++) {
    const rink = targetRinks[ri];
    const filePath = path.join(NEARBY_DIR, `${rink.id}.json`);
    if (!fs.existsSync(filePath)) continue;

    let data;
    try { data = JSON.parse(fs.readFileSync(filePath, 'utf8')); }
    catch { continue; }

    let fileModified = false;

    for (const [category, places] of Object.entries(data)) {
      if (!Array.isArray(places)) continue;

      const toRemove = new Set();

      for (let pi = 0; pi < places.length; pi++) {
        const place = places[pi];
        const placeId = extractPlaceId(place.url);
        totalPlaces++;

        if (!placeId) {
          noPlaceIdCount++;
          continue;
        }

        // Check cache first
        let details = verified[placeId];
        if (!details) {
          try {
            details = await getPlaceDetails(placeId);
            verified[placeId] = details;

            // Save progress every 50 requests
            if (requestCount % 50 === 0) {
              fs.writeFileSync(progressFile, JSON.stringify(verified));
              process.stdout.write(`\r  [${requestCount} API calls] Checking ${rink.name}...`);
            }
          } catch (e) {
            console.error(`\n  Error checking ${place.name}: ${e.message}`);
            continue;
          }
        }

        // Check 1: Is the place permanently closed or not found?
        if (details.notFound || details.businessStatus === 'CLOSED_PERMANENTLY') {
          const status = details.notFound ? 'NOT_FOUND' : 'PERMANENTLY_CLOSED';
          closedCount++;
          problems.push({
            rink: rink.name,
            file: `${rink.id}.json`,
            category,
            place: place.name,
            issue: status,
          });
          toRemove.add(pi);
          continue;
        }

        // Check 2: Is it miscategorized? (e.g., bar listed as coffee)
        if (category === 'coffee' && details.types) {
          const types = new Set(details.types);
          const isBar = [...BAR_TYPES].some(t => types.has(t));
          const isCoffee = types.has('coffee_shop') || types.has('cafe');
          if (isBar && !isCoffee) {
            miscategorizedCount++;
            problems.push({
              rink: rink.name,
              file: `${rink.id}.json`,
              category,
              place: place.name,
              issue: `MISCATEGORIZED (bar/pub in coffee)`,
              types: details.types,
            });
            toRemove.add(pi);
          }
        }

        // Check 3: Hotels that are actually something else
        if (category === 'hotels' && details.types) {
          const types = new Set(details.types);
          const isHotel = types.has('hotel') || types.has('motel') || types.has('lodging') ||
                          types.has('resort_hotel') || types.has('extended_stay_hotel');
          if (!isHotel) {
            miscategorizedCount++;
            problems.push({
              rink: rink.name,
              file: `${rink.id}.json`,
              category,
              place: place.name,
              issue: `MISCATEGORIZED (not a hotel, types: ${details.types?.join(', ')})`,
            });
            toRemove.add(pi);
          }
        }
      }

      // Remove bad entries if in fix mode
      if (FIX_MODE && toRemove.size > 0) {
        data[category] = places.filter((_, i) => !toRemove.has(i));
        fileModified = true;
      }
    }

    if (FIX_MODE && fileModified) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
      filesFixed++;
    }
  }

  // Final progress save
  fs.writeFileSync(progressFile, JSON.stringify(verified));

  console.log('\n\n══════ Results ══════');
  console.log(`  Total places checked: ${totalPlaces}`);
  console.log(`  API calls made: ${requestCount}`);
  console.log(`  Permanently closed / not found: ${closedCount}`);
  console.log(`  Miscategorized: ${miscategorizedCount}`);
  console.log(`  No place_id (skipped): ${noPlaceIdCount}`);
  if (FIX_MODE) console.log(`  Files fixed: ${filesFixed}`);

  if (problems.length > 0) {
    console.log(`\n── Problem entries (${problems.length}) ──`);
    for (const p of problems) {
      console.log(`  ${p.file} → ${p.category}: "${p.place}" — ${p.issue}`);
    }
  }

  console.log(`\nProgress cached to ${progressFile} (${Object.keys(verified).length} places).`);
  console.log('Re-run to resume from where you left off.');
}

main().catch(e => { console.error(e); process.exit(1); });
