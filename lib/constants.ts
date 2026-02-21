// ── Signal types and metadata ──

export type SignalType = 'cold' | 'parking' | 'chaos' | 'food_nearby' | 'family_friendly' | 'locker_rooms' | 'pro_shop' | 'heat' | 'dugouts' | 'batting_cages';
export type ContributorType = 'local_parent' | 'visiting_parent';

export const SIGNAL_META: Record<string, { label: string; icon: string; lowLabel: string; highLabel: string; info: string }> = {
  cold: { label: 'Cold factor', icon: '❄️', lowLabel: 'Freezing', highLabel: 'Comfortable', info: 'How comfortable is the rink temperature for spectators? Lower means bring extra layers — the arena runs cold. Higher means heated seating areas and a comfortable viewing experience.' },
  parking: { label: 'Parking', icon: '🅿️', lowLabel: 'Tough', highLabel: 'Easy', info: 'How easy is it to find parking? Accounts for lot size, overflow options, and how bad it gets during tournaments.' },
  food_nearby: { label: 'Food nearby', icon: '🍔', lowLabel: 'None', highLabel: 'Plenty', info: 'Are there food options near the rink? Includes snack bars inside, restaurants within walking distance, and drive-throughs nearby.' },
  chaos: { label: 'Chaos level', icon: '🌀', lowLabel: 'Hectic', highLabel: 'Calm', info: 'How organized and easy to navigate is the rink? Lower means crowded lobbies, confusing layouts, and overlapping game times. Higher means smooth flow and easy wayfinding.' },
  family_friendly: { label: 'Family friendly', icon: '👨‍👩‍👧', lowLabel: 'Not great', highLabel: 'Great', info: 'How welcoming is this rink for families with younger kids? Considers seating, bathrooms, play areas, and overall vibe.' },
  locker_rooms: { label: 'Locker rooms', icon: '🚪', lowLabel: 'Tight', highLabel: 'Spacious', info: 'Are the locker rooms big enough for a full team with bags? Separate ref room? Clean, well-lit, and accessible?' },
  pro_shop: { label: 'Pro shop', icon: '🏒', lowLabel: 'Sparse', highLabel: 'Stocked', info: 'Does the rink have a pro shop? Covers tape, laces, skate sharpening, and emergency gear availability on game day.' },
  heat: { label: 'Heat level', icon: '☀️', lowLabel: 'Brutal', highLabel: 'Shaded', info: 'How hot does it get for spectators? Lower means bring sunscreen and water. Higher means covered seating and shade.' },
  dugouts: { label: 'Dugouts', icon: '🏟️', lowLabel: 'Basic', highLabel: 'Great', info: 'Are the dugouts properly covered, with benches and bat racks? Enough room for a full team?' },
  batting_cages: { label: 'Batting cages', icon: '⚾', lowLabel: 'None', highLabel: 'Available', info: 'Are there batting cages or warm-up areas available at or near the complex?' },
};

export const SIGNAL_LABELS: Record<string, string> = {
  cold: 'Cold',
  parking: 'Parking',
  food_nearby: 'Food',
  chaos: 'Chaos',
  family_friendly: 'Family',
  locker_rooms: 'Lockers',
  pro_shop: 'Pro shop',
  heat: 'Heat',
  dugouts: 'Dugouts',
  batting_cages: 'Cages',
};

export const SIGNAL_ICONS: Record<string, string> = {
  parking: '🅿️',
  cold: '❄️',
  food_nearby: '🍔',
  chaos: '🌀',
  family_friendly: '👨‍👩‍👧',
  locker_rooms: '🚪',
  pro_shop: '🏒',
  heat: '☀️',
  dugouts: '🏟️',
  batting_cages: '⚾',
};

export const SIGNAL_OPTIONS: { key: SignalType; label: string; icon: string }[] = [
  { key: 'parking', label: 'Parking', icon: '🅿️' },
  { key: 'cold', label: 'Cold', icon: '❄️' },
  { key: 'food_nearby', label: 'Food', icon: '🍔' },
  { key: 'chaos', label: 'Chaos', icon: '🌀' },
  { key: 'family_friendly', label: 'Family', icon: '👨‍👩‍👧' },
  { key: 'locker_rooms', label: 'Lockers', icon: '🚪' },
  { key: 'pro_shop', label: 'Pro shop', icon: '🏒' },
  { key: 'heat', label: 'Heat', icon: '☀️' },
  { key: 'dugouts', label: 'Dugouts', icon: '🏟️' },
  { key: 'batting_cages', label: 'Cages', icon: '⚾' },
];

export const SIGNAL_ORDER: SignalType[] = ['parking', 'cold', 'food_nearby', 'chaos', 'family_friendly', 'locker_rooms', 'pro_shop', 'heat', 'dugouts', 'batting_cages'];

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

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
