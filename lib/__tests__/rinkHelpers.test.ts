import { describe, it, expect } from 'vitest';
import {
  getVerdictColor,
  getVerdictBg,
  getBarColor,
  timeAgo,
  getRinkSlug,
  ensureAllSignals,
  buildRinkDetailFromSeed,
} from '../rinkHelpers';
import type { Signal, Rink } from '../rinkTypes';

// ── getVerdictColor ──
describe('getVerdictColor', () => {
  it('returns green for positive verdicts', () => {
    expect(getVerdictColor('Good to go')).toBe('#16a34a');
    expect(getVerdictColor('Good — no issues')).toBe('#16a34a');
  });

  it('returns amber for heads-up verdicts', () => {
    expect(getVerdictColor('Heads up — parking is tight')).toBe('#d97706');
  });

  it('returns orange for mixed verdicts', () => {
    expect(getVerdictColor('Mixed reviews')).toBe('#ea580c');
  });

  it('returns gray for neutral/unknown verdicts', () => {
    expect(getVerdictColor('No data yet')).toBe('#6b7280');
    expect(getVerdictColor('')).toBe('#6b7280');
  });
});

// ── getVerdictBg ──
describe('getVerdictBg', () => {
  it('returns correct backgrounds', () => {
    expect(getVerdictBg('Good to go')).toBe('#f0fdf4');
    expect(getVerdictBg('Heads up')).toBe('#fffbeb');
    expect(getVerdictBg('Mixed')).toBe('#fff7ed');
    expect(getVerdictBg('Unknown')).toBe('#f9fafb');
  });
});

// ── getBarColor ──
describe('getBarColor', () => {
  it('returns iceExcellent for values >= 4.5', () => {
    expect(getBarColor(5.0)).toBe('#16A34A');
    expect(getBarColor(4.5)).toBe('#16A34A');
  });

  it('returns iceGood for values >= 3.5', () => {
    expect(getBarColor(4.0)).toBe('#22C55E');
    expect(getBarColor(3.5)).toBe('#22C55E');
  });

  it('returns iceFair for values >= 2.5', () => {
    expect(getBarColor(3.0)).toBe('#F59E0B');
    expect(getBarColor(2.5)).toBe('#F59E0B');
  });

  it('returns icePoor for low values', () => {
    expect(getBarColor(2.0)).toBe('#EF4444');
    expect(getBarColor(1.0)).toBe('#EF4444');
  });

  it('returns iceNodata when count < 3', () => {
    expect(getBarColor(4.0, 2)).toBe('#94A3B8');
    expect(getBarColor(4.0, 0)).toBe('#94A3B8');
  });

  it('uses value thresholds when count >= 3', () => {
    expect(getBarColor(4.5, 5)).toBe('#16A34A');
    expect(getBarColor(3.5, 3)).toBe('#22C55E');
  });
});

// ── timeAgo ──
describe('timeAgo', () => {
  it('returns "just now" for recent dates', () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe('just now');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe('3h ago');
  });

  it('returns days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe('2d ago');
  });

  it('returns formatted date for old dates', () => {
    const oldDate = new Date('2025-01-15T12:00:00Z').toISOString();
    const result = timeAgo(oldDate);
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });
});

// ── getRinkSlug ──
describe('getRinkSlug', () => {
  it('returns hardcoded slug for known rinks', () => {
    const bww: Rink = { id: '1', name: 'Buffalo Wings & Rings', city: 'Buffalo', state: 'NY', address: '', latitude: null, longitude: null, created_at: '' };
    expect(getRinkSlug(bww)).toBe('bww');
  });

  it('returns hardcoded slug for Ice Line', () => {
    const iceLine: Rink = { id: '2', name: 'Ice Line Quad Rinks', city: 'West Chester', state: 'PA', address: '', latitude: null, longitude: null, created_at: '' };
    expect(getRinkSlug(iceLine)).toBe('ice-line');
  });

  it('generates slug from name and city', () => {
    const rink: Rink = { id: '3', name: 'Twin Oaks Ice Arena', city: 'Morristown', state: 'NJ', address: '', latitude: null, longitude: null, created_at: '' };
    expect(getRinkSlug(rink)).toBe('twin-oaks-ice-arena-morristown');
  });

  it('handles special characters', () => {
    const rink: Rink = { id: '4', name: "O'Brien's Rink", city: 'St. Paul', state: 'MN', address: '', latitude: null, longitude: null, created_at: '' };
    const slug = getRinkSlug(rink);
    expect(slug).not.toContain("'");
    expect(slug).not.toContain('.');
  });
});

// ── ensureAllSignals ──
describe('ensureAllSignals', () => {
  it('passes through existing signals unchanged', () => {
    const signals: Signal[] = [
      { signal: 'parking', value: 4.2, confidence: 0.8, count: 10 },
    ];
    const result = ensureAllSignals(signals, 'unknown-rink');
    expect(result).toContain(signals[0]);
  });

  it('does not duplicate existing signals', () => {
    const signals: Signal[] = [
      { signal: 'parking', value: 4.2, confidence: 0.8, count: 10 },
      { signal: 'cold', value: 3.0, confidence: 0.6, count: 5 },
    ];
    const result = ensureAllSignals(signals, 'unknown-rink');
    const parkingCount = result.filter(s => s.signal === 'parking').length;
    expect(parkingCount).toBe(1);
  });
});

// ── buildRinkDetailFromSeed ──
describe('buildRinkDetailFromSeed', () => {
  const seedRinks = [
    { id: 'rink_1', name: 'Test Rink', address: '123 Main St', city: 'TestCity', state: 'PA', latitude: 40.0, longitude: -75.0 },
    { id: 'rink_2', name: 'Other Rink', address: '456 Oak Ave', city: 'OtherCity', state: 'NJ', latitude: 41.0, longitude: -74.0 },
  ];

  const seedSignals = {
    rink_1: {
      parking: { value: 4.2, count: 12, confidence: 0.85 },
      cold: { value: 2.8, count: 8, confidence: 0.72 },
    },
  };

  it('returns null for unknown rink', () => {
    expect(buildRinkDetailFromSeed('rink_999', seedRinks)).toBeNull();
  });

  it('builds detail with rink data', () => {
    const detail = buildRinkDetailFromSeed('rink_1', seedRinks);
    expect(detail).not.toBeNull();
    expect(detail!.rink.name).toBe('Test Rink');
    expect(detail!.rink.city).toBe('TestCity');
    expect(detail!.rink.state).toBe('PA');
  });

  it('includes signals when provided', () => {
    const detail = buildRinkDetailFromSeed('rink_1', seedRinks, seedSignals);
    expect(detail).not.toBeNull();
    expect(detail!.summary.signals.length).toBe(2);
    const parking = detail!.summary.signals.find(s => s.signal === 'parking');
    expect(parking).toBeDefined();
    expect(parking!.value).toBe(4.2);
  });

  it('returns empty signals for rink without signal data', () => {
    const detail = buildRinkDetailFromSeed('rink_2', seedRinks, seedSignals);
    expect(detail).not.toBeNull();
    expect(detail!.summary.signals.length).toBe(0);
  });

  it('calculates contribution_count from signal counts', () => {
    const detail = buildRinkDetailFromSeed('rink_1', seedRinks, seedSignals);
    expect(detail!.summary.contribution_count).toBe(20); // 12 + 8
  });
});
