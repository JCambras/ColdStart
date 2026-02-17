#!/usr/bin/env node
/**
 * Cleanup nearby data for rinks in target states.
 * Fixes: duplicates, Airbnb as hotels, McDonald's/gas stations as coffee,
 * big-box stores as restaurants, splash pads spam, etc.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'public/data');
const NEARBY_DIR = join(DATA_DIR, 'nearby');
const TARGET_STATES = ['PA', 'NJ', 'NY', 'IL', 'MA', 'MD', 'VA', 'CT'];

// ── Patterns for filtering bad entries ──

// Not real coffee shops (bars, gas stations, big-box, pharmacies)
const NOT_COFFEE = [
  /^mcdonald/i, /^burger king/i, /^wendy/i, /^wawa$/i, /^sheetz$/i,
  /^7-eleven/i, /^speedway/i, /^shell$/i, /^sunoco$/i, /^exxon/i,
  /^bp$/i, /^citgo/i, /^getty/i, /^circle k/i, /^cumberland farms/i,
  /^royal farms/i, /^racetrac/i, /^quickchek/i, /^turkey hill/i,
  /gas\s*(station|kiosk)/i, /^sam'?s club/i, /^walmart/i, /^costco/i,
  /^target$/i, /^rite aid/i, /^cvs/i, /^walgreens/i,
  // Bars, breweries, pubs — not coffee shops
  // BUT keep "coffee bar", "espresso bar", "smoothie bar", "crepe bar", "juice bar"
  /\balehouse\b/i, /\btap\s*(house|room)\b/i,
  /\bpub\b/i, /\btavern\b/i, /\bwine\s*bar\b/i,
  /\bbeer\s*(garden|hall)\b/i, /\bsaloon\b/i, /\bbrewery\b/i,
  /\bbiergarten\b/i, /\bdraughthouse\b/i,
  /\brestaurant\s*(and|&)\s*bar\b/i,  // "Severina Restaurant and Bar"
  /\bcafe\s*(and|&)\s*bar\b/i,        // "Chit Chaat Cafe & Bar"
  /\bbar\s*(and|&)\s*grill\b/i,       // "Bar & Grill"
  /\bgrill\s*cafe\b/i,                // "Illusion Bar Grill Cafe"
  /\bbrew\s*(pub|house|ery|haus)\b/i,  // "Germania Brew Haus"
  /\bcafé?\s*-?\s*bar\b(?!.*coffee)(?!.*espresso)/i,  // "Tartinery Café - Bar" but not "Cafe Bar with coffee"
  /\bcafe\s*bar\s*popularr/i,         // Known misclassification
];

// Not real hotels (Airbnb, vacation rentals, apartments, etc.)
const NOT_HOTEL = [
  /airbnb/i, /vacation\s*(rental|home)/i, /vrbo/i,
  /\bapartments?\b/i, /\bapt\b/i, /\bcondos?\b/i, /\blofts?\b/i,
  /\bbedrooms?\b/i, /\bbdrms?\b/i, /\bbdr\b/i, /\bbed\s*rooms?\b/i,
  /sleeps?\s*\d+/i, /\bbig\s*group\b/i,
  /\bcozy\b/i, /\bcharming\b/i, /\blovely\b/i, /\bspacious\b/i,
  /\bstylish\b/i, /\bsunny\b/i, /\bsplendid\b/i,
  /\bluxury\s*stay\b/i, /\bbright\s*(and|&)\s*(comfy|cozy)\b/i,
  /\b\d+\s*bed(room)?s?\s*\d*\s*ba(th|d)/i,  // "3 bedrooms 2 bath"
  /\bprivate\s*(rooms?|suites?|guest|entrance|space)\b/i,
  /\bguest\s*(house|suite|room)\b/i,
  /\bwhole\s*(home|house|apt|apartment)\b/i,
  /\bentire\s*(home|house|apt|apartment|place|unit)\b/i,
  /\bmin(ute)?s?\s*(to|from|away|or\s*less)\b/i,
  /\bconcrete\s*jungle\b/i,
  /\bthe\s*rootstock\s*ranch\b/i, /\bvillage\s*green$/i,
  /\bcloset\s*space\b/i, /\bfeet\s*of\b/i,
  /\bpath\s*to\s*manhattan\b/i,
  /\bblock[s]?\s*(from|to|away)\b/i,
  /\bwalk\s*(to|from)\b/i,
  /\bnear\s*(subway|train|bus|metro|transit|downtown|city|times\s*square)\b/i,
  /\bsteps?\s*(from|to|away)\b/i,
  /\b(room|studio|flat|space|place|home|house|loft)\s*(in|near|close|by)\s/i,
  /\bkitchen/i, /\bfurnished\b/i,
  /\bmobile\s*home\b/i, /\btownhouse\b/i,
  /\bwasher\b/i, /\bdryer\b/i, /\bwifi\b/i,
  /\bcentral\s*park\b.*\b(view|near)\b/i,
  /\btimes\s*square\b/i,
  /\bself\s*check\s*in\b/i,
  /\bretreat\b/i,
  /\bhome\s*away\b/i,
  /\bfire\s*pit\b/i,
  /\bpet\s*friendly\b/i,  // "Pet Friendly Tropical Apartment"
  /\bwith\s*(yard|pool|porch|deck|patio|parking|garden)\b/i,
  /\bremodeled\b/i,
  /\b(fun|retro|tropical|quiet)\s*(apartment|home|house|place)\b/i,
  /\bgetaway\b/i,
  /\bhaven\b/i,  // "The Green Haven"
  /\bnest\b/i,   // "Owl's Nest"
  /\bconfidence:/i,  // "Confidence: 4BR..."
  /\bholiday\s*home\b/i,
  /\baccommodation\b/i,
  /\bspaciously\b/i,
  /\b\d+\s*BR\b/i,   // "4 BR, 2 BA" abbreviation
  /\blake\s*house\b/i,
  // Generic/suspicious hotel names (just a city, state, or "Hotel" alone)
  /^hotel$/i,
  /^\w+\s+(NY|NJ|PA|CT|MA|MD|VA|IL)$/i,  // "Saugerties NY" — just a city + state
];

// Suspicious names that are too short/generic for any category
// Note: "bp" and "76" are legitimate gas stations — handled separately
const JUNK_NAMES = [
  /^hotel$/i,
  /^fountain$/i,
  /^parking$/i, /^parking\s*(lot|garage|structure)$/i,
  /^atm$/i,
  /^.{1}$/i,    // Single-character names like "A"
  /^[a-z]{2}$/i, // Two-letter names like "jw", "LB" (except gas where "bp" is valid)
];

// Not real dinner restaurants
const NOT_DINNER = [
  /^sam'?s club/i, /^walmart/i, /^costco/i, /^target$/i,
  /bakery\s*department/i, /\bdeli\s*counter\b/i,
  /^rite aid/i, /^cvs/i, /^walgreens/i,
];

// Not real fun/entertainment
const NOT_FUN = [
  /\bstate\s*sign\b/i, /\bwelcome\s*(to|sign)\b/i,
  /\bhistorical?\s*(marker|sign|plaque)\b/i,
  /\bmonument\b/i,
  /^downtown\b/i,                     // "Downtown Morristown" — just a Google pin
  /\btrain\s*station\b/i,             // "West Chester University Train Station"
  /\bparking\s*(lot|garage|structure)?\b/i,  // "Point of view parking lot"
  /^fountain$/i,                       // Just a fountain pin
  /\bmural$/i,                         // "Downtown Ithaca Mural"
];

// ── Cleanup functions ──

function removeDuplicates(places) {
  const seen = new Set();
  return places.filter(p => {
    // Key by name + place_id (or name alone if no place_id)
    const placeId = p.url?.match(/query_place_id=([^&]+)/)?.[1];
    const key = placeId ? `${p.name}::${placeId}` : p.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function removeByPattern(places, patterns) {
  return places.filter(p =>
    !patterns.some(re => re.test(p.name))
  );
}

function limitEntries(places, max) {
  return places.slice(0, max);
}

function cleanCategory(places, { notPatterns = [], maxEntries = 8, skipJunkFilter = false } = {}) {
  let cleaned = removeDuplicates(places);
  // Remove junk/generic names (skip for gas where "bp", "76" are valid)
  if (!skipJunkFilter) {
    cleaned = removeByPattern(cleaned, JUNK_NAMES);
  }
  if (notPatterns.length > 0) {
    cleaned = removeByPattern(cleaned, notPatterns);
  }
  return limitEntries(cleaned, maxEntries);
}

function cleanNearbyData(data) {
  const result = {};

  // Quick bite: just dedup, limit to 6
  if (data.quick_bite) {
    result.quick_bite = cleanCategory(data.quick_bite, { maxEntries: 6 });
  }

  // Coffee: remove non-coffee places, dedup, limit to 5
  if (data.coffee) {
    result.coffee = cleanCategory(data.coffee, { notPatterns: NOT_COFFEE, maxEntries: 5 });
  }

  // Team lunch: remove non-restaurants, dedup, limit to 6
  if (data.team_lunch) {
    result.team_lunch = cleanCategory(data.team_lunch, { notPatterns: NOT_DINNER, maxEntries: 6 });
  }

  // Dinner: remove non-restaurants, dedup, limit to 6
  if (data.dinner) {
    result.dinner = cleanCategory(data.dinner, { notPatterns: NOT_DINNER, maxEntries: 6 });
  }

  // Bowling: dedup, limit to 3
  if (data.bowling) {
    result.bowling = cleanCategory(data.bowling, { maxEntries: 3 });
  }

  // Arcade: dedup, limit to 3
  if (data.arcade) {
    result.arcade = cleanCategory(data.arcade, { maxEntries: 3 });
  }

  // Movies: dedup, limit to 3
  if (data.movies) {
    result.movies = cleanCategory(data.movies, { maxEntries: 3 });
  }

  // Fun: remove signs/monuments, dedup splash pads, limit to 4
  if (data.fun) {
    let fun = removeDuplicates(data.fun);
    fun = removeByPattern(fun, NOT_FUN);
    // Extra dedup: remove multiple "splash pad" type entries
    const splashSeen = new Set();
    fun = fun.filter(p => {
      const isSplash = /splash\s*pad/i.test(p.name);
      if (isSplash) {
        if (splashSeen.size > 0) return false;
        splashSeen.add(p.name);
      }
      return true;
    });
    result.fun = limitEntries(fun, 4);
  }

  // Hotels: remove Airbnb/vacation rentals, dedup, limit to 6
  if (data.hotels) {
    result.hotels = cleanCategory(data.hotels, { notPatterns: NOT_HOTEL, maxEntries: 6 });
  }

  // Gas: dedup, limit to 4 (skip junk filter — "bp" and "76" are valid gas stations)
  if (data.gas) {
    result.gas = cleanCategory(data.gas, { maxEntries: 4, skipJunkFilter: true });
  }

  return result;
}

// ── Main ──

function main() {
  // Load rinks database
  const rinks = JSON.parse(readFileSync(join(DATA_DIR, 'rinks.json'), 'utf8'));

  // Filter to target states
  const targetRinks = rinks.filter(r => TARGET_STATES.includes(r.state));
  console.log(`Found ${targetRinks.length} rinks in ${TARGET_STATES.join(', ')}`);

  let updated = 0;
  let skipped = 0;
  let missing = 0;
  let totalDupsRemoved = 0;
  let totalBadRemoved = 0;

  for (const rink of targetRinks) {
    const filePath = join(NEARBY_DIR, `${rink.id}.json`);
    if (!existsSync(filePath)) {
      missing++;
      continue;
    }

    let data;
    try {
      data = JSON.parse(readFileSync(filePath, 'utf8'));
    } catch {
      skipped++;
      continue;
    }

    // Count entries before
    const beforeCount = Object.values(data).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

    const cleaned = cleanNearbyData(data);

    // Count entries after
    const afterCount = Object.values(cleaned).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    const removed = beforeCount - afterCount;

    if (removed > 0) {
      totalDupsRemoved += removed;
      writeFileSync(filePath, JSON.stringify(cleaned, null, 2) + '\n');
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`\nResults:`);
  console.log(`  Updated: ${updated} files`);
  console.log(`  Skipped (no changes): ${skipped} files`);
  console.log(`  Missing: ${missing} files`);
  console.log(`  Total entries removed: ${totalDupsRemoved}`);
}

main();
