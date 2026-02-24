import { describe, it, expect } from 'vitest';
import { colors, text, spacing, radius, layout, shadow, transition, nav, pad } from '../theme';

describe('theme tokens', () => {
  it('all color values are non-empty strings', () => {
    for (const [, value] of Object.entries(colors)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('all text sizes are positive numbers', () => {
    for (const [, value] of Object.entries(text)) {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    }
  });

  it('all spacing values are non-negative numbers in ascending order', () => {
    const values = Object.values(spacing);
    for (const value of values) {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
    }
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it('pad() builds CSS spacing strings', () => {
    expect(pad(8)).toBe('8px');
    expect(pad(10, 14)).toBe('10px 14px');
    expect(pad(8, 12, 8, 12)).toBe('8px 12px 8px 12px');
  });

  it('all radius values are positive numbers or "50%"', () => {
    for (const [, value] of Object.entries(radius)) {
      if (typeof value === 'number') {
        expect(value).toBeGreaterThan(0);
      } else {
        expect(value).toBe('50%');
      }
    }
  });

  it('layout max widths are ascending', () => {
    expect(layout.maxWidthNarrow).toBeLessThan(layout.maxWidthDefault);
    expect(layout.maxWidthDefault).toBeLessThan(layout.maxWidthWide);
    expect(layout.maxWidthWide).toBeLessThan(layout.maxWidthFull);
  });

  it('shadow values are non-empty strings', () => {
    for (const [, value] of Object.entries(shadow)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('transition values are non-empty strings', () => {
    for (const [, value] of Object.entries(transition)) {
      expect(typeof value).toBe('string');
      expect(value).toContain('ease');
    }
  });

  it('nav tokens are non-empty strings', () => {
    expect(typeof nav.bg).toBe('string');
    expect(nav.bg.length).toBeGreaterThan(0);
    expect(nav.blur).toContain('blur');
  });

  it('has the expected total number of tokens', () => {
    const total =
      Object.keys(colors).length +
      Object.keys(text).length +
      Object.keys(spacing).length +
      Object.keys(radius).length +
      Object.keys(layout).length +
      Object.keys(shadow).length +
      Object.keys(transition).length +
      Object.keys(nav).length;
    expect(total).toBe(127);
  });
});
