import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';

// localStorage mock (same pattern as storage.test.ts)
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

// Import after stubbing
const { SeasonWelcome } = await import('../../components/home/SeasonWelcome');

beforeEach(() => {
  store = {};
});

function setRatedRinks(rinks: Record<string, number>) {
  store['coldstart_rated_rinks'] = JSON.stringify(rinks);
}

// Season start: Sep 1 of current season year.
// If current month >= Sep, season started this year. Otherwise last year.
function getSeasonStart(): number {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 8, 1).getTime();
}

function getSeasonId(): string {
  const now = new Date();
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
}

describe('SeasonWelcome', () => {
  it('renders nothing when no rinks have been rated', () => {
    const { container } = render(createElement(SeasonWelcome));
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when most recent rating is in the current season', () => {
    // Rated after season start → no banner
    setRatedRinks({ 'rink-1': Date.now() });
    const { container } = render(createElement(SeasonWelcome));
    expect(container.innerHTML).toBe('');
  });

  it('shows banner when most recent rating is before season start', () => {
    // Rated before Sep 1 of the current season
    const beforeSeason = getSeasonStart() - 1000 * 60 * 60 * 24; // 1 day before
    setRatedRinks({ 'rink-1': beforeSeason });
    render(createElement(SeasonWelcome));
    expect(screen.getByText('Welcome back for the new season')).toBeTruthy();
  });

  it('renders nothing when already dismissed for current season', () => {
    const beforeSeason = getSeasonStart() - 1000 * 60 * 60 * 24;
    setRatedRinks({ 'rink-1': beforeSeason });
    store['coldstart_season_welcome_dismissed'] = JSON.stringify(getSeasonId());
    const { container } = render(createElement(SeasonWelcome));
    expect(container.innerHTML).toBe('');
  });

  it('dismiss button hides banner and saves to localStorage', () => {
    const beforeSeason = getSeasonStart() - 1000 * 60 * 60 * 24;
    setRatedRinks({ 'rink-1': beforeSeason });
    render(createElement(SeasonWelcome));
    expect(screen.getByText('Welcome back for the new season')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Dismiss welcome banner'));
    expect(screen.queryByText('Welcome back for the new season')).toBeNull();

    const dismissed = JSON.parse(store['coldstart_season_welcome_dismissed'] || 'null');
    expect(dismissed).toBe(getSeasonId());
  });
});
