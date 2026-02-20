#!/usr/bin/env node
/**
 * ColdStart — Refresh Nearby Food Data
 *
 * Re-fetches coffee, quick_bite, and team_lunch data for rinks in 8 target
 * states (PA, MA, NJ, NY, CT, MD, IL, MI) to bring them up to 8-10 entries
 * per food category. Preserves all non-food categories (bowling, arcade,
 * movies, fun, hotels, gas, dinner).
 *
 * Usage:
 *   node scripts/refresh-nearby-food.mjs            # Run refresh
 *   node scripts/refresh-nearby-food.mjs --dry-run   # Preview without API calls
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const NEARBY_DIR = path.join(ROOT, 'public', 'data', 'nearby');
const RINKS_FILE = path.join(ROOT, 'public', 'data', 'rinks.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'food_refresh_progress.json');

const DRY_RUN = process.argv.includes('--dry-run');
const TARGET_STATES = new Set(['PA', 'MA', 'NJ', 'NY', 'CT', 'MD', 'IL', 'MI']);
const FOOD_CATEGORIES = ['coffee', 'quick_bite', 'team_lunch'];
const SPARSE_THRESHOLD = 8; // Skip rink if all food cats have >= this many entries
const MAX_PER_CATEGORY = 10;

// ── Load API key from .env.local ──
function loadApiKey() {
  try {
    const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
    const match = env.match(/GOOGLE_PLACES_API_KEY=(.+)/);
    return match?.[1]?.trim();
  } catch { return null; }
}

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || loadApiKey();
if (!API_KEY && !DRY_RUN) {
  console.error('Missing GOOGLE_PLACES_API_KEY');
  process.exit(1);
}

const PLACES_URL = 'https://places.googleapis.com/v1/places';

// ── Rate limiter: max 5 requests/sec ──
let lastRequestTime = 0;
const MIN_DELAY_MS = 200;
async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) await sleep(MIN_DELAY_MS - elapsed);
  lastRequestTime = Date.now();
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Request counter for cost tracking ──
let requestCount = 0;
function logCost() {
  const cost = (requestCount * 0.035).toFixed(2);
  console.log(`  [API] ${requestCount} requests so far (~$${cost})`);
}

// ── Google Places Nearby Search (from seed.mjs) ──
async function nearbySearch(lat, lng, radiusMeters, types, maxResults = 20) {
  await rateLimit();
  const body = {
    locationRestriction: {
      circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
    },
    includedPrimaryTypes: types,
    maxResultCount: maxResults,
    rankPreference: 'DISTANCE',
  };

  const res = await fetch(`${PLACES_URL}:searchNearby`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.priceLevel,places.businessStatus',
    },
    body: JSON.stringify(body),
  });
  requestCount++;
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Nearby search failed (${res.status}): ${err}`);
  }
  return res.json();
}

// ── Haversine distance (miles) ──
function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Chain sets (from seed.mjs) ──
const FAST_FOOD_CHAINS = new Set([
  'mcdonald', 'burger king', 'wendy', 'taco bell', 'chick-fil-a', 'popeyes',
  'sonic', 'arby', 'jack in the box', 'hardee', 'carl', 'white castle',
  'five guys', 'shake shack', 'in-n-out', 'whataburger', 'culver',
  'wawa', 'sheetz', 'jersey mike', 'jimmy john', 'firehouse sub',
  'subway', 'quiznos', 'chipotle', 'qdoba', 'moe',
  'dunkin', 'tim horton', 'krispy kreme',
  'panda express', 'raising cane', 'zaxby', 'cook out',
  'smashburger', 'checkers', 'rally',
]);
const COFFEE_CHAINS = new Set([
  'starbucks', 'dunkin', 'tim horton', 'caribou', 'peet', 'dutch bros',
  'biggby', 'scooter', 'coffee bean', 'la colombe', 'bluestone',
]);
const CASUAL_CHAINS = new Set([
  'applebee', 'chili', 'olive garden', 'red robin', 'tgi friday',
  'buffalo wild wings', 'red lobster', 'outback', 'cracker barrel',
  'bob evans', 'denny', 'ihop', 'waffle house', 'perkins',
  'cheesecake factory', 'p.f. chang', 'ruby tuesday', 'texas roadhouse',
  'longhorn', 'golden corral', 'friendly', 'noodles', 'panera',
  'cheddar', 'bj\'s restaurant', 'hooters', 'twin peaks',
]);

// Dual-purpose stores: appear in BOTH coffee and quick_bite
const DUAL_PURPOSE_CHAINS = new Set([
  'wawa', 'sheetz', 'dunkin', 'tim horton',
]);

// ── Food search type configs ──
const FOOD_SEARCHES = [
  {
    key: 'food',
    types: ['restaurant', 'cafe', 'fast_food_restaurant', 'coffee_shop', 'meal_takeaway', 'bakery'],
  },
  {
    key: 'quick_food',
    types: ['fast_food_restaurant', 'meal_takeaway', 'bakery', 'sandwich_shop'],
  },
];

// ── Categorize a place into food categories (enhanced from seed.mjs) ──
function categorizeFoodPlace(place, rinkLat, rinkLng) {
  const name = (place.displayName?.text || '').toLowerCase();
  const types = place.types || [];
  const dist = distanceMiles(
    rinkLat, rinkLng,
    place.location?.latitude || 0, place.location?.longitude || 0
  );
  const distStr = dist < 0.1 ? '0.1 mi' : `${dist.toFixed(1)} mi`;
  const placeLat = place.location?.latitude || rinkLat;
  const placeLng = place.location?.longitude || rinkLng;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName?.text || '')}&query_place_id=${place.id || ''}&center=${placeLat},${placeLng}`;

  const entry = {
    name: place.displayName?.text || '',
    distance: distStr,
    url: mapsUrl,
    distNum: dist,
    ...(dist > 3 ? { isFar: true } : {}),
  };

  // Skip bars/pubs — not food categories we're refreshing
  const BAR_TYPES = ['bar', 'night_club', 'pub', 'wine_bar', 'brewery'];
  if (BAR_TYPES.some(t => types.includes(t)) && !types.includes('coffee_shop')) {
    return { categories: ['dinner'], entry };
  }

  // Check if dual-purpose chain (both coffee AND quick_bite)
  const isDualPurpose = [...DUAL_PURPOSE_CHAINS].some(c => name.includes(c));
  if (isDualPurpose) {
    return { categories: ['coffee', 'quick_bite'], entry };
  }

  // Coffee shops
  if (types.includes('coffee_shop') || types.includes('cafe') ||
      [...COFFEE_CHAINS].some(c => name.includes(c))) {
    return { categories: ['coffee'], entry };
  }

  // Fast food / quick bites
  if (types.includes('fast_food_restaurant') || types.includes('meal_takeaway') ||
      [...FAST_FOOD_CHAINS].some(c => name.includes(c))) {
    return { categories: ['quick_bite'], entry };
  }

  // Casual dining / team lunch
  if ([...CASUAL_CHAINS].some(c => name.includes(c))) {
    return { categories: ['team_lunch'], entry };
  }

  // Restaurant classification by rating
  const rating = place.rating || 0;
  if (rating >= 4.2 || place.priceLevel === 'PRICE_LEVEL_EXPENSIVE' || place.priceLevel === 'PRICE_LEVEL_VERY_EXPENSIVE') {
    return { categories: ['dinner'], entry };
  }

  // Default: team_lunch
  return { categories: ['team_lunch'], entry };
}

// ── Main ──
async function main() {
  console.log(`\n═══ ColdStart Food Data Refresh ═══`);
  console.log(`  Target states: ${[...TARGET_STATES].join(', ')}`);
  if (DRY_RUN) console.log('  *** DRY RUN — no API calls ***');

  // Load rinks
  if (!fs.existsSync(RINKS_FILE)) {
    console.error(`  Missing ${RINKS_FILE} — run seed.mjs first`);
    process.exit(1);
  }
  const allRinks = JSON.parse(fs.readFileSync(RINKS_FILE, 'utf8'));
  const rinks = allRinks.filter(r => TARGET_STATES.has(r.state));
  console.log(`  ${rinks.length} rinks in target states (${allRinks.length} total)\n`);

  // Load progress for resume support
  let progress = {};
  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    const doneCount = Object.values(progress).filter(p => p.done).length;
    console.log(`  Resuming: ${doneCount}/${rinks.length} already completed\n`);
  }

  const FIVE_MILES = 8046.72;
  const TEN_MILES = 16093.44;
  const FIFTEEN_MILES = 24140.16;

  let skippedAlreadyGood = 0;
  let skippedAlreadyDone = 0;
  let refreshed = 0;
  let errors = 0;

  for (let i = 0; i < rinks.length; i++) {
    const rink = rinks[i];

    // Skip if already completed in this refresh run
    if (progress[rink.id]?.done) {
      skippedAlreadyDone++;
      continue;
    }

    if (!rink.latitude || !rink.longitude) {
      console.log(`  [${i + 1}/${rinks.length}] Skipping ${rink.name} (no coords)`);
      continue;
    }

    // Load existing nearby data
    const nearbyFile = path.join(NEARBY_DIR, `${rink.id}.json`);
    let existing = {};
    if (fs.existsSync(nearbyFile)) {
      existing = JSON.parse(fs.readFileSync(nearbyFile, 'utf8'));
    }

    // Check if already has good food data
    const coffeeCt = (existing.coffee || []).length;
    const quickCt = (existing.quick_bite || []).length;
    const lunchCt = (existing.team_lunch || []).length;

    if (coffeeCt >= SPARSE_THRESHOLD && quickCt >= SPARSE_THRESHOLD && lunchCt >= SPARSE_THRESHOLD) {
      skippedAlreadyGood++;
      progress[rink.id] = { done: true, skipped: true };
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [${i + 1}/${rinks.length}] WOULD REFRESH ${rink.name}, ${rink.city} ${rink.state} — coffee: ${coffeeCt}, quick_bite: ${quickCt}, team_lunch: ${lunchCt}`);
      continue;
    }

    // Fetch fresh food data
    const foodResults = {
      coffee: [],
      quick_bite: [],
      team_lunch: [],
      dinner: [], // capture but won't overwrite existing
    };
    const seenPlaceIds = new Set();

    for (const search of FOOD_SEARCHES) {
      try {
        // Start at 5 miles
        let result = await nearbySearch(rink.latitude, rink.longitude, FIVE_MILES, search.types, 20);
        let places = result.places || [];

        // Expand to 10 miles if sparse
        if (places.length < 3) {
          const result2 = await nearbySearch(rink.latitude, rink.longitude, TEN_MILES, search.types, 20);
          const existingIds = new Set(places.map(p => p.id));
          for (const p of (result2.places || [])) {
            if (!existingIds.has(p.id)) places.push(p);
          }
        }

        // Expand to 15 miles if still sparse
        if (places.length < 3) {
          const result3 = await nearbySearch(rink.latitude, rink.longitude, FIFTEEN_MILES, search.types, 20);
          const existingIds = new Set(places.map(p => p.id));
          for (const p of (result3.places || [])) {
            if (!existingIds.has(p.id)) places.push(p);
          }
        }

        // Categorize results
        for (const place of places) {
          if (place.businessStatus === 'CLOSED_PERMANENTLY') continue;
          if (seenPlaceIds.has(place.id)) continue;
          seenPlaceIds.add(place.id);

          const { categories, entry } = categorizeFoodPlace(place, rink.latitude, rink.longitude);
          for (const cat of categories) {
            if (foodResults[cat]) foodResults[cat].push(entry);
          }
        }
      } catch (err) {
        console.error(`    Error (${search.key}): ${err.message}`);
        errors++;
      }
    }

    // Sort by distance, cap at MAX_PER_CATEGORY, strip distNum
    for (const cat of FOOD_CATEGORIES) {
      foodResults[cat].sort((a, b) => a.distNum - b.distNum);
      foodResults[cat] = foodResults[cat].slice(0, MAX_PER_CATEGORY)
        .map(({ distNum, ...rest }) => rest);
    }

    // Merge: replace food categories, preserve everything else
    const merged = { ...existing };
    for (const cat of FOOD_CATEGORIES) {
      // Only replace if we got results (don't wipe data on API failure)
      if (foodResults[cat].length > 0) {
        merged[cat] = foodResults[cat];
      }
    }

    // Write updated file
    fs.writeFileSync(nearbyFile, JSON.stringify(merged, null, 2));

    const newCoffeeCt = (merged.coffee || []).length;
    const newQuickCt = (merged.quick_bite || []).length;
    const newLunchCt = (merged.team_lunch || []).length;
    console.log(`  [${i + 1}/${rinks.length}] ${rink.name}, ${rink.city} ${rink.state} — coffee: ${coffeeCt}→${newCoffeeCt}, quick_bite: ${quickCt}→${newQuickCt}, team_lunch: ${lunchCt}→${newLunchCt}`);

    refreshed++;
    progress[rink.id] = {
      done: true,
      coffee: newCoffeeCt,
      quick_bite: newQuickCt,
      team_lunch: newLunchCt,
    };

    // Save progress periodically
    if (refreshed % 10 === 0) {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    }
    if (refreshed % 50 === 0) logCost();
  }

  // Final progress save
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

  // Summary
  console.log(`\n═══ Summary ═══`);
  console.log(`  Refreshed: ${refreshed}`);
  console.log(`  Skipped (already good): ${skippedAlreadyGood}`);
  console.log(`  Skipped (already done this run): ${skippedAlreadyDone}`);
  console.log(`  Errors: ${errors}`);
  logCost();
  console.log(`\n✓ Done!`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
