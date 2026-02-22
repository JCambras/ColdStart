// ── Signal types and metadata ──

export type SignalType = 'cold' | 'parking' | 'chaos' | 'food_nearby' | 'family_friendly' | 'locker_rooms' | 'pro_shop' | 'heat' | 'dugouts' | 'batting_cages';
export type ContributorType = 'local_parent' | 'visiting_parent';

/**
 * Single source of truth for all signal metadata.
 * shortLabel is used in compact UI (cards, badges). label is used in full UI (signal bars).
 */
export const SIGNAL_META: Record<string, { label: string; shortLabel: string; icon: string; lowLabel: string; highLabel: string; info: string }> = {
  cold: { label: 'Comfort', shortLabel: 'Comfort', icon: '🌡️', lowLabel: 'Freezing', highLabel: 'Comfortable', info: 'How comfortable is the rink temperature for spectators? Lower means bring extra layers — the arena runs cold. Higher means heated seating areas and a comfortable viewing experience.' },
  parking: { label: 'Parking', shortLabel: 'Parking', icon: '🅿️', lowLabel: 'Tough', highLabel: 'Easy', info: 'How easy is it to find parking? Accounts for lot size, overflow options, and how bad it gets during tournaments.' },
  food_nearby: { label: 'Food nearby', shortLabel: 'Food', icon: '🍔', lowLabel: 'None', highLabel: 'Plenty', info: 'Are there food options near the rink? Includes snack bars inside, restaurants within walking distance, and drive-throughs nearby.' },
  chaos: { label: 'Organization', shortLabel: 'Organized', icon: '📋', lowLabel: 'Hectic', highLabel: 'Calm', info: 'How organized and easy to navigate is the rink? Lower means crowded lobbies, confusing layouts, and overlapping game times. Higher means smooth flow and easy wayfinding.' },
  family_friendly: { label: 'Family friendly', shortLabel: 'Family', icon: '👨‍👩‍👧', lowLabel: 'Not great', highLabel: 'Great', info: 'How welcoming is this rink for families with younger kids? Considers seating, bathrooms, play areas, and overall vibe.' },
  locker_rooms: { label: 'Locker rooms', shortLabel: 'Lockers', icon: '🚪', lowLabel: 'Tight', highLabel: 'Spacious', info: 'Are the locker rooms big enough for a full team with bags? Separate ref room? Clean, well-lit, and accessible?' },
  pro_shop: { label: 'Pro shop', shortLabel: 'Pro shop', icon: '🏒', lowLabel: 'Sparse', highLabel: 'Stocked', info: 'Does the rink have a pro shop? Covers tape, laces, skate sharpening, and emergency gear availability on game day.' },
  heat: { label: 'Heat level', shortLabel: 'Heat', icon: '☀️', lowLabel: 'Brutal', highLabel: 'Shaded', info: 'How hot does it get for spectators? Lower means bring sunscreen and water. Higher means covered seating and shade.' },
  dugouts: { label: 'Dugouts', shortLabel: 'Dugouts', icon: '🏟️', lowLabel: 'Basic', highLabel: 'Great', info: 'Are the dugouts properly covered, with benches and bat racks? Enough room for a full team?' },
  batting_cages: { label: 'Batting cages', shortLabel: 'Cages', icon: '⚾', lowLabel: 'None', highLabel: 'Available', info: 'Are there batting cages or warm-up areas available at or near the complex?' },
};

// Derived lookups — kept for backward compatibility, all sourced from SIGNAL_META
export const SIGNAL_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(SIGNAL_META).map(([k, v]) => [k, v.shortLabel])
);

export const SIGNAL_ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(SIGNAL_META).map(([k, v]) => [k, v.icon])
);

/** Hockey signal options for UI selection components */
export const SIGNAL_OPTIONS: { key: SignalType; label: string; icon: string }[] = [
  'parking', 'cold', 'food_nearby', 'chaos', 'family_friendly', 'locker_rooms', 'pro_shop',
].map(key => ({ key: key as SignalType, label: SIGNAL_META[key].shortLabel, icon: SIGNAL_META[key].icon }));

/** Hockey signal display order */
export const SIGNAL_ORDER: SignalType[] = ['parking', 'cold', 'food_nearby', 'chaos', 'family_friendly', 'locker_rooms', 'pro_shop'];

// ── US States ──

export const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'Washington DC',
};

export const HOCKEY_STATES = ['MN', 'MI', 'MA', 'NY', 'PA', 'NJ', 'CT', 'NH', 'WI', 'IL', 'OH', 'CO', 'CA', 'TX', 'FL'];

// ── API ──

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
