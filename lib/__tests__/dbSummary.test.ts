import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mock variables are available when vi.mock factories run
const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../db', () => ({
  pool: { query: mockQuery },
}));

vi.mock('../venueConfig', () => ({
  VENUE_CONFIG: {
    signals: ['parking', 'cold', 'food_nearby', 'chaos', 'family_friendly', 'locker_rooms', 'pro_shop'],
    verdicts: {
      good: 'Good rink overall',
      mixed: 'Mixed reviews',
      bad: 'Heads up — some issues reported',
      none: 'No ratings yet',
    },
  },
}));

// Use real verdict logic
vi.mock('../verdict', async () => {
  const actual = await vi.importActual<typeof import('../verdict')>('../verdict');
  return actual;
});

import { buildSummary } from '../dbSummary';

beforeEach(() => {
  vi.clearAllMocks();
});

// Helper to set up mock returns for the 4 parallel queries
function setupMocks(opts: {
  signalRows?: Record<string, unknown>[];
  tipRows?: Record<string, unknown>[];
  lastSignalDate?: Date | null;
  lastTipDate?: Date | null;
}) {
  mockQuery
    .mockResolvedValueOnce({ rows: opts.signalRows ?? [] })       // signal_ratings
    .mockResolvedValueOnce({ rows: opts.tipRows ?? [] })          // tips
    .mockResolvedValueOnce({ rows: opts.lastSignalDate ? [{ created_at: opts.lastSignalDate }] : [] }) // last signal
    .mockResolvedValueOnce({ rows: opts.lastTipDate ? [{ created_at: opts.lastTipDate }] : [] });      // last tip
}

describe('buildSummary', () => {
  it('returns all zeros when no data exists', async () => {
    setupMocks({});

    const result = await buildSummary('rink-1');

    expect(result.rink_id).toBe('rink-1');
    expect(result.verdict).toBe('No ratings yet');
    expect(result.contribution_count).toBe(0);
    expect(result.confirmed_this_season).toBe(false);
    expect(result.last_updated_at).toBeNull();
    expect(result.signals).toHaveLength(7);
    expect(result.signals.every(s => s.value === 0 && s.count === 0)).toBe(true);
    expect(result.tips).toHaveLength(0);
  });

  it('prefers recent data when available', async () => {
    setupMocks({
      signalRows: [
        {
          signal: 'parking',
          value: '3.0', count: 10, stddev: '0.5',
          recent_value: '4.5', recent_count: 5, recent_stddev: '0.3',
        },
      ],
    });

    const result = await buildSummary('rink-1');

    const parking = result.signals.find(s => s.signal === 'parking')!;
    expect(parking.value).toBe(4.5);
    expect(parking.count).toBe(5);
  });

  it('falls back to all-time when no recent data', async () => {
    setupMocks({
      signalRows: [
        {
          signal: 'parking',
          value: '3.2', count: 20, stddev: '0.8',
          recent_value: null, recent_count: 0, recent_stddev: null,
        },
      ],
    });

    const result = await buildSummary('rink-1');

    const parking = result.signals.find(s => s.signal === 'parking')!;
    expect(parking.value).toBe(3.2);
    expect(parking.count).toBe(20);
  });

  it('assigns Trusted badge when rinks_rated >= 10', async () => {
    setupMocks({
      tipRows: [
        {
          id: 1, text: 'Great rink', contributor_type: 'visiting_parent',
          context: null, created_at: new Date(), user_id: 'u1',
          contributor_name: 'John', rinks_rated: 15,
          resp_text: null, resp_name: null, resp_role: null,
          flag_count: 0,
        },
      ],
    });

    const result = await buildSummary('rink-1');

    expect(result.tips[0].contributor_badge).toBe('Trusted');
  });

  it('does not assign badge when rinks_rated < 10', async () => {
    setupMocks({
      tipRows: [
        {
          id: 1, text: 'Nice', contributor_type: 'local_parent',
          context: null, created_at: new Date(), user_id: 'u2',
          contributor_name: 'Jane', rinks_rated: 5,
          resp_text: null, resp_name: null, resp_role: null,
          flag_count: 0,
        },
      ],
    });

    const result = await buildSummary('rink-1');

    expect(result.tips[0].contributor_badge).toBeUndefined();
  });

  it('populates operator_response when present', async () => {
    setupMocks({
      tipRows: [
        {
          id: 1, text: 'Parking is bad', contributor_type: 'visiting_parent',
          context: null, created_at: new Date(), user_id: 'u1',
          contributor_name: 'Bob', rinks_rated: 3,
          resp_text: 'We added 50 spots!', resp_name: 'Manager Mike', resp_role: 'General Manager',
          flag_count: 0,
        },
      ],
    });

    const result = await buildSummary('rink-1');

    expect(result.tips[0].operator_response).toEqual({
      text: 'We added 50 spots!',
      name: 'Manager Mike',
      role: 'General Manager',
    });
  });

  it('maps flag_count from tip rows', async () => {
    setupMocks({
      tipRows: [
        {
          id: 1, text: 'Flagged tip', contributor_type: 'visiting_parent',
          context: null, created_at: new Date(), user_id: 'u1',
          contributor_name: null, rinks_rated: null,
          resp_text: null, resp_name: null, resp_role: null,
          flag_count: 3,
        },
      ],
    });

    const result = await buildSummary('rink-1');

    expect(result.tips[0].flag_count).toBe(3);
  });

  it('defaults flag_count to 0 when null', async () => {
    setupMocks({
      tipRows: [
        {
          id: 1, text: 'Normal tip', contributor_type: 'visiting_parent',
          context: null, created_at: new Date(), user_id: 'u1',
          contributor_name: null, rinks_rated: null,
          resp_text: null, resp_name: null, resp_role: null,
          flag_count: null,
        },
      ],
    });

    const result = await buildSummary('rink-1');

    expect(result.tips[0].flag_count).toBe(0);
  });

  it('returns "Good rink overall" when avg >= 3.8', async () => {
    setupMocks({
      signalRows: [
        { signal: 'parking', value: '4.0', count: 5, stddev: '0.2', recent_value: null, recent_count: 0, recent_stddev: null },
        { signal: 'cold', value: '4.2', count: 5, stddev: '0.3', recent_value: null, recent_count: 0, recent_stddev: null },
      ],
    });

    const result = await buildSummary('rink-1');

    expect(result.verdict).toBe('Good rink overall');
  });

  it('returns "Mixed reviews" when avg >= 3.0 and < 3.8', async () => {
    setupMocks({
      signalRows: [
        { signal: 'parking', value: '3.2', count: 5, stddev: '0.5', recent_value: null, recent_count: 0, recent_stddev: null },
        { signal: 'cold', value: '3.4', count: 5, stddev: '0.4', recent_value: null, recent_count: 0, recent_stddev: null },
      ],
    });

    const result = await buildSummary('rink-1');

    expect(result.verdict).toBe('Mixed reviews');
  });

  it('returns "Heads up" when avg < 3.0', async () => {
    setupMocks({
      signalRows: [
        { signal: 'parking', value: '2.0', count: 5, stddev: '0.5', recent_value: null, recent_count: 0, recent_stddev: null },
        { signal: 'cold', value: '2.5', count: 5, stddev: '0.4', recent_value: null, recent_count: 0, recent_stddev: null },
      ],
    });

    const result = await buildSummary('rink-1');

    expect(result.verdict).toBe('Heads up — some issues reported');
  });

  it('sets confirmed_this_season when last_updated_at is within 6 months', async () => {
    const recent = new Date();
    recent.setMonth(recent.getMonth() - 2);

    setupMocks({
      lastSignalDate: recent,
    });

    const result = await buildSummary('rink-1');

    expect(result.confirmed_this_season).toBe(true);
  });

  it('sets confirmed_this_season false when last_updated_at is older than 6 months', async () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 8);

    setupMocks({
      lastSignalDate: old,
    });

    const result = await buildSummary('rink-1');

    expect(result.confirmed_this_season).toBe(false);
  });

  it('computes contribution_count from signal counts + tip count', async () => {
    setupMocks({
      signalRows: [
        { signal: 'parking', value: '4.0', count: 3, stddev: '0.2', recent_value: null, recent_count: 0, recent_stddev: null },
        { signal: 'cold', value: '3.5', count: 2, stddev: '0.3', recent_value: null, recent_count: 0, recent_stddev: null },
      ],
      tipRows: [
        {
          id: 1, text: 'Tip 1', contributor_type: 'visiting_parent',
          context: null, created_at: new Date(), user_id: 'u1',
          contributor_name: null, rinks_rated: null,
          resp_text: null, resp_name: null, resp_role: null,
          flag_count: 0,
        },
        {
          id: 2, text: 'Tip 2', contributor_type: 'local_parent',
          context: null, created_at: new Date(), user_id: 'u2',
          contributor_name: null, rinks_rated: null,
          resp_text: null, resp_name: null, resp_role: null,
          flag_count: 0,
        },
      ],
    });

    const result = await buildSummary('rink-1');

    // 3 + 2 signal counts + 2 tips = 7
    expect(result.contribution_count).toBe(7);
  });
});
