import { describe, it, expect } from 'vitest';
import {
  US_STATES,
  SIGNAL_ICONS,
  SIGNAL_ORDER,
  SIGNAL_META,
  HOCKEY_STATES,
} from '../../lib/constants';
import type { SignalType } from '../../lib/constants';

// ── US_STATES ──
describe('US_STATES', () => {
  it('has 51 entries (50 states + DC)', () => {
    expect(Object.keys(US_STATES)).toHaveLength(51);
  });

  it('all keys are 2 uppercase letters', () => {
    for (const key of Object.keys(US_STATES)) {
      expect(key).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('all values are non-empty strings', () => {
    for (const value of Object.values(US_STATES)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

// ── SIGNAL_ICONS ──
describe('SIGNAL_ICONS', () => {
  it('has 7 entries (one per signal type)', () => {
    expect(Object.keys(SIGNAL_ICONS)).toHaveLength(7);
  });

  it('all values are non-empty strings', () => {
    for (const value of Object.values(SIGNAL_ICONS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

// ── SIGNAL_ORDER ──
describe('SIGNAL_ORDER', () => {
  it('has 7 entries matching SignalType values', () => {
    expect(SIGNAL_ORDER).toHaveLength(7);

    const expectedTypes: SignalType[] = [
      'parking', 'cold', 'food_nearby', 'chaos',
      'family_friendly', 'locker_rooms', 'pro_shop',
    ];
    expect(SIGNAL_ORDER).toEqual(expect.arrayContaining(expectedTypes));
  });
});

// ── SIGNAL_META ──
describe('SIGNAL_META', () => {
  const allSignalTypes: SignalType[] = [
    'cold', 'parking', 'chaos', 'food_nearby',
    'family_friendly', 'locker_rooms', 'pro_shop',
  ];

  it('has entries for all 7 signal types', () => {
    expect(Object.keys(SIGNAL_META)).toHaveLength(7);
    for (const type of allSignalTypes) {
      expect(SIGNAL_META[type]).toBeDefined();
    }
  });

  it('each entry has label, icon, lowLabel, highLabel, and info', () => {
    for (const type of allSignalTypes) {
      const meta = SIGNAL_META[type];
      expect(typeof meta.label).toBe('string');
      expect(meta.label.length).toBeGreaterThan(0);
      expect(typeof meta.icon).toBe('string');
      expect(meta.icon.length).toBeGreaterThan(0);
      expect(typeof meta.lowLabel).toBe('string');
      expect(meta.lowLabel.length).toBeGreaterThan(0);
      expect(typeof meta.highLabel).toBe('string');
      expect(meta.highLabel.length).toBeGreaterThan(0);
      expect(typeof meta.info).toBe('string');
      expect(meta.info.length).toBeGreaterThan(0);
    }
  });
});

// ── HOCKEY_STATES ──
describe('HOCKEY_STATES', () => {
  it('contains known hockey states (MN, MA, MI)', () => {
    expect(HOCKEY_STATES).toContain('MN');
    expect(HOCKEY_STATES).toContain('MA');
    expect(HOCKEY_STATES).toContain('MI');
  });
});
