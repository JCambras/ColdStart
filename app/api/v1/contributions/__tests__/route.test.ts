import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mock variables are available when vi.mock factories run
const {
  mockQuery, mockClientQuery, mockRelease, mockConnect, mockBuildSummary,
} = vi.hoisted(() => {
  const mockClientQuery = vi.fn();
  const mockRelease = vi.fn();
  return {
    mockQuery: vi.fn(),
    mockClientQuery,
    mockRelease,
    mockConnect: vi.fn().mockResolvedValue({
      query: mockClientQuery,
      release: mockRelease,
    }),
    mockBuildSummary: vi.fn().mockResolvedValue({
      rink_id: 'rink-1',
      verdict: 'Good rink overall',
      signals: [],
      tips: [],
      evidence_counts: {},
      contribution_count: 5,
      last_updated_at: null,
      confirmed_this_season: false,
    }),
  };
});

vi.mock('../../../../../lib/db', () => ({
  pool: {
    query: mockQuery,
    connect: mockConnect,
  },
}));

vi.mock('../../../../../lib/apiAuth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    session: { user: { id: 'test-user' } },
    error: null,
  }),
}));

vi.mock('../../../../../lib/rateLimit', () => ({
  rateLimit: vi.fn().mockReturnValue(null),
}));

vi.mock('../../../../../lib/dbSummary', () => ({
  buildSummary: (...args: unknown[]) => mockBuildSummary(...args),
}));

vi.mock('../../../../../lib/pushService', () => ({
  notifyRinkWatchers: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  generateRequestId: vi.fn().mockReturnValue('test-req-id'),
}));

import { POST } from '../../contributions/route';
import { requireAuth } from '../../../../../lib/apiAuth';

function makeRequest(body: Record<string, unknown>, method = 'POST') {
  return new Request('http://localhost/api/v1/contributions', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();

  // Default: rink exists
  mockQuery.mockResolvedValue({ rows: [{ id: 'rink-1', name: 'Test Rink' }] });

  // Default: requireAuth succeeds
  vi.mocked(requireAuth).mockResolvedValue({
    session: { user: { id: 'test-user' } } as never,
    error: null,
  });

  // Reset client mocks
  mockClientQuery.mockResolvedValue({ rows: [{ is_new: true }] });
  mockConnect.mockResolvedValue({
    query: mockClientQuery,
    release: mockRelease,
  });
});

describe('POST /api/v1/contributions', () => {
  // ── Validation ──

  it('returns 400 when rink_id is missing', async () => {
    const res = await POST(makeRequest({ kind: 'signal_rating' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('rink_id');
  });

  it('returns 400 when kind is missing', async () => {
    const res = await POST(makeRequest({ rink_id: 'rink-1' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('kind');
  });

  it('returns 404 when rink does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await POST(makeRequest({ rink_id: 'nonexistent', kind: 'signal_rating' }));
    expect(res.status).toBe(404);
  });

  it('returns 400 for unknown kind', async () => {
    const res = await POST(makeRequest({ rink_id: 'rink-1', kind: 'unknown_kind' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Unknown kind');
  });

  // ── Auth ──

  it('returns 401 when auth fails', async () => {
    const { NextResponse } = await import('next/server');
    vi.mocked(requireAuth).mockResolvedValueOnce({
      session: null,
      error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    });

    const res = await POST(makeRequest({ rink_id: 'rink-1', kind: 'signal_rating' }));
    expect(res.status).toBe(401);
  });

  // ── Signal rating ──

  it('returns 400 when signal_rating is missing', async () => {
    const res = await POST(makeRequest({
      rink_id: 'rink-1',
      kind: 'signal_rating',
    }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid signal name', async () => {
    const res = await POST(makeRequest({
      rink_id: 'rink-1',
      kind: 'signal_rating',
      signal_rating: { signal: 'invalid_signal', value: 3 },
    }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid signal');
  });

  it('returns 400 when value is out of range', async () => {
    const res = await POST(makeRequest({
      rink_id: 'rink-1',
      kind: 'signal_rating',
      signal_rating: { signal: 'parking', value: 6 },
    }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('integer between 1 and 5');
  });

  it('returns 400 when value is not an integer', async () => {
    const res = await POST(makeRequest({
      rink_id: 'rink-1',
      kind: 'signal_rating',
      signal_rating: { signal: 'parking', value: 3.5 },
    }));
    expect(res.status).toBe(400);
  });

  it('increments user counter on new insert (is_new: true)', async () => {
    mockClientQuery
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ is_new: true }] }) // INSERT
      .mockResolvedValueOnce({}) // UPDATE users
      .mockResolvedValueOnce({}); // COMMIT

    const res = await POST(makeRequest({
      rink_id: 'rink-1',
      kind: 'signal_rating',
      signal_rating: { signal: 'parking', value: 4 },
    }));

    expect(res.status).toBe(200);
    // Should call: BEGIN, INSERT, UPDATE users, COMMIT = 4 calls
    expect(mockClientQuery).toHaveBeenCalledTimes(4);
    // The 3rd call should be the user counter update
    expect(mockClientQuery.mock.calls[2][0]).toContain('rinksRated');
  });

  it('does not increment user counter on upsert (is_new: false)', async () => {
    mockClientQuery
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ is_new: false }] }) // INSERT (upsert)
      .mockResolvedValueOnce({}); // COMMIT

    const res = await POST(makeRequest({
      rink_id: 'rink-1',
      kind: 'signal_rating',
      signal_rating: { signal: 'parking', value: 3 },
    }));

    expect(res.status).toBe(200);
    // Should call: BEGIN, INSERT, COMMIT = 3 calls (no user counter update)
    expect(mockClientQuery).toHaveBeenCalledTimes(3);
  });

  it('rolls back transaction and releases client on error', async () => {
    mockClientQuery
      .mockResolvedValueOnce({}) // BEGIN
      .mockRejectedValueOnce(new Error('DB error')); // INSERT fails

    const res = await POST(makeRequest({
      rink_id: 'rink-1',
      kind: 'signal_rating',
      signal_rating: { signal: 'parking', value: 4 },
    }));

    expect(res.status).toBe(500);
    // Verify ROLLBACK was called
    const rollbackCall = mockClientQuery.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0] === 'ROLLBACK'
    );
    expect(rollbackCall).toBeDefined();
    expect(mockRelease).toHaveBeenCalled();
  });

  it('returns summary on successful signal rating', async () => {
    mockClientQuery
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ is_new: true }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const res = await POST(makeRequest({
      rink_id: 'rink-1',
      kind: 'signal_rating',
      signal_rating: { signal: 'parking', value: 4 },
    }));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.summary).toBeDefined();
    expect(data.data.summary.rink_id).toBe('rink-1');
  });

  // ── Tip ──

  it('returns 400 when tip text is empty', async () => {
    const res = await POST(makeRequest({
      rink_id: 'rink-1',
      kind: 'tip',
      tip: { text: '   ' },
    }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('tip text');
  });

  it('returns 400 when tip text exceeds 280 chars', async () => {
    const res = await POST(makeRequest({
      rink_id: 'rink-1',
      kind: 'tip',
      tip: { text: 'x'.repeat(281) },
    }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('280');
  });

  it('inserts tip and increments counter on valid tip', async () => {
    mockClientQuery
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // INSERT tip
      .mockResolvedValueOnce({}) // UPDATE users tipsSubmitted
      .mockResolvedValueOnce({}); // COMMIT

    const res = await POST(makeRequest({
      rink_id: 'rink-1',
      kind: 'tip',
      tip: { text: 'Park in the back lot' },
    }));

    expect(res.status).toBe(200);
    expect(mockClientQuery).toHaveBeenCalledTimes(4);
    expect(mockClientQuery.mock.calls[1][0]).toContain('INSERT INTO tips');
    expect(mockClientQuery.mock.calls[2][0]).toContain('tipsSubmitted');
  });

  // ── One-thing tip ──

  it('handles one_thing_tip same as tip path', async () => {
    mockClientQuery
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const res = await POST(makeRequest({
      rink_id: 'rink-1',
      kind: 'one_thing_tip',
      one_thing_tip: { text: 'Arrive early' },
    }));

    expect(res.status).toBe(200);
    expect(mockClientQuery.mock.calls[1][0]).toContain('INSERT INTO tips');
  });

  // ── Confirm ──

  it('uses pool.query directly for confirm (no transaction)', async () => {
    const res = await POST(makeRequest({
      rink_id: 'rink-1',
      kind: 'confirm',
    }));

    expect(res.status).toBe(200);
    // Confirm uses pool.query, not pool.connect
    // First call: rink exists check, second call: confirmation insert
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(mockConnect).not.toHaveBeenCalled();
  });

  // ── contributor_type sanitization ──

  it('coerces invalid contributor_type to visiting_parent', async () => {
    mockClientQuery
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ is_new: true }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const res = await POST(makeRequest({
      rink_id: 'rink-1',
      kind: 'signal_rating',
      signal_rating: { signal: 'parking', value: 4 },
      contributor_type: 'evil_hacker',
    }));

    expect(res.status).toBe(200);
    // The INSERT call should use 'visiting_parent' as the contributor_type
    const insertCall = mockClientQuery.mock.calls[1];
    expect(insertCall[1]).toContain('visiting_parent');
  });
});
