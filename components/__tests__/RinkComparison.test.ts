import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';

// localStorage mock
let store: Record<string, string>;
const localStorageMock = {
  getItem: (key: string) => (key in store ? store[key] : null),
  setItem: (key: string, value: string) => { store[key] = String(value); },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { store = {}; },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
vi.stubGlobal('localStorage', localStorageMock);

// Fetch mock
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const { RinkComparison } = await import('../../components/rink/RinkComparison');

beforeEach(() => {
  store = {};
  fetchMock.mockReset();
});

function setRatedRinks(rinks: Record<string, number>) {
  store['coldstart_rated_rinks'] = JSON.stringify(rinks);
}

function mockRinkResponse(signals: { signal: string; value: number; count: number }[], name = 'Other Rink') {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      rink: { name },
      summary: { signals },
    }),
  });
}

describe('RinkComparison', () => {
  it('renders nothing when no rinks have been rated', () => {
    const { container } = render(createElement(RinkComparison, {
      currentRinkId: 'rink-1',
      currentRinkName: 'Test Rink',
      currentSignals: [{ signal: 'parking', value: 4.0, count: 5 }],
    }));
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when parking is not in currentSignals', () => {
    setRatedRinks({ 'rink-2': Date.now() });
    mockRinkResponse([{ signal: 'parking', value: 3.0, count: 5 }]);

    const { container } = render(createElement(RinkComparison, {
      currentRinkId: 'rink-1',
      currentRinkName: 'Test Rink',
      currentSignals: [{ signal: 'cold', value: 4.0, count: 5 }],
    }));
    expect(container.innerHTML).toBe('');
  });

  it('shows "rated higher" when current parking is higher', async () => {
    setRatedRinks({ 'rink-2': Date.now() });
    mockRinkResponse([{ signal: 'parking', value: 3.0, count: 5 }], 'Other Rink');

    render(createElement(RinkComparison, {
      currentRinkId: 'rink-1',
      currentRinkName: 'Test Rink',
      currentSignals: [{ signal: 'parking', value: 4.0, count: 5 }],
    }));

    await waitFor(() => {
      expect(screen.getByText(/rated higher/)).toBeTruthy();
    });
  });

  it('shows "rated lower" when current parking is lower', async () => {
    setRatedRinks({ 'rink-2': Date.now() });
    mockRinkResponse([{ signal: 'parking', value: 4.5, count: 5 }], 'Other Rink');

    render(createElement(RinkComparison, {
      currentRinkId: 'rink-1',
      currentRinkName: 'Test Rink',
      currentSignals: [{ signal: 'parking', value: 3.0, count: 5 }],
    }));

    await waitFor(() => {
      expect(screen.getByText(/rated lower/)).toBeTruthy();
    });
  });
});
