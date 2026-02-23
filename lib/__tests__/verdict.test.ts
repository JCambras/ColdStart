import { describe, it, expect } from 'vitest';
import { computeVerdict, computeConfidence } from '../verdict';

describe('computeVerdict', () => {
  it('returns "No ratings yet" when count is 0', () => {
    expect(computeVerdict(0, 0)).toBe('No ratings yet');
  });

  it('returns good verdict for high average', () => {
    expect(computeVerdict(4.0, 10)).toBe('Good rink overall');
  });

  it('returns good verdict at boundary (3.8)', () => {
    expect(computeVerdict(3.8, 5)).toBe('Good rink overall');
  });

  it('returns mixed verdict below good threshold', () => {
    expect(computeVerdict(3.5, 5)).toBe('Mixed reviews');
  });

  it('returns mixed verdict at boundary (3.0)', () => {
    expect(computeVerdict(3.0, 5)).toBe('Mixed reviews');
  });

  it('returns bad verdict below mixed threshold', () => {
    expect(computeVerdict(2.5, 5)).toBe('Heads up — some issues reported');
  });
});

describe('computeConfidence', () => {
  it('returns 0.2 for 0 ratings', () => {
    expect(computeConfidence(0)).toBe(0.2);
  });

  it('returns 0.7 for 5 ratings', () => {
    expect(computeConfidence(5)).toBe(0.7);
  });

  it('caps at 1.0 for 8 ratings', () => {
    expect(computeConfidence(8)).toBe(1.0);
  });

  it('caps at 1.0 for large counts', () => {
    expect(computeConfidence(100)).toBe(1.0);
  });
});
