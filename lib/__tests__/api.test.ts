import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { seedGet, apiGet, apiPost } from '../../lib/api';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── seedGet ──
describe('seedGet', () => {
  it('returns parsed JSON on 200', async () => {
    const payload = { rinks: ['r1', 'r2'] };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await seedGet('/data/rinks.json');
    expect(result).toEqual(payload);
    expect(fetch).toHaveBeenCalledWith('/data/rinks.json');
  });

  it('returns null on 404', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await seedGet('/data/missing.json');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network failure'));

    const result = await seedGet('/data/rinks.json');
    expect(result).toBeNull();
  });
});

// ── apiGet ──
describe('apiGet', () => {
  it('returns data from API response', async () => {
    const payload = { id: 'rink_1', name: 'Test Rink' };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: payload }),
    });

    const result = await apiGet('/rinks/rink_1');
    expect(result).toEqual({ data: payload, error: null });
  });

  it('falls back to seed data when API fails and seedPath is provided', async () => {
    const seedPayload = { id: 'rink_1', name: 'Seed Rink' };
    (fetch as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('API down'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(seedPayload),
      });

    const result = await apiGet('/rinks/rink_1', { seedPath: '/data/rinks.json' });
    expect(result).toEqual({ data: seedPayload, error: null });
  });

  it('returns {data: null, error: string} when both API and seed fail', async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('API down'))
      .mockRejectedValueOnce(new Error('Seed down'));

    const result = await apiGet('/rinks/rink_1', { seedPath: '/data/rinks.json' });
    expect(result.data).toBeNull();
    expect(result.error).toBe('Failed to load data');
  });

  it('applies transform function to seed data', async () => {
    const raw = [{ id: 'r1' }, { id: 'r2' }];
    (fetch as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('API down'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(raw),
      });

    const transform = (data: unknown) => (data as { id: string }[]).map(r => r.id);
    const result = await apiGet<string[]>('/rinks', { seedPath: '/data/rinks.json', transform });
    expect(result).toEqual({ data: ['r1', 'r2'], error: null });
  });
});

// ── apiPost ──
describe('apiPost', () => {
  it('sends correct method and headers', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { success: true } }),
    });

    await apiPost('/ratings', { rinkId: 'r1', signal: 'parking', value: 4 });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/ratings'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rinkId: 'r1', signal: 'parking', value: 4 }),
      }),
    );
  });

  it('returns data on success', async () => {
    const payload = { id: 'rating_1', created: true };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: payload }),
    });

    const result = await apiPost('/ratings', { rinkId: 'r1' });
    expect(result).toEqual({ data: payload, error: null });
  });

  it('returns error message on failure', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Validation failed' } }),
    });

    const result = await apiPost('/ratings', { rinkId: 'r1' });
    expect(result.data).toBeNull();
    expect(result.error).toBe('Validation failed');
  });
});
