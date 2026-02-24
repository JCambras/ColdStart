'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet } from '../../lib/api';
import { storage } from '../../lib/storage';
import { colors, text, layout, spacing, pad } from '../../lib/theme';
import { useAuth } from '../../contexts/AuthContext';
import { RinkCard, RinkData } from '../RinkCard';
import { HeroSearch } from './HeroSearch';
import { HowItWorks } from './HowItWorks';
import { RinkRequestForm } from './RinkRequestForm';
import { FeaturedRinksGrid } from './FeaturedRinksGrid';
import { TeamManagerCTA } from './TeamManagerCTA';
import { timeAgo } from '../../lib/rinkHelpers';
import { getVibe } from '../../app/vibe';
import { AddToHomeScreen } from './AddToHomeScreen';
import { WhatsNew } from './WhatsNew';
import { PushPrompt } from '../PushPrompt';
import { SeasonWelcome } from './SeasonWelcome';

interface RecentlyViewedRink {
  id: string;
  name: string;
  city: string;
  state: string;
  viewedAt: string;
}

interface HomeClientProps {
  initialFeaturedRinks: RinkData[];
  initialTotalRinks: number;
  initialStateCount: number;
}

export default function HomeClient({
  initialFeaturedRinks,
  initialTotalRinks,
  initialStateCount,
}: HomeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isLoggedIn, openAuth } = useAuth();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [rinks] = useState<RinkData[]>(initialFeaturedRinks);
  const [searchResults, setSearchResults] = useState<RinkData[] | null>(null);
  const [totalRinks] = useState(initialTotalRinks);
  const [stateCount] = useState(initialStateCount);
  const searchRef = useRef<HTMLInputElement>(null);
  const [savedRinkIds, setSavedRinkIds] = useState<string[]>([]);
  const [savedRinks, setSavedRinks] = useState<RinkData[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedRink[]>([]);
  const [ratedRinks, setRatedRinks] = useState<{ id: string; name: string; city: string; state: string; ratedAt: number }[]>([]);
  const [staleNudge, setStaleNudge] = useState<{ id: string; name: string; daysOld: number } | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(() => {
    const dismissedAt = storage.getNudgeDismissedAt();
    return dismissedAt ? (Date.now() - new Date(dismissedAt).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
  });
  const [vibeCTA, setVibeCTA] = useState<{ text: string; action: string; icon: string } | null>(null);

  // Load Vibe CTA
  useEffect(() => {
    const vibe = getVibe();
    if (vibe.archetype !== 'unknown') {
      setVibeCTA(vibe.suggestedCTA);
    }
  }, []);

  // Load saved rinks
  useEffect(() => {
    setSavedRinkIds(storage.getSavedRinks());
  }, []);

  // Load recently viewed rinks from localStorage
  useEffect(() => {
    const viewed = storage.getAllViewedMeta();
    viewed.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
    setRecentlyViewed(viewed.slice(0, 5));
  }, []);

  // Load rated rinks from localStorage
  useEffect(() => {
    try {
      const rated = storage.getRatedRinks();
      const entries = Object.entries(rated);
      if (entries.length === 0) return;
      const rinks: { id: string; name: string; city: string; state: string; ratedAt: number }[] = [];
      for (const [id, timestamp] of entries) {
        const meta = storage.getRinkViewedMeta(id);
        if (meta?.name) {
          rinks.push({ id, name: meta.name, city: meta.city || '', state: meta.state || '', ratedAt: timestamp });
        }
      }
      rinks.sort((a, b) => b.ratedAt - a.ratedAt);
      setRatedRinks(rinks.slice(0, 5));

      // Compute stale nudge (30+ days old)
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      const stale = rinks
        .filter(r => (Date.now() - r.ratedAt) > THIRTY_DAYS)
        .sort((a, b) => a.ratedAt - b.ratedAt);
      if (stale.length > 0) {
        setStaleNudge({
          id: stale[0].id,
          name: stale[0].name,
          daysOld: Math.floor((Date.now() - stale[0].ratedAt) / (24 * 60 * 60 * 1000)),
        });
      }
    } catch {}
  }, []);

  // Fetch saved rink details via batch endpoint
  useEffect(() => {
    if (savedRinkIds.length === 0) return;
    async function loadSaved() {
      const idsParam = savedRinkIds.slice(0, 50).join(',');
      const { data } = await apiGet<{ data: RinkData[] }>(`/rinks?ids=${encodeURIComponent(idsParam)}`);
      if (data?.data) {
        setSavedRinks(data.data as RinkData[]);
      }
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
      const t = setTimeout(() => searchRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, []);

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
          <section style={{ maxWidth: layout.maxWidth5xl, margin: '0 auto', padding: pad(spacing[32], spacing[24]) }}>
            {searchResults.length > 0 ? (
              <>
                <h2 style={{
                  fontSize: 12, fontWeight: 500, color: colors.stone500,
                  textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing[16],
                }}>
                  Search results
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[16] }}>
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
              <div style={{ textAlign: 'center', padding: pad(48, spacing[24]), maxWidth: 400, margin: '0 auto' }}>
                <div style={{ fontSize: 36, marginBottom: spacing[12] }}>🏒</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, margin: spacing[0] }}>
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

        {/* What's New at Your Rinks */}
        {savedRinks.length > 0 && <WhatsNew savedRinks={savedRinks} />}

        {/* My Rinks (saved) */}
        {savedRinks.length > 0 && (
          <section id="my-rinks-section" aria-label="Saved rinks" style={{
            maxWidth: layout.maxWidth5xl, margin: '0 auto', padding: pad(spacing[32], spacing[24], spacing[0]),
          }}>
            <h3 style={{
              fontSize: 12, fontWeight: 500, color: colors.stone500,
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing[16],
              display: 'flex', alignItems: 'center', gap: spacing[6],
            }}>
              My Rinks
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[10] }}>
              {savedRinks.map((rink) => (
                <div
                  key={rink.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/rinks/${rink.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/rinks/${rink.id}`); } }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: pad(spacing[14], spacing[20]), background: colors.surface, border: `1px solid ${colors.stone200}`,
                    borderRadius: 12, cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.stone200; }}
                >
                  <div>
                    <div style={{ fontSize: text.lg, fontWeight: 600, color: colors.stone800 }}>{rink.name}</div>
                    <div style={{ fontSize: text.sm, color: colors.stone400, marginTop: spacing[2] }}>{rink.city}, {rink.state}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[10] }}>
                    {rink.summary && (
                      <span style={{
                        fontSize: text.xs, fontWeight: 500, padding: pad(spacing[3], spacing[10]), borderRadius: 10,
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
                        cursor: 'pointer', padding: spacing[12], minWidth: 44, minHeight: 44,
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
            maxWidth: layout.maxWidth5xl, margin: '0 auto', padding: pad(spacing[32], spacing[24], spacing[0]),
          }}>
            <h3 style={{
              fontSize: 12, fontWeight: 500, color: colors.stone500,
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing[16],
              display: 'flex', alignItems: 'center', gap: spacing[6],
            }}>
              Your Contributions
              <span style={{
                fontSize: 10, fontWeight: 600, padding: pad(spacing[1], spacing[7]),
                borderRadius: 10, background: colors.bgSuccess, color: colors.success,
              }}>
                {ratedRinks.length}
              </span>
            </h3>
            {staleNudge && !nudgeDismissed && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: spacing[12],
                padding: pad(spacing[12], spacing[16]), marginBottom: spacing[12],
                background: colors.bgWarning, border: `1px solid ${colors.warningBorder}`,
                borderRadius: 12,
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>🔄</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, margin: spacing[0] }}>
                    Your rating of {staleNudge.name} is {staleNudge.daysOld} days old
                  </p>
                  <p style={{ fontSize: 12, color: colors.textMuted, margin: pad(spacing[2], spacing[0], spacing[0]) }}>
                    Conditions may have changed — update it?
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/rinks/${staleNudge.id}`)}
                  style={{
                    fontSize: 12, fontWeight: 600,
                    color: colors.brand, background: colors.surface,
                    border: `1px solid ${colors.brandLight}`,
                    borderRadius: 10, padding: pad(spacing[8], spacing[14]),
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Update
                </button>
                <button
                  onClick={() => { storage.setNudgeDismissedAt(new Date().toISOString()); setNudgeDismissed(true); }}
                  aria-label="Dismiss"
                  style={{
                    fontSize: 14, color: colors.textMuted,
                    background: 'none', border: 'none',
                    cursor: 'pointer', padding: spacing[8],
                    flexShrink: 0, lineHeight: 1,
                    minWidth: 32, minHeight: 32,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
              {ratedRinks.map((rink) => (
                <div
                  key={rink.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/rinks/${rink.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/rinks/${rink.id}`); } }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: pad(spacing[12], spacing[18]), background: colors.surface, border: `1px solid ${colors.stone200}`,
                    borderRadius: 10, cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.stone200; }}
                >
                  <div>
                    <div style={{ fontSize: text.base, fontWeight: 600, color: colors.stone800 }}>{rink.name}</div>
                    <div style={{ fontSize: text.xs, color: colors.stone400, marginTop: spacing[2] }}>{rink.city}, {rink.state}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[8] }}>
                    <span style={{
                      fontSize: text['2xs'], fontWeight: 500, padding: pad(spacing[2], spacing[8]),
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

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <section aria-label="Recently viewed rinks" style={{
            maxWidth: layout.maxWidth5xl, margin: '0 auto', padding: pad(spacing[32], spacing[24], spacing[0]),
          }}>
            <h3 style={{
              fontSize: 12, fontWeight: 500, color: colors.stone500,
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing[16],
              display: 'flex', alignItems: 'center', gap: spacing[6],
            }}>
              Recently Viewed
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
              {recentlyViewed.map((rink) => (
                <div
                  key={rink.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/rinks/${rink.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/rinks/${rink.id}`); } }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: pad(spacing[12], spacing[18]), background: colors.surface, border: `1px solid ${colors.stone200}`,
                    borderRadius: 10, cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.stone200; }}
                >
                  <div>
                    <div style={{ fontSize: text.base, fontWeight: 600, color: colors.stone800 }}>{rink.name}</div>
                    <div style={{ fontSize: text.xs, color: colors.stone400, marginTop: spacing[2] }}>{rink.city}, {rink.state}</div>
                  </div>
                  <span style={{ fontSize: text.xs, color: colors.stone400, whiteSpace: 'nowrap', marginLeft: spacing[12] }}>
                    {timeAgo(rink.viewedAt)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Personalized CTA from Vibe Engine */}
        {vibeCTA && vibeCTA.action !== '/' && (
          <section style={{
            maxWidth: layout.maxWidth5xl, margin: '0 auto', padding: pad(spacing[24], spacing[24], spacing[0]),
          }}>
            <button
              onClick={() => router.push(vibeCTA.action)}
              style={{
                width: '100%', padding: pad(spacing[16], spacing[24]),
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing[10],
                fontSize: 15, fontWeight: 600,
                color: colors.brand, background: colors.bgInfo,
                border: `1px solid ${colors.brandLight}`,
                borderRadius: 14, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.brandBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = colors.bgInfo; }}
            >
              <span style={{ fontSize: 18 }}>{vibeCTA.icon}</span>
              {vibeCTA.text}
            </button>
          </section>
        )}

        {/* Season welcome banner */}
        <div style={{ paddingTop: spacing[24] }}>
          <SeasonWelcome />
        </div>

        {/* Add to home screen prompt (2nd+ visit) */}
        <div style={{ paddingTop: spacing[24] }}>
          <AddToHomeScreen />
        </div>

        {/* Push notification prompt */}
        <div style={{ paddingTop: spacing[16] }}>
          <PushPrompt />
        </div>

        {/* How it works */}
        <div style={{ paddingTop: spacing[40] }}>
          <HowItWorks />
        </div>

        {/* Team Manager CTA */}
        <TeamManagerCTA />
      </main>

      {/* Footer */}
      <footer style={{
        maxWidth: layout.maxWidth5xl, margin: '0 auto', padding: pad(spacing[28], spacing[24]),
        borderTop: `1px solid ${colors.stone200}`,
        display: 'flex', flexDirection: 'column', gap: spacing[6],
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
        <span style={{ fontSize: 11, color: colors.stone400 }}>
          <a href="/terms" style={{ color: colors.stone400, textDecoration: 'underline' }}>Terms</a>
          {' · '}
          <a href="/privacy" style={{ color: colors.stone400, textDecoration: 'underline' }}>Privacy</a>
        </span>
      </footer>
    </div>
  );
}
