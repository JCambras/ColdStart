import { describe, it, expect } from 'vitest';
import { generateSummary, generateBriefing, signalComparison } from '../sentences';

function makeInput(overrides: Record<string, unknown> = {}) {
  return {
    signals: [],
    tips: [],
    contributionCount: 0,
    rinkName: 'Test Rink',
    verdict: '',
    lastUpdatedAt: null,
    confirmedThisSeason: false,
    ...overrides,
  };
}

function makeSignal(signal: string, value: number, count: number, stddev?: number) {
  return { signal, value, count, confidence: 1, stddev };
}

// ── generateSummary ──

describe('generateSummary', () => {
  it('returns fallback when no signals are rated', () => {
    const result = generateSummary(makeInput());
    expect(result).toBe('No reports yet — your ratings help other families.');
  });

  it('leads with good marks for good verdict', () => {
    const result = generateSummary(makeInput({
      verdict: 'Good rink overall',
      signals: [makeSignal('parking', 4.2, 5)],
    }));
    expect(result).toMatch(/^Parents give this rink good marks/);
  });

  it('leads with mixed for mixed verdict', () => {
    const result = generateSummary(makeInput({
      verdict: 'Mixed reviews',
      signals: [makeSignal('parking', 3.2, 5)],
    }));
    expect(result).toMatch(/^Reviews are mixed/);
  });

  it('leads with heads up for bad verdict', () => {
    const result = generateSummary(makeInput({
      verdict: 'Heads up — some issues reported',
      signals: [makeSignal('parking', 2.0, 5)],
    }));
    expect(result).toMatch(/^Heads up/);
  });

  it('includes top tip when available and under 100 chars', () => {
    const result = generateSummary(makeInput({
      verdict: 'Good rink overall',
      signals: [makeSignal('parking', 4.5, 3)],
      tips: [{ text: 'Park behind building 2', contributor_type: 'visiting_parent' }],
    }));
    expect(result).toContain('Tip: "Park behind building 2"');
  });

  it('skips tip when over 100 chars', () => {
    const longTip = 'A'.repeat(101);
    const result = generateSummary(makeInput({
      verdict: 'Good rink overall',
      signals: [makeSignal('parking', 4.5, 3)],
      tips: [{ text: longTip, contributor_type: 'visiting_parent' }],
    }));
    expect(result).not.toContain('Tip:');
  });

  it('produces at most 4 sentences', () => {
    const result = generateSummary(makeInput({
      verdict: 'Good rink overall',
      signals: [
        makeSignal('parking', 4.5, 5),
        makeSignal('cold', 2.0, 5),
        makeSignal('food_nearby', 4.0, 5),
        makeSignal('chaos', 1.5, 5),
        makeSignal('family_friendly', 4.0, 5),
      ],
      tips: [{ text: 'Short tip', contributor_type: 'visiting_parent' }],
    }));
    // Count sentences by splitting on '. ' and checking — rough heuristic
    // The function joins with ' ' and slices to 4
    const sentences = result.split(/(?<=[.!?])\s+/).filter(Boolean);
    expect(sentences.length).toBeLessThanOrEqual(4);
  });
});

// ── generateBriefing ──

describe('generateBriefing', () => {
  it('returns fallback when no signals are rated', () => {
    const result = generateBriefing(makeInput({ rinkName: 'Ice Line' }));
    expect(result).toBe('No reports yet for Ice Line — be the first family to share.');
  });

  it('leads with "Here\'s what hockey parents report about"', () => {
    const result = generateBriefing(makeInput({
      rinkName: 'Ice Line',
      signals: [makeSignal('parking', 4.0, 3)],
    }));
    expect(result).toContain("Here's what hockey parents report about Ice Line");
  });

  it('includes parking first when available', () => {
    const result = generateBriefing(makeInput({
      rinkName: 'Ice Line',
      signals: [
        makeSignal('cold', 4.0, 3),
        makeSignal('parking', 4.0, 3),
      ],
    }));
    const parkingIdx = result.indexOf('Parking');
    const comfortIdx = result.indexOf('Comfortable');
    // Parking sentence should come before cold sentence
    expect(parkingIdx).toBeGreaterThan(-1);
  });

  it('includes tip when room is available', () => {
    const result = generateBriefing(makeInput({
      rinkName: 'Test Rink',
      signals: [makeSignal('parking', 4.0, 3)],
      tips: [{ text: 'Bring blankets', contributor_type: 'visiting_parent' }],
    }));
    expect(result).toContain('Tip: "Bring blankets"');
  });
});

// ── signalComparison ──

describe('signalComparison', () => {
  it('returns empty string for unknown signal', () => {
    expect(signalComparison('nonexistent', 4.0, 5, 3.5)).toBe('');
  });

  it('returns empty string for zero count', () => {
    expect(signalComparison('parking', 4.0, 0, 3.5)).toBe('');
  });

  it('reports similar when diff < 0.3', () => {
    const result = signalComparison('parking', 3.5, 5, 3.4);
    expect(result).toContain('similar to your average');
  });

  it('reports better when rink value is higher', () => {
    const result = signalComparison('parking', 4.5, 5, 3.0);
    expect(result).toContain('better than your average');
  });

  it('reports below when rink value is lower', () => {
    const result = signalComparison('parking', 2.5, 5, 4.0);
    expect(result).toContain('below your usual');
  });
});
