import type { UserProfile } from './rinkTypes';

// ── Core helpers — all try/catch in one place ──

function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

// ── Typed accessors ──

export const storage = {
  // User auth
  getCurrentUser: () => getJSON<UserProfile | null>('coldstart_current_user', null),
  setCurrentUser: (u: UserProfile | null) =>
    u ? setJSON('coldstart_current_user', u) : remove('coldstart_current_user'),

  // User profiles (account store)
  getProfiles: () => getJSON<Record<string, UserProfile>>('coldstart_profiles', {}),
  setProfiles: (p: Record<string, UserProfile>) => setJSON('coldstart_profiles', p),

  // Saved rinks
  getSavedRinks: () => getJSON<string[]>('coldstart_my_rinks', []),
  setSavedRinks: (ids: string[]) => setJSON('coldstart_my_rinks', ids),

  // Contributor type
  getContributorType: () => getJSON<string>('coldstart_contributor_type', 'visiting_parent'),
  setContributorType: (t: string) => setJSON('coldstart_contributor_type', t),

  // Trips
  getTrips: () => getJSON<Record<string, unknown>>('coldstart_trips', {}),
  setTrips: (t: Record<string, unknown>) => setJSON('coldstart_trips', t),

  // Trip draft
  getTripDraft: () => getJSON<Record<string, unknown> | null>('coldstart_trip_draft', null),
  setTripDraft: (d: Record<string, unknown> | null) =>
    d ? setJSON('coldstart_trip_draft', d) : remove('coldstart_trip_draft'),

  // Rated rinks
  getRatedRinks: () => getJSON<Record<string, number>>('coldstart_rated_rinks', {}),
  setRatedRinks: (r: Record<string, number>) => setJSON('coldstart_rated_rinks', r),

  // Rating context
  getRatingContext: () => getJSON<string | null>('coldstart_rating_context', null),
  setRatingContext: (c: string) => setJSON('coldstart_rating_context', c),

  // Claims
  getClaims: () => getJSON<unknown[]>('coldstart_claims', []),
  setClaims: (c: unknown[]) => setJSON('coldstart_claims', c),

  // Rink requests
  getRinkRequests: () => getJSON<unknown[]>('coldstart_rink_requests', []),
  setRinkRequests: (r: unknown[]) => setJSON('coldstart_rink_requests', r),

  // Vibe engine
  getVibe: () => getJSON<Record<string, unknown>>('coldstart_vibe', {}),
  setVibe: (v: Record<string, unknown>) => setJSON('coldstart_vibe', v),

  // Dynamic keys — tip votes
  getTipVote: (slug: string, i: number) =>
    getJSON<{ vote: string | null; score: number }>(`coldstart_tip_vote_${slug}_${i}`, { vote: null, score: 0 }),
  setTipVote: (slug: string, i: number, v: { vote: string | null; score: number }) =>
    setJSON(`coldstart_tip_vote_${slug}_${i}`, v),

  // Dynamic keys — place tips
  getPlaceTips: (slug: string, place: string) =>
    getJSON<{ text: string; author: string; date: string }[]>(`coldstart_place_tips_${slug}_${place}`, []),
  setPlaceTips: (slug: string, place: string, tips: { text: string; author: string; date: string }[]) =>
    setJSON(`coldstart_place_tips_${slug}_${place}`, tips),

  // Place tips seeded flag
  getPlaceTipsSeeded: () => getJSON<string | null>('coldstart_place_tips_seeded', null),
  setPlaceTipsSeeded: (v: string) => setJSON('coldstart_place_tips_seeded', v),

  // Rink view tracking
  getRinkViewed: (id: string) => getJSON<string | null>(`coldstart_viewed_${id}`, null),
  setRinkViewed: (id: string, date: string) => setJSON(`coldstart_viewed_${id}`, date),

  // All place tips for a rink (enumerate by scanning localStorage)
  getAllPlaceTips: (rinkSlug: string) => {
    const allTips: Record<string, { text: string; author: string; date: string }[]> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`coldstart_place_tips_${rinkSlug}_`)) {
          const placeName = key.replace(`coldstart_place_tips_${rinkSlug}_`, '');
          allTips[placeName] = JSON.parse(localStorage.getItem(key) || '[]');
        }
      }
    } catch {}
    return allTips;
  },
};
