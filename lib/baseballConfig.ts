import type { VenueConfig } from './venueConfig';

export type BaseballSignalType = 'parking' | 'heat' | 'food_nearby' | 'chaos' | 'family_friendly' | 'dugouts' | 'batting_cages';

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
