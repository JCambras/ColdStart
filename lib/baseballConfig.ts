import type { VenueConfig } from './venueConfig';

export type BaseballSignalType = 'parking' | 'heat' | 'food_nearby' | 'chaos' | 'family_friendly' | 'dugouts' | 'batting_cages';

export const BASEBALL_SIGNAL_META: Record<string, { label: string; icon: string; lowLabel: string; highLabel: string; info: string }> = {
  parking: { label: 'Parking', icon: '🅿️', lowLabel: 'Tough', highLabel: 'Easy', info: 'How easy is it to find parking? Accounts for lot size and overflow options during tournament weekends.' },
  heat: { label: 'Heat level', icon: '☀️', lowLabel: 'Brutal', highLabel: 'Shaded', info: 'How hot does it get for spectators? Lower means bring sunscreen and water — no shade. Higher means covered seating and shade trees.' },
  food_nearby: { label: 'Food nearby', icon: '🍔', lowLabel: 'None', highLabel: 'Plenty', info: 'Are there food options near the field? Includes snack bars, concessions, restaurants within walking distance.' },
  chaos: { label: 'Chaos level', icon: '🌀', lowLabel: 'Hectic', highLabel: 'Calm', info: 'How organized is the complex? Lower means confusing field numbers, crowded walkways, and overlapping game times.' },
  family_friendly: { label: 'Family friendly', icon: '👨‍👩‍👧', lowLabel: 'Not great', highLabel: 'Great', info: 'How welcoming is this field for families with younger kids? Considers seating, bathrooms, play areas, and overall vibe.' },
  dugouts: { label: 'Dugouts', icon: '🏟️', lowLabel: 'Basic', highLabel: 'Great', info: 'Are the dugouts properly covered, with benches and bat racks? Enough room for a full team and gear?' },
  batting_cages: { label: 'Batting cages', icon: '⚾', lowLabel: 'None', highLabel: 'Available', info: 'Are there batting cages or warm-up areas available at or near the complex?' },
};

export const BASEBALL_SIGNAL_LABELS: Record<string, string> = {
  parking: 'Parking',
  heat: 'Heat',
  food_nearby: 'Food',
  chaos: 'Chaos',
  family_friendly: 'Family',
  dugouts: 'Dugouts',
  batting_cages: 'Cages',
};

export const BASEBALL_SIGNAL_ICONS: Record<string, string> = {
  parking: '🅿️',
  heat: '☀️',
  food_nearby: '🍔',
  chaos: '🌀',
  family_friendly: '👨‍👩‍👧',
  dugouts: '🏟️',
  batting_cages: '⚾',
};

export const BASEBALL_CONFIG: VenueConfig = {
  venueType: 'field',
  venueName: 'Field',
  venueNamePlural: 'Fields',
  sport: 'baseball',
  sportAdjective: 'baseball',
  communityNoun: 'parents',
  signals: ['parking', 'heat', 'food_nearby', 'chaos', 'family_friendly', 'dugouts', 'batting_cages'] as VenueConfig['signals'],
  verdicts: {
    good: 'Great field overall',
    mixed: 'Mixed reviews',
    bad: 'Heads up — some issues reported',
    none: 'No ratings yet',
  },
};
