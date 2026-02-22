'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet } from '../lib/api';
import { storage } from '../lib/storage';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { colors, text, layout } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { RinkCard, RinkData } from '../components/RinkCard';
import { HeroSearch } from '../components/home/HeroSearch';
import { HowItWorks } from '../components/home/HowItWorks';
import { RinkRequestForm } from '../components/home/RinkRequestForm';
import { FeaturedRinksGrid } from '../components/home/FeaturedRinksGrid';
import { TeamManagerCTA } from '../components/home/TeamManagerCTA';
import { timeAgo } from '../lib/rinkHelpers';

interface RecentlyViewedRink {
  id: string;
  name: string;
  city: string;
  state: string;
  viewedAt: string;
}


const FEATURED_SEARCHES = [
  'Ice Line',
  'IceWorks Skating Complex',
  'Oaks Center Ice',
];

// ── Main page ──
export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isLoggedIn, openAuth } = useAuth();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [rinks, setRinks] = useState<RinkData[]>([]);
  const [searchResults, setSearchResults] = useState<RinkData[] | null>(null);
  const [totalRinks, setTotalRinks] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const [savedRinkIds, setSavedRinkIds] = useState<string[]>([]);
  const [savedRinks, setSavedRinks] = useState<RinkData[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedRink[]>([]);
  const [ratedRinks, setRatedRinks] = useState<{ id: string; name: string; city: string; state: string; ratedAt: number }[]>([]);

  // Load saved rinks
  useEffect(() => {
    setSavedRinkIds(storage.getSavedRinks());
  }, []);

  // Load recently viewed rinks from localStorage
  useEffect(() => {
    try {
      const viewed: RecentlyViewedRink[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('coldstart_viewed_meta_')) {
          const id = key.replace('coldstart_viewed_meta_', '');
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw);
            if (data.name) {
              viewed.push({ id, ...data });
            }
          }
        }
      }
      viewed.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
      setRecentlyViewed(viewed.slice(0, 5));
    } catch {}
  }, []);

  // Load rated rinks from localStorage
  useEffect(() => {
    try {
      const rated = storage.getRatedRinks();
      const entries = Object.entries(rated);
      if (entries.length === 0) return;
      const rinks: { id: string; name: string; city: string; state: string; ratedAt: number }[] = [];
      for (const [id, timestamp] of entries) {
        const metaRaw = localStorage.getItem(`coldstart_viewed_meta_${id}`);
        if (metaRaw) {
          const meta = JSON.parse(metaRaw);
          if (meta.name) {
            rinks.push({ id, name: meta.name, city: meta.city || '', state: meta.state || '', ratedAt: timestamp });
          }
        }
      }
      rinks.sort((a, b) => b.ratedAt - a.ratedAt);
      setRatedRinks(rinks.slice(0, 5));
    } catch {}
  }, []);

  // Fetch saved rink details
  useEffect(() => {
    if (savedRinkIds.length === 0) return;
    async function loadSaved() {
      const results: RinkData[] = [];
      for (const id of savedRinkIds) {
        const { data } = await apiGet<{ rink?: { name?: string }; name?: string; city?: string; state?: string }>(`/rinks/${id}`);
        if (data) results.push({ ...data, id, name: data.rink?.name || data.name || '', city: data.city || '', state: data.state || '' } as RinkData);
      }
      setSavedRinks(results);
    }
    loadSaved();
  }, [savedRinkIds]);

  // Sync search query to URL params (enables back-button restore)
  useEffect(() => {
    const url = new URL(window.location.href);
    if (query.trim()) {
      url.searchParams.set('q', query);
    } else {
      url.searchParams.delete('q');
    }
    window.history.replaceState({}, '', url.toString());
  }, [query]);

  // Auto-focus search on desktop
  useEffect(() => {
    if (window.innerWidth > 768) {
      setTimeout(() => searchRef.current?.focus(), 300);
    }
  }, []);

  const [stateCount, setStateCount] = useState(0);

  // Load featured rinks on mount
  useEffect(() => {
    async function loadFeatured() {
      const results: RinkData[] = [];
      for (const q of FEATURED_SEARCHES) {
        const { data: searchData } = await apiGet<RinkData[]>(`/rinks?query=${encodeURIComponent(q)}`);
        if (searchData && searchData.length > 0) {
          const rink = searchData[0];
          const { data: detailData } = await apiGet<Record<string, unknown>>(`/rinks/${rink.id}`);
          if (detailData) {
            results.push({
              ...rink,
              ...(detailData as Partial<RinkData>),
              name: (detailData.name as string) || rink.name,
              city: (detailData.city as string) || rink.city,
              state: (detailData.state as string) || rink.state,
            });
          } else {
            results.push(rink);
          }
        }
      }
      const seen = new Set<string>();
      const unique = results.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
      setRinks(unique);
    }

    async function loadRecent() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/rinks?limit=6`);
        if (res.ok) {
          const json = await res.json();
          if (json.total) setTotalRinks(json.total);
          if (json.states) setStateCount(json.states);
          return;
        }
      } catch {}
      // Fallback to seed data
      const seedData = await apiGet<RinkData[]>('/rinks?limit=6', {
        seedPath: '/data/rinks.json',
        transform: (raw) => {
          const rinks = raw as RinkData[];
          setTotalRinks(rinks.length);
          return rinks.slice(0, 6);
        },
      });
    }

    loadFeatured();
    loadRecent();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Search with debounce + AbortController to prevent stale results
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      const q = query.toLowerCase();
      const { data } = await apiGet<RinkData[]>(`/rinks?query=${encodeURIComponent(query)}`, {
        seedPath: '/data/rinks.json',
        signal: controller.signal,
        transform: (raw) => {
          const rinks = raw as RinkData[];
          return rinks.filter((r) =>
            r.name?.toLowerCase().includes(q) || r.city?.toLowerCase().includes(q) || r.state?.toLowerCase().includes(q)
          ).slice(0, 25);
        },
      });
      if (!controller.signal.aborted) {
        setSearchResults(data || []);
      }
    }, 300);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [query]);

  function handleClearSearch() {
    setQuery('');
    setSearchResults(null);
    searchRef.current?.focus();
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Skip to content */}
      <a
        href="#main-content"
        style={{
          position: 'absolute', left: -9999, top: 'auto',
          width: 1, height: 1, overflow: 'hidden',
        }}
        onFocus={(e) => { e.currentTarget.style.cssText = 'position:fixed;top:8px;left:8px;z-index:9999;padding:8px 16px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);font-size:14px;color:#111;'; }}
        onBlur={(e) => { e.currentTarget.style.cssText = 'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;'; }}
      >
        Skip to content
      </a>

      {/* Dark hero with top bar + search */}
      <HeroSearch
        query={query}
        onQueryChange={setQuery}
        searchRef={searchRef}
        totalRinks={totalRinks}
        stateCount={stateCount}
        onClearSearch={handleClearSearch}
        onSearchSubmit={() => searchRef.current?.focus()}
      />

      <main id="main-content">
        {/* Search results or Featured grid */}
        {searchResults !== null ? (
          <section style={{ maxWidth: layout.maxWidth5xl, margin: '0 auto', padding: '32px 24px' }}>
            {searchResults.length > 0 ? (
              <>
                <h2 style={{
                  fontSize: 12, fontWeight: 500, color: colors.stone500,
                  textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
                }}>
                  Search results
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {searchResults.map((rink) => (
                    <RinkCard
                      key={rink.id}
                      rink={rink}
                      onClick={() => router.push(`/rinks/${rink.id}`)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 400, margin: '0 auto' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🏒</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                  No rinks found for &ldquo;{query}&rdquo;
                </p>
                <RinkRequestForm query={query} />
              </div>
            )}
          </section>
        ) : (
          <FeaturedRinksGrid
            rinks={rinks}
            onRinkClick={(id) => router.push(`/rinks/${id}`)}
          />
        )}

        {/* My Rinks (saved) */}
        {savedRinks.length > 0 && (
          <section id="my-rinks-section" aria-label="Saved rinks" style={{
            maxWidth: layout.maxWidth5xl, margin: '0 auto', padding: '32px 24px 0',
          }}>
            <h3 style={{
              fontSize: 12, fontWeight: 500, color: colors.stone500,
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              My Rinks
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {savedRinks.map((rink) => (
                <div
                  key={rink.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/rinks/${rink.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/rinks/${rink.id}`); } }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px', background: colors.surface, border: `1px solid ${colors.stone200}`,
                    borderRadius: 12, cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.stone200; }}
                >
                  <div>
                    <div style={{ fontSize: text.lg, fontWeight: 600, color: colors.stone800 }}>{rink.name}</div>
                    <div style={{ fontSize: text.sm, color: colors.stone400, marginTop: 2 }}>{rink.city}, {rink.state}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {rink.summary && (
                      <span style={{
                        fontSize: text.xs, fontWeight: 500, padding: '3px 10px', borderRadius: 10,
                        background: rink.summary.verdict.includes('Good') ? colors.bgSuccess : colors.bgWarning,
                        color: rink.summary.verdict.includes('Good') ? colors.success : colors.warning,
                      }}>
                        {rink.summary.verdict.split(' ').slice(0, 3).join(' ')}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = savedRinkIds.filter(id => id !== rink.id);
                        setSavedRinkIds(updated);
                        setSavedRinks(savedRinks.filter(r => r.id !== rink.id));
                        storage.setSavedRinks(updated);
                      }}
                      aria-label={`Remove ${rink.name} from saved rinks`}
                      style={{
                        fontSize: text.xs, color: colors.stone400, background: 'none', border: 'none',
                        cursor: 'pointer', padding: '12px', minWidth: 44, minHeight: 44,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Your Contributions — shows when user has rated rinks */}
        {ratedRinks.length > 0 && (
          <section aria-label="Your contributions" style={{
            maxWidth: layout.maxWidth5xl, margin: '0 auto', padding: '32px 24px 0',
          }}>
            <h3 style={{
              fontSize: 12, fontWeight: 500, color: colors.stone500,
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              Your Contributions
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 7px',
                borderRadius: 10, background: colors.bgSuccess, color: colors.success,
              }}>
                {ratedRinks.length}
              </span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ratedRinks.map((rink) => (
                <div
                  key={rink.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/rinks/${rink.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/rinks/${rink.id}`); } }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 18px', background: colors.surface, border: `1px solid ${colors.stone200}`,
                    borderRadius: 10, cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.stone200; }}
                >
                  <div>
                    <div style={{ fontSize: text.base, fontWeight: 600, color: colors.stone800 }}>{rink.name}</div>
                    <div style={{ fontSize: text.xs, color: colors.stone400, marginTop: 2 }}>{rink.city}, {rink.state}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: text['2xs'], fontWeight: 500, padding: '2px 8px',
                      borderRadius: 8, background: colors.bgSuccess, color: colors.success,
                    }}>
                      Rated
                    </span>
                    <span style={{ fontSize: text.xs, color: colors.stone400, whiteSpace: 'nowrap' }}>
                      {timeAgo(new Date(rink.ratedAt).toISOString())}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed — shows when user has view history but no saved rinks */}
        {recentlyViewed.length > 0 && savedRinks.length === 0 && (
          <section aria-label="Recently viewed rinks" style={{
            maxWidth: layout.maxWidth5xl, margin: '0 auto', padding: '32px 24px 0',
          }}>
            <h3 style={{
              fontSize: 12, fontWeight: 500, color: colors.stone500,
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              Recently Viewed
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentlyViewed.map((rink) => (
                <div
                  key={rink.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/rinks/${rink.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/rinks/${rink.id}`); } }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 18px', background: colors.surface, border: `1px solid ${colors.stone200}`,
                    borderRadius: 10, cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.stone200; }}
                >
                  <div>
                    <div style={{ fontSize: text.base, fontWeight: 600, color: colors.stone800 }}>{rink.name}</div>
                    <div style={{ fontSize: text.xs, color: colors.stone400, marginTop: 2 }}>{rink.city}, {rink.state}</div>
                  </div>
                  <span style={{ fontSize: text.xs, color: colors.stone400, whiteSpace: 'nowrap', marginLeft: 12 }}>
                    {timeAgo(rink.viewedAt)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* How it works */}
        <div style={{ paddingTop: 40 }}>
          <HowItWorks />
        </div>

        {/* Team Manager CTA */}
        <TeamManagerCTA />
      </main>

      {/* Footer */}
      <footer style={{
        maxWidth: layout.maxWidth5xl, margin: '0 auto', padding: '28px 24px',
        borderTop: `1px solid ${colors.stone200}`,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: colors.stone400 }}>
            ColdStart — built by hockey parents, for hockey parents.
          </span>
          <span style={{ fontSize: 12, color: colors.stone500 }}>v0.4</span>
        </div>
        <span style={{ fontSize: 11, color: colors.stone400 }}>
          Rink operator? Contact us at{' '}
          <a href="mailto:rinks@coldstarthockey.com" style={{ color: colors.stone400, textDecoration: 'underline' }}>
            rinks@coldstarthockey.com
          </a>
        </span>
      </footer>
    </div>
  );
}
