// Venue configuration — single source of truth for all venue-type-specific constants.
// To adapt ColdStart for a different venue type (fields, gyms, courts),
// change the values here and every UI label, signal list, and verdict
// string updates automatically.

import type { SignalType } from './constants';
import { BASEBALL_CONFIG } from './baseballConfig';

export interface VenueConfig {
  venueType: string;            // 'rink' | 'field' | 'gym'
  venueName: string;            // 'Rink' (for UI labels)
  venueNamePlural: string;      // 'Rinks'
  sport: string;                // 'hockey'
  sportAdjective: string;       // 'hockey' (for "hockey parents")
  communityNoun: string;        // 'parents'
  signals: SignalType[];        // the ordered signal list
  verdicts: { good: string; mixed: string; bad: string; none: string };
}

export const VENUE_CONFIG: VenueConfig = {
  venueType: 'rink',
  venueName: 'Rink',
  venueNamePlural: 'Rinks',
  sport: 'hockey',
  sportAdjective: 'hockey',
  communityNoun: 'parents',
  signals: ['parking', 'cold', 'food_nearby', 'chaos', 'family_friendly', 'locker_rooms', 'pro_shop'],
  verdicts: {
    good: 'Good rink overall',
    mixed: 'Mixed reviews',
    bad: 'Heads up — some issues reported',
    none: 'No ratings yet',
  },
};

const VENUE_CONFIGS: Record<string, VenueConfig> = {
  hockey: VENUE_CONFIG,
  baseball: BASEBALL_CONFIG,
};

export function getVenueConfig(sport: string = 'hockey'): VenueConfig {
  return VENUE_CONFIGS[sport] || VENUE_CONFIG;
}
