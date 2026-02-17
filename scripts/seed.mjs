#!/usr/bin/env node
/**
 * ColdStart Rink Seeder
 *
 * Discovers every US ice rink via Google Places API, fetches nearby places,
 * and generates plausible signal data.
 *
 * Usage:
 *   node scripts/seed.mjs discover   # Phase 1: find all US rinks
 *   node scripts/seed.mjs nearby     # Phase 2: fetch nearby places per rink
 *   node scripts/seed.mjs signals    # Phase 3: generate signal seed data
 *   node scripts/seed.mjs integrate  # Phase 4: write frontend data files
 *   node scripts/seed.mjs all        # Run all phases
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const NEARBY_DIR = path.join(ROOT, 'public', 'data', 'nearby');

// ── Load API key from .env.local ──
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

// ── Rate limiter: max N requests/sec ──
let lastRequestTime = 0;
const MIN_DELAY_MS = 200; // 5 req/sec
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

// ── Google Places API helpers ──
async function textSearch(query, pageToken = null) {
  await rateLimit();
  const body = { textQuery: query, pageSize: 20 };
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch(`${PLACES_URL}:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,nextPageToken',
    },
    body: JSON.stringify(body),
  });
  requestCount++;
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Text search failed (${res.status}): ${err}`);
  }
  return res.json();
}

async function nearbySearch(lat, lng, radiusMeters, types, maxResults = 10) {
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

// ── Slug generator ──
function slugify(name, city) {
  const base = `${name} ${city}`.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base.slice(0, 60);
}

// ═══════════════════════════════════════════
// PHASE 1: Discover all US ice rinks
// ═══════════════════════════════════════════

const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
];

// Hockey-heavy states need city-level searches for thorough coverage
const EXTRA_CITIES = {
  'Minnesota': ['Minneapolis', 'St Paul', 'Duluth', 'Rochester', 'Bloomington', 'Edina', 'Eden Prairie', 'Minnetonka', 'Plymouth', 'Maple Grove', 'Woodbury', 'Eagan', 'Burnsville', 'Mankato', 'St Cloud'],
  'Michigan': ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Lansing', 'Kalamazoo', 'Troy', 'Livonia', 'Traverse City', 'Midland', 'Flint', 'Muskegon', 'Dearborn'],
  'Massachusetts': ['Boston', 'Worcester', 'Springfield', 'Lowell', 'Cambridge', 'Brockton', 'Quincy', 'Framingham', 'Hyannis', 'Plymouth'],
  'New York': ['New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany', 'Long Island', 'White Plains', 'Utica', 'Ithaca'],
  'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem', 'Lancaster', 'Harrisburg', 'West Chester'],
  'Illinois': ['Chicago', 'Rockford', 'Aurora', 'Naperville', 'Joliet', 'Elgin', 'Peoria', 'Springfield', 'Champaign'],
  'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Canton', 'Youngstown'],
  'Wisconsin': ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton', 'Waukesha', 'Eau Claire'],
  'Connecticut': ['Hartford', 'New Haven', 'Stamford', 'Bridgeport', 'Waterbury', 'Danbury', 'Greenwich'],
  'New Jersey': ['Newark', 'Jersey City', 'Trenton', 'Cherry Hill', 'Wayne', 'Morristown', 'Hackensack', 'Montclair'],
  'Colorado': ['Denver', 'Colorado Springs', 'Boulder', 'Fort Collins', 'Aurora', 'Lakewood'],
  'New Hampshire': ['Manchester', 'Nashua', 'Concord', 'Dover', 'Portsmouth', 'Laconia'],
  'Vermont': ['Burlington', 'Rutland', 'Montpelier', 'Stowe'],
  'Maine': ['Portland', 'Bangor', 'Lewiston', 'Biddeford'],
  'California': ['Los Angeles', 'San Jose', 'San Francisco', 'Anaheim', 'San Diego', 'Sacramento', 'Irvine', 'Ontario'],
  'Texas': ['Dallas', 'Houston', 'Austin', 'San Antonio', 'Frisco', 'Allen', 'The Woodlands'],
  'Florida': ['Tampa', 'Fort Lauderdale', 'Jacksonville', 'Orlando', 'Coral Springs', 'Estero'],
  'Maryland': ['Baltimore', 'Rockville', 'Bowie', 'Annapolis', 'Laurel'],
  'Virginia': ['Arlington', 'Ashburn', 'Charlottesville', 'Richmond', 'Roanoke'],
  'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Kent', 'Everett'],
  'Missouri': ['St Louis', 'Kansas City', 'Springfield'],
  'Indiana': ['Indianapolis', 'Fort Wayne', 'South Bend', 'Evansville', 'Carmel'],
  'North Dakota': ['Fargo', 'Bismarck', 'Grand Forks', 'Minot'],
};

// Ice rink related types from Google Places
const ICE_RINK_TYPES = new Set(['ice_skating_rink', 'sports_complex', 'stadium', 'athletic_field']);

async function discoverRinks() {
  console.log('\n═══ Phase 1: Discovering US ice rinks ═══\n');

  const cacheFile = path.join(DATA_DIR, 'rinks_raw.json');
  let allPlaces = [];
  const seenIds = new Set();

  // Resume from cache if exists
  if (fs.existsSync(cacheFile)) {
    allPlaces = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    allPlaces.forEach(p => seenIds.add(p.googlePlaceId));
    console.log(`  Resuming with ${allPlaces.length} cached rinks`);
  }

  async function searchAndCollect(query) {
    let pageToken = null;
    let pages = 0;
    do {
      try {
        const result = await textSearch(query, pageToken);
        const places = result.places || [];
        for (const p of places) {
          if (seenIds.has(p.id)) continue;
          // Filter: must look like an ice rink
          const types = p.types || [];
          const name = p.displayName?.text || '';
          const isRink = types.some(t => ICE_RINK_TYPES.has(t)) ||
            /\b(ice|rink|arena|skating|hockey|cold)\b/i.test(name) ||
            /\b(ice.?plex|skate.?zone|ice.?center|ice.?forum|twin.?rinks?)\b/i.test(name);
          if (!isRink) continue;
          // Skip roller skating, inline, etc
          if (/\b(roller|inline|skate\s*park|skateboard)\b/i.test(name)) continue;

          seenIds.add(p.id);
          const addr = p.formattedAddress || '';
          const stateMatch = addr.match(/,\s*([A-Z]{2})\s+\d{5}/);
          allPlaces.push({
            googlePlaceId: p.id,
            name: p.displayName?.text || '',
            address: addr,
            city: extractCity(addr),
            state: stateMatch?.[1] || '',
            latitude: p.location?.latitude || null,
            longitude: p.location?.longitude || null,
            types: p.types || [],
          });
        }
        pageToken = result.nextPageToken || null;
        pages++;
      } catch (err) {
        console.error(`  Error searching "${query}": ${err.message}`);
        pageToken = null;
      }
    } while (pageToken && pages < 5);
  }

  // Search each state
  for (let i = 0; i < STATES.length; i++) {
    const state = STATES[i];
    console.log(`  [${i + 1}/${STATES.length}] Searching ${state}...`);
    await searchAndCollect(`ice rink in ${state}`);
    await searchAndCollect(`ice hockey rink in ${state}`);

    // Extra city-level searches for hockey-heavy states
    const cities = EXTRA_CITIES[state] || [];
    for (const city of cities) {
      await searchAndCollect(`ice rink near ${city} ${state}`);
    }

    // Save progress after each state
    fs.writeFileSync(cacheFile, JSON.stringify(allPlaces, null, 2));
    if (i % 5 === 4) logCost();
  }

  // Generate slugs and final IDs
  const slugCounts = {};
  const rinks = allPlaces.map(p => {
    let slug = slugify(p.name, p.city);
    if (slugCounts[slug]) {
      slugCounts[slug]++;
      slug += `-${slugCounts[slug]}`;
    } else {
      slugCounts[slug] = 1;
    }
    return { id: slug, ...p };
  });

  const outputFile = path.join(DATA_DIR, 'rinks.json');
  fs.writeFileSync(outputFile, JSON.stringify(rinks, null, 2));
  console.log(`\n  ✓ Found ${rinks.length} ice rinks across ${new Set(rinks.map(r => r.state)).size} states`);
  console.log(`  ✓ Saved to ${outputFile}`);
  logCost();
  return rinks;
}

function extractCity(address) {
  // "123 Main St, Springfield, IL 62704, USA"
  const parts = address.split(',').map(s => s.trim());
  if (parts.length >= 3) return parts[parts.length - 3];
  if (parts.length >= 2) return parts[0];
  return '';
}

// ═══════════════════════════════════════════
// PHASE 2: Fetch nearby places for each rink
// ═══════════════════════════════════════════

const NEARBY_SEARCHES = [
  {
    key: 'food',
    types: ['restaurant', 'cafe', 'fast_food_restaurant', 'coffee_shop', 'meal_takeaway', 'bakery'],
  },
  {
    key: 'lodging',
    types: ['hotel', 'motel', 'lodging'],
  },
  {
    key: 'entertainment',
    types: ['bowling_alley', 'movie_theater', 'amusement_center', 'amusement_park'],
  },
  // Targeted searches for sparse categories
  {
    key: 'fun_extra',
    types: ['amusement_center', 'amusement_park', 'tourist_attraction'],
  },
  {
    key: 'quick_food',
    types: ['fast_food_restaurant', 'meal_takeaway', 'bakery', 'sandwich_shop'],
  },
];

// Known chain lists for categorization
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

function categorizePlace(place, rinkLat, rinkLng) {
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

  // Determine category
  // Check for bars/pubs BEFORE coffee — Google often tags bars with 'cafe' type
  const BAR_TYPES = ['bar', 'night_club', 'pub', 'wine_bar', 'brewery'];
  if (BAR_TYPES.some(t => types.includes(t)) && !types.includes('coffee_shop')) {
    return { category: 'dinner', entry };
  }
  if (types.includes('coffee_shop') || types.includes('cafe') ||
      [...COFFEE_CHAINS].some(c => name.includes(c))) {
    return { category: 'coffee', entry };
  }
  if (types.includes('fast_food_restaurant') || types.includes('meal_takeaway') ||
      [...FAST_FOOD_CHAINS].some(c => name.includes(c))) {
    return { category: 'quick_bite', entry };
  }
  if (types.includes('hotel') || types.includes('motel') || types.includes('lodging')) {
    return { category: 'hotels', entry };
  }
  if (types.includes('bowling_alley')) return { category: 'bowling', entry };
  if (types.includes('movie_theater')) return { category: 'movies', entry };
  if (types.includes('amusement_center') || types.includes('amusement_park') || types.includes('tourist_attraction')) {
    return { category: 'fun', entry };
  }
  // Restaurant classification
  if ([...CASUAL_CHAINS].some(c => name.includes(c))) {
    return { category: 'team_lunch', entry };
  }
  const rating = place.rating || 0;
  if (rating >= 4.2 || place.priceLevel === 'PRICE_LEVEL_EXPENSIVE' || place.priceLevel === 'PRICE_LEVEL_VERY_EXPENSIVE') {
    return { category: 'dinner', entry };
  }
  return { category: 'team_lunch', entry };
}

async function fetchNearby() {
  console.log('\n═══ Phase 2: Fetching nearby places ═══\n');

  const rinksFile = path.join(DATA_DIR, 'rinks.json');
  if (!fs.existsSync(rinksFile)) {
    console.error('  Run "discover" phase first.');
    return;
  }
  const rinks = JSON.parse(fs.readFileSync(rinksFile, 'utf8'));

  // Track which rinks already have nearby data
  const progressFile = path.join(DATA_DIR, 'nearby_progress.json');
  let completed = new Set();
  if (fs.existsSync(progressFile)) {
    completed = new Set(JSON.parse(fs.readFileSync(progressFile, 'utf8')));
    console.log(`  Resuming: ${completed.size}/${rinks.length} already done`);
  }

  const FIVE_MILES = 8046.72;
  const TEN_MILES = 16093.44;

  for (let i = 0; i < rinks.length; i++) {
    const rink = rinks[i];
    if (completed.has(rink.id)) continue;
    if (!rink.latitude || !rink.longitude) {
      console.log(`  [${i + 1}/${rinks.length}] Skipping ${rink.name} (no coords)`);
      continue;
    }

    console.log(`  [${i + 1}/${rinks.length}] ${rink.name}, ${rink.city} ${rink.state}`);

    const nearby = {
      quick_bite: [], coffee: [], team_lunch: [], dinner: [],
      bowling: [], arcade: [], movies: [], fun: [],
      hotels: [], gas: [],
    };

    for (const search of NEARBY_SEARCHES) {
      try {
        // First try 5 miles
        let result = await nearbySearch(rink.latitude, rink.longitude, FIVE_MILES, search.types, 20);
        let places = result.places || [];

        // If fewer than 3 results, expand to 10 miles
        if (places.length < 3) {
          const result2 = await nearbySearch(rink.latitude, rink.longitude, TEN_MILES, search.types, 20);
          const existingIds = new Set(places.map(p => p.id));
          for (const p of (result2.places || [])) {
            if (!existingIds.has(p.id)) places.push(p);
          }
        }
        // If still fewer than 3, expand to 15 miles
        const FIFTEEN_MILES = 24140.16;
        if (places.length < 3) {
          const result3 = await nearbySearch(rink.latitude, rink.longitude, FIFTEEN_MILES, search.types, 20);
          const existingIds = new Set(places.map(p => p.id));
          for (const p of (result3.places || [])) {
            if (!existingIds.has(p.id)) places.push(p);
          }
        }

        // Categorize and sort (skip permanently closed places)
        for (const place of places) {
          if (place.businessStatus === 'CLOSED_PERMANENTLY') continue;
          const { category, entry } = categorizePlace(place, rink.latitude, rink.longitude);
          if (nearby[category]) nearby[category].push(entry);
        }
      } catch (err) {
        console.error(`    Error (${search.key}): ${err.message}`);
      }
    }

    // Also search for gas stations separately (cheap, 1 request)
    try {
      const gasResult = await nearbySearch(rink.latitude, rink.longitude, FIVE_MILES, ['gas_station'], 5);
      for (const place of (gasResult.places || []).filter(p => p.businessStatus !== 'CLOSED_PERMANENTLY')) {
        const dist = distanceMiles(rink.latitude, rink.longitude, place.location?.latitude || 0, place.location?.longitude || 0);
        nearby.gas.push({
          name: place.displayName?.text || '',
          distance: `${dist.toFixed(1)} mi`,
          url: `https://www.google.com/maps/search/${encodeURIComponent(place.displayName?.text || '')}+near+${encodeURIComponent(`${rink.latitude},${rink.longitude}`)}`,
          distNum: dist,
        });
      }
    } catch {}

    // Sort each category by distance, keep up to 7 closest
    for (const [cat, places] of Object.entries(nearby)) {
      places.sort((a, b) => a.distNum - b.distNum);
      const final = places.slice(0, 7);
      nearby[cat] = final.map(({ distNum, ...rest }) => rest);
    }

    // Save per-rink file
    const nearbyFile = path.join(NEARBY_DIR, `${rink.id}.json`);
    fs.writeFileSync(nearbyFile, JSON.stringify(nearby, null, 2));

    completed.add(rink.id);
    fs.writeFileSync(progressFile, JSON.stringify([...completed]));

    if (i % 50 === 49) logCost();
  }

  console.log(`\n  ✓ Fetched nearby places for ${completed.size} rinks`);
  console.log(`  ✓ Saved to ${NEARBY_DIR}/`);
  logCost();
}

// ═══════════════════════════════════════════
// PHASE 3: Generate signal seed data
// ═══════════════════════════════════════════

// State climate zones for cold signal
const COLD_STATES = {
  arctic: ['AK'],
  frigid: ['MN', 'WI', 'ND', 'SD', 'MT', 'WY', 'ME', 'VT', 'NH'],
  cold: ['MI', 'NY', 'MA', 'CT', 'RI', 'PA', 'OH', 'IN', 'IL', 'IA', 'NE', 'CO', 'ID', 'WA', 'OR', 'NJ', 'DE', 'MD', 'WV'],
  mild: ['VA', 'KY', 'MO', 'KS', 'NM', 'UT', 'NV', 'CA', 'NC', 'TN', 'OK', 'AR'],
  warm: ['TX', 'FL', 'GA', 'SC', 'AL', 'MS', 'LA', 'AZ', 'HI'],
};
function getClimateZone(state) {
  for (const [zone, states] of Object.entries(COLD_STATES)) {
    if (states.includes(state)) return zone;
  }
  return 'mild';
}

const MAJOR_CITIES = new Set([
  'new york', 'los angeles', 'chicago', 'houston', 'phoenix', 'philadelphia',
  'san antonio', 'san diego', 'dallas', 'san jose', 'austin', 'jacksonville',
  'fort worth', 'columbus', 'charlotte', 'indianapolis', 'san francisco',
  'seattle', 'denver', 'washington', 'boston', 'nashville', 'detroit',
  'portland', 'memphis', 'louisville', 'baltimore', 'milwaukee', 'albuquerque',
  'tucson', 'fresno', 'sacramento', 'mesa', 'kansas city', 'atlanta',
  'omaha', 'colorado springs', 'raleigh', 'miami', 'tampa', 'minneapolis',
  'cleveland', 'pittsburgh', 'st louis', 'cincinnati',
]);

function isUrban(city) {
  return MAJOR_CITIES.has((city || '').toLowerCase());
}

function randBetween(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}
function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function generateSignals() {
  console.log('\n═══ Phase 3: Generating signal data ═══\n');

  const rinksFile = path.join(DATA_DIR, 'rinks.json');
  if (!fs.existsSync(rinksFile)) {
    console.error('  Run "discover" phase first.');
    return;
  }
  const rinks = JSON.parse(fs.readFileSync(rinksFile, 'utf8'));

  const signals = {};

  for (const rink of rinks) {
    const urban = isUrban(rink.city);
    const zone = getClimateZone(rink.state);
    const nameL = (rink.name || '').toLowerCase();

    // Determine rink characteristics from name
    const isMultiSheet = /\b(quad|twin|triple|dual|plex|complex|center|centre)\b/i.test(rink.name);
    const isArena = /\b(arena|coliseum|civic|municipal|memorial)\b/i.test(rink.name);

    const s = {};

    // Parking: urban = harder, suburban = easier
    const parkBase = urban ? [1.5, 3.5] : [3.0, 5.0];
    const parkCount = randInt(3, 7);
    s.parking = {
      value: randBetween(parkBase[0], parkBase[1]),
      count: parkCount,
      confidence: Math.round((0.2 + parkCount * 0.1) * 100) / 100,
    };

    // Cold: 1=freezing(bad) to 5=comfortable(good)
    const coldRanges = {
      arctic: [1.0, 2.5],  // freezing spectator areas
      frigid: [1.5, 3.0],
      cold: [2.0, 3.5],
      mild: [2.5, 4.0],
      warm: [3.5, 5.0],   // comfortable, well-heated
    };
    const coldR = coldRanges[zone] || [2.5, 4.0];
    const coldCount = randInt(3, 7);
    s.cold = {
      value: randBetween(coldR[0], coldR[1]),
      count: coldCount,
      confidence: Math.round((0.2 + coldCount * 0.1) * 100) / 100,
    };

    // Food nearby: urban = more options
    const foodBase = urban ? [3.5, 5.0] : [2.0, 4.0];
    const foodCount = randInt(3, 7);
    s.food_nearby = {
      value: randBetween(foodBase[0], foodBase[1]),
      count: foodCount,
      confidence: Math.round((0.2 + foodCount * 0.1) * 100) / 100,
    };

    // Chaos: 1=hectic(bad) to 5=calm(good). Multi-sheet = hectic, small = calm
    const chaosBase = isMultiSheet ? [1.5, 3.5] : (isArena ? [2.0, 4.0] : [3.0, 5.0]);
    const chaosCount = randInt(3, 7);
    s.chaos = {
      value: randBetween(chaosBase[0], chaosBase[1]),
      count: chaosCount,
      confidence: Math.round((0.2 + chaosCount * 0.1) * 100) / 100,
    };

    // Family friendly: generally positive, arenas slightly lower
    const ffBase = isArena ? [2.5, 4.0] : [3.0, 5.0];
    const ffCount = randInt(3, 7);
    s.family_friendly = {
      value: randBetween(ffBase[0], ffBase[1]),
      count: ffCount,
      confidence: Math.round((0.2 + ffCount * 0.1) * 100) / 100,
    };

    // Locker rooms: varied
    const lrCount = randInt(3, 7);
    s.locker_rooms = {
      value: randBetween(2.0, 4.5),
      count: lrCount,
      confidence: Math.round((0.2 + lrCount * 0.1) * 100) / 100,
    };

    // Pro shop: multi-sheet more likely to have good one
    const psBase = isMultiSheet ? [3.0, 5.0] : [1.5, 4.0];
    const psCount = randInt(3, 7);
    s.pro_shop = {
      value: randBetween(psBase[0], psBase[1]),
      count: psCount,
      confidence: Math.round((0.2 + psCount * 0.1) * 100) / 100,
    };

    signals[rink.id] = s;
  }

  const outputFile = path.join(DATA_DIR, 'signals.json');
  fs.writeFileSync(outputFile, JSON.stringify(signals, null, 2));
  console.log(`  ✓ Generated signals for ${rinks.length} rinks`);
  console.log(`  ✓ Saved to ${outputFile}`);
}

// ═══════════════════════════════════════════
// PHASE 4: Integrate with frontend
// ═══════════════════════════════════════════

function integrate() {
  console.log('\n═══ Phase 4: Generating frontend data ═══\n');

  const rinksFile = path.join(DATA_DIR, 'rinks.json');
  const signalsFile = path.join(DATA_DIR, 'signals.json');
  if (!fs.existsSync(rinksFile) || !fs.existsSync(signalsFile)) {
    console.error('  Run discover and signals phases first.');
    return;
  }

  const rinks = JSON.parse(fs.readFileSync(rinksFile, 'utf8'));
  const signals = JSON.parse(fs.readFileSync(signalsFile, 'utf8'));

  // Write a combined rinks index for the frontend
  const rinkIndex = rinks.map(r => ({
    id: r.id,
    name: r.name,
    city: r.city,
    state: r.state,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
  }));

  fs.writeFileSync(path.join(ROOT, 'public', 'data', 'rinks.json'), JSON.stringify(rinkIndex));
  fs.writeFileSync(path.join(ROOT, 'public', 'data', 'signals.json'), JSON.stringify(signals));

  // Stats
  const byState = {};
  for (const r of rinks) {
    byState[r.state] = (byState[r.state] || 0) + 1;
  }
  console.log('  Rinks per state:');
  Object.entries(byState)
    .sort((a, b) => b[1] - a[1])
    .forEach(([state, count]) => console.log(`    ${state}: ${count}`));

  // Check nearby coverage
  const nearbyFiles = fs.readdirSync(NEARBY_DIR).filter(f => f.endsWith('.json'));
  console.log(`\n  ✓ ${rinkIndex.length} rinks in public/data/rinks.json`);
  console.log(`  ✓ ${Object.keys(signals).length} signal sets in public/data/signals.json`);
  console.log(`  ✓ ${nearbyFiles.length} nearby files in public/data/nearby/`);
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(NEARBY_DIR, { recursive: true });
  fs.mkdirSync(path.join(ROOT, 'public', 'data'), { recursive: true });

  const phase = process.argv[2] || 'all';
  console.log(`\nColdStart Rink Seeder — phase: ${phase}`);
  console.log(`API Key: ${API_KEY.slice(0, 10)}...`);

  if (phase === 'discover' || phase === 'all') {
    await discoverRinks();
  }
  if (phase === 'nearby' || phase === 'all') {
    await fetchNearby();
  }
  if (phase === 'signals' || phase === 'all') {
    generateSignals();
  }
  if (phase === 'integrate' || phase === 'all') {
    integrate();
  }

  console.log('\n✓ Done!');
  logCost();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
