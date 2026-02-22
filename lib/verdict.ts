import { VENUE_CONFIG } from './venueConfig';

/** Verdict thresholds — single source of truth */
const GOOD_THRESHOLD = 3.8;
const MIXED_THRESHOLD = 3.0;

/**
 * Compute the venue verdict string from average rating and total count.
 */
export function computeVerdict(overallAvg: number, totalCount: number): string {
  if (totalCount === 0) return VENUE_CONFIG.verdicts.none;
  if (overallAvg >= GOOD_THRESHOLD) return VENUE_CONFIG.verdicts.good;
  if (overallAvg >= MIXED_THRESHOLD) return VENUE_CONFIG.verdicts.mixed;
  return VENUE_CONFIG.verdicts.bad;
}

/**
 * Compute signal confidence from rating count.
 * Returns a value between 0 and 1.
 */
export function computeConfidence(count: number): number {
  return Math.min(1, 0.2 + count * 0.1);
}
