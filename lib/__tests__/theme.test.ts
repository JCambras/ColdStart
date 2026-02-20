import { describe, it, expect } from 'vitest';
import { colors, text, radius, layout, shadow, transition, nav } from '../theme';

describe('theme tokens', () => {
  it('all color values are valid hex colors', () => {
    for (const [, value] of Object.entries(colors)) {
      expect(value).toMatch(/^#[0-9a-f]{6}$/i);
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
    expect(nav.bg).toContain('rgba');
    expect(nav.blur).toContain('blur');
  });
});
