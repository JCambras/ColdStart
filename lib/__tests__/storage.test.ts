import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { UserProfile } from '../../lib/rinkTypes';

// Provide a clean localStorage mock that both the test and the storage module share.
// Node 22+ has a built-in localStorage that conflicts with jsdom's in vitest.
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

// Import storage AFTER stubbing so it picks up our mock.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { storage } = await import('../../lib/storage');

beforeEach(() => {
  store = {};
});

// ── savedRinks round-trip ──
describe('savedRinks', () => {
  it('returns [] by default', () => {
    expect(storage.getSavedRinks()).toEqual([]);
  });

  it('round-trips a string array', () => {
    const ids = ['rink_1', 'rink_2', 'rink_3'];
    storage.setSavedRinks(ids);
    expect(storage.getSavedRinks()).toEqual(ids);
  });
});

// ── trips round-trip ──
describe('trips', () => {
  it('returns {} by default', () => {
    expect(storage.getTrips()).toEqual({});
  });

  it('round-trips an object', () => {
    const trips = { trip_1: { name: 'Lake Placid', rinks: ['r1', 'r2'] } };
    storage.setTrips(trips);
    expect(storage.getTrips()).toEqual(trips);
  });
});

// ── contributorType round-trip ──
describe('contributorType', () => {
  it('returns "visiting_parent" by default', () => {
    expect(storage.getContributorType()).toBe('visiting_parent');
  });

  it('round-trips a string', () => {
    storage.setContributorType('local_parent');
    expect(storage.getContributorType()).toBe('local_parent');
  });
});

// ── currentUser ──
describe('currentUser', () => {
  const profile: UserProfile = {
    id: 'u1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2025-01-01T00:00:00Z',
    rinksRated: 5,
    tipsSubmitted: 3,
  };

  it('returns null by default', () => {
    expect(storage.getCurrentUser()).toBeNull();
  });

  it('returns the profile after setCurrentUser', () => {
    storage.setCurrentUser(profile);
    expect(storage.getCurrentUser()).toEqual(profile);
  });

  it('removes the key when set to null', () => {
    storage.setCurrentUser(profile);
    storage.setCurrentUser(null);
    expect(storage.getCurrentUser()).toBeNull();
    expect(localStorage.getItem('coldstart_current_user')).toBeNull();
  });
});

// ── tripDraft ──
describe('tripDraft', () => {
  it('returns null by default', () => {
    expect(storage.getTripDraft()).toBeNull();
  });

  it('round-trips a draft object', () => {
    const draft = { destination: 'Boston', rinkIds: ['r1'] };
    storage.setTripDraft(draft);
    expect(storage.getTripDraft()).toEqual(draft);
  });

  it('removes the key when set to null', () => {
    storage.setTripDraft({ destination: 'Boston' });
    storage.setTripDraft(null);
    expect(storage.getTripDraft()).toBeNull();
    expect(localStorage.getItem('coldstart_trip_draft')).toBeNull();
  });
});

// ── ratedRinks ──
describe('ratedRinks', () => {
  it('returns {} by default', () => {
    expect(storage.getRatedRinks()).toEqual({});
  });
});

// ── tipVote ──
describe('tipVote', () => {
  it('returns {vote: null, score: 0} by default', () => {
    expect(storage.getTipVote('some-rink', 0)).toEqual({ vote: null, score: 0 });
  });
});

// ── placeTips ──
describe('placeTips', () => {
  it('returns [] by default', () => {
    expect(storage.getPlaceTips('rink-slug', 'restaurant')).toEqual([]);
  });

  it('round-trips tips', () => {
    const tips = [
      { text: 'Great pizza', author: 'User1', date: '2025-03-01' },
      { text: 'Long wait', author: 'User2', date: '2025-03-02' },
    ];
    storage.setPlaceTips('rink-slug', 'restaurant', tips);
    expect(storage.getPlaceTips('rink-slug', 'restaurant')).toEqual(tips);
  });
});

// ── corrupted JSON ──
describe('corrupted JSON handling', () => {
  it('returns fallback when localStorage contains invalid JSON', () => {
    localStorage.setItem('coldstart_my_rinks', '%%%not-json%%%');
    expect(storage.getSavedRinks()).toEqual([]);
  });

  it('returns fallback for corrupted user profile', () => {
    localStorage.setItem('coldstart_current_user', '{bad json');
    expect(storage.getCurrentUser()).toBeNull();
  });
});
