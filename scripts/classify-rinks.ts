/**
 * classify-rinks.ts
 *
 * Reads data/rinks.json (raw Google Places data with types array) and classifies
 * each venue as ice_rink, non_ice, or mixed. Outputs:
 *   1. data/rink-classifications.json — audit map { [id]: { venue_type, reason } }
 *   2. public/data/rinks.json — only ice_rink + mixed entries (stripped of types/googlePlaceId)
 *   3. Filters data/signals.json → public/data/signals.json — removes non_ice entries
 *   4. Console summary
 *
 * Usage: npx tsx scripts/classify-rinks.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

interface RawRink {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  types: string[];
}

interface Classification {
  venue_type: 'ice_rink' | 'non_ice' | 'mixed';
  reason: string;
}

// --- Classification rules ---

// Name patterns that clearly indicate a non-ice venue (conservative).
// "Skating center", "skate center", etc. are NOT included because they are
// ambiguous — some ice rinks use these names without the Google ice type.
const NON_ICE_NAME_PATTERNS = [
  /\broller\b/i,
  /\brollerdrome\b/i,
  /\brollerland\b/i,
  /\binline\b/i,
  /\bin-line\b/i,
  /\bskateboard/i,
  /\bskateland\b/i,
  /\bskateworld\b/i,
  /\btrampoline\b/i,
  /\blaser\s?tag\b/i,
  /\bgo[\s-]?kart/i,
  /\bfunplex\b/i,
  /\bwaterpark\b/i,
  /\bwater\s?park\b/i,
];

const ICE_NAME_PATTERNS = [
  /\bice\b/i,
  /\bhockey\b/i,
  /\barena\b/i,
  /\brink\b/i,
  /\bcurling\b/i,
  /\bfigure\s?skat/i,
  /\bfrost\b/i,
  /\bglacier\b/i,
  /\bfreeze\b/i,
  /\bwinter\b/i,
];

const NON_ICE_TYPES = new Set([
  'bowling_alley',
  'skateboard_park',
  'amusement_park',
  'go_karting_venue',
  'video_arcade',
  'indoor_playground',
  'karaoke',
  'amusement_center',
  'miniature_golf_course',
]);

function classify(rink: RawRink): Classification {
  const { name, types } = rink;
  const hasIceType = types.includes('ice_skating_rink');
  const hasNonIceType = types.some((t) => NON_ICE_TYPES.has(t));
  const nameMatchesNonIce = NON_ICE_NAME_PATTERNS.some((p) => p.test(name));
  const nameMatchesIce = ICE_NAME_PATTERNS.some((p) => p.test(name));

  // Has ice_skating_rink type AND non-ice indicators → mixed
  if (hasIceType && (hasNonIceType || nameMatchesNonIce)) {
    const nonIceTypes = types.filter((t) => NON_ICE_TYPES.has(t));
    const reason = nonIceTypes.length
      ? `Has ice_skating_rink + non-ice types: ${nonIceTypes.join(', ')}`
      : `Has ice_skating_rink but name matches non-ice pattern`;
    return { venue_type: 'mixed', reason };
  }

  // Has ice_skating_rink type → ice_rink
  if (hasIceType) {
    return { venue_type: 'ice_rink', reason: 'Has ice_skating_rink type' };
  }

  // No ice_skating_rink type but has non-ice type → non_ice
  if (hasNonIceType) {
    const nonIceTypes = types.filter((t) => NON_ICE_TYPES.has(t));
    return { venue_type: 'non_ice', reason: `Non-ice types: ${nonIceTypes.join(', ')}` };
  }

  // No ice_skating_rink type but name matches non-ice → non_ice
  if (nameMatchesNonIce && !nameMatchesIce) {
    return { venue_type: 'non_ice', reason: 'Name matches non-ice pattern' };
  }

  // No ice_skating_rink type but name matches ice keywords → ice_rink
  if (nameMatchesIce) {
    return { venue_type: 'ice_rink', reason: 'Name contains ice/hockey/arena/rink keyword' };
  }

  // No ice_skating_rink type AND name matches both ice and non-ice → mixed
  if (nameMatchesNonIce && nameMatchesIce) {
    return { venue_type: 'mixed', reason: 'Name matches both ice and non-ice patterns' };
  }

  // Fallback: no clear signal, keep as ice_rink (conservative)
  return { venue_type: 'ice_rink', reason: 'Default — no non-ice indicators found' };
}

// --- Main ---

const rawRinks: RawRink[] = JSON.parse(
  readFileSync(join(ROOT, 'data', 'rinks.json'), 'utf-8')
);

console.log(`Read ${rawRinks.length} entries from data/rinks.json`);

// Classify all entries
const classifications: Record<string, Classification> = {};
for (const rink of rawRinks) {
  classifications[rink.id] = classify(rink);
}

// Write classifications audit file
writeFileSync(
  join(ROOT, 'data', 'rink-classifications.json'),
  JSON.stringify(classifications, null, 2)
);

// Filter: keep ice_rink + mixed, strip types/googlePlaceId for public data
const kept = rawRinks.filter(
  (r) => classifications[r.id].venue_type !== 'non_ice'
);
const publicRinks = kept.map(({ googlePlaceId: _gp, types: _t, ...rest }) => rest);

writeFileSync(
  join(ROOT, 'public', 'data', 'rinks.json'),
  JSON.stringify(publicRinks, null, 2)
);

// Filter signals.json — remove non_ice entries
const signalsPath = join(ROOT, 'data', 'signals.json');
const signals: Record<string, unknown> = JSON.parse(readFileSync(signalsPath, 'utf-8'));
const nonIceIds = new Set(
  Object.entries(classifications)
    .filter(([, c]) => c.venue_type === 'non_ice')
    .map(([id]) => id)
);

const filteredSignals: Record<string, unknown> = {};
for (const [id, data] of Object.entries(signals)) {
  if (!nonIceIds.has(id)) {
    filteredSignals[id] = data;
  }
}
writeFileSync(
  join(ROOT, 'public', 'data', 'signals.json'),
  JSON.stringify(filteredSignals, null, 2)
);

// Summary
const counts = { ice_rink: 0, non_ice: 0, mixed: 0 };
for (const c of Object.values(classifications)) {
  counts[c.venue_type]++;
}

console.log('\n--- Classification Summary ---');
console.log(`  ice_rink: ${counts.ice_rink}`);
console.log(`  non_ice:  ${counts.non_ice}`);
console.log(`  mixed:    ${counts.mixed}`);
console.log(`  total:    ${rawRinks.length}`);
console.log(`\npublic/data/rinks.json:   ${publicRinks.length} entries (was ${rawRinks.length})`);
console.log(`public/data/signals.json: ${Object.keys(filteredSignals).length} entries (was ${Object.keys(signals).length})`);
console.log(`data/rink-classifications.json written`);

// List non_ice entries for review
const nonIceEntries = rawRinks.filter((r) => classifications[r.id].venue_type === 'non_ice');
console.log(`\n--- Non-Ice Venues Removed (${nonIceEntries.length}) ---`);
for (const r of nonIceEntries) {
  console.log(`  ${r.id} | ${r.name} | ${classifications[r.id].reason}`);
}

const mixedEntries = rawRinks.filter((r) => classifications[r.id].venue_type === 'mixed');
if (mixedEntries.length > 0) {
  console.log(`\n--- Mixed Venues Kept (${mixedEntries.length}) ---`);
  for (const r of mixedEntries) {
    console.log(`  ${r.id} | ${r.name} | ${classifications[r.id].reason}`);
  }
}
