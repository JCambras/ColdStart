import { describe, it, expect } from 'vitest';
import { colors, text, radius, layout, shadow, transition, nav } from '../theme';

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
      Object.keys(radius).length +
      Object.keys(layout).length +
      Object.keys(shadow).length +
      Object.keys(transition).length +
      Object.keys(nav).length;
    expect(total).toBe(105);
  });
});
