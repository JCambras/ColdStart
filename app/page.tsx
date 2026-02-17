'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '../components/PageShell';
import { apiGet } from '../lib/api';
import { storage } from '../lib/storage';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { colors, text } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { RinkCard, RinkData } from '../components/RinkCard';
import { StateDropdown } from '../components/StateDropdown';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { HeroSearch } from '../components/home/HeroSearch';
import { HowItWorks } from '../components/home/HowItWorks';
import { RinkRequestForm } from '../components/home/RinkRequestForm';


const FEATURED_SEARCHES = [
  'Ice Line',
  'IceWorks',
  'hackensack',
];

// ── Main page ──
export default function HomePage() {
  const router = useRouter();
  const { currentUser, isLoggedIn, openAuth } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [rinks, setRinks] = useState<RinkData[]>([]);
  const [recentRinks, setRecentRinks] = useState<RinkData[]>([]);
  const [searchResults, setSearchResults] = useState<RinkData[] | null>(null);
  const [totalRinks, setTotalRinks] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const [savedRinkIds, setSavedRinkIds] = useState<string[]>([]);
  const [savedRinks, setSavedRinks] = useState<RinkData[]>([]);

  // Profile dropdown
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Load saved rinks
  useEffect(() => {
    setSavedRinkIds(storage.getSavedRinks());
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

  // Auto-focus search on desktop
  useEffect(() => {
    if (window.innerWidth > 768) {
      setTimeout(() => searchRef.current?.focus(), 300);
    }
  }, []);

  // Count unique states from featured + recent rinks
  const stateCount = new Set([...rinks, ...recentRinks].map(r => r.state)).size || 15;

  // Load featured rinks + recent rinks on mount
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
      const { data } = await apiGet<RinkData[]>('/rinks?limit=6', {
        seedPath: '/data/rinks.json',
        transform: (raw) => {
          const rinks = raw as RinkData[];
          setTotalRinks(rinks.length);
          return rinks.slice(0, 6);
        },
      });
      if (data && data.length > 0) {
        setRecentRinks(data);
        if (!totalRinks) setTotalRinks(data.length);
      }
    }

    loadFeatured();
    loadRecent();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      const q = query.toLowerCase();
      const { data } = await apiGet<RinkData[]>(`/rinks?query=${encodeURIComponent(query)}`, {
        seedPath: '/data/rinks.json',
        transform: (raw) => {
          const rinks = raw as RinkData[];
          return rinks.filter((r) =>
            r.name?.toLowerCase().includes(q) || r.city?.toLowerCase().includes(q) || r.state?.toLowerCase().includes(q)
          ).slice(0, 10);
        },
      });
      setSearchResults(data || []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const displayRinks = searchResults !== null ? searchResults : rinks;
  const showCarousel = searchResults === null && rinks.length > 0;

  function handleClearSearch() {
    setQuery('');
    setSearchResults(null);
    searchRef.current?.focus();
  }

  const navRightContent = (
    <>
      <button
        onClick={() => router.push('/calendar')}
        aria-label="Tournaments"
        style={{
          fontSize: text.md, fontWeight: 600, color: colors.warning,
          background: colors.bgWarning, border: `1px solid ${colors.warningBorder}`,
          borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        🏆
      </button>
      <button
        onClick={() => {
          const el = document.getElementById('my-rinks-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        style={{
          fontSize: text.md, fontWeight: 600, color: colors.brand,
          background: colors.bgInfo, border: `1px solid ${colors.brandLight}`,
          borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
      >
        ⭐ My Rinks
      </button>
      {isLoggedIn && currentUser ? (
        <button
          onClick={() => setShowProfileDropdown(true)}
          aria-label="Profile menu"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: colors.white, fontSize: text.sm, fontWeight: 700,
            border: 'none', cursor: 'pointer', flexShrink: 0,
          }}
        >
          {(currentUser.name || currentUser.email).slice(0, 2).toUpperCase()}
        </button>
      ) : (
        <button
          onClick={openAuth}
          style={{
            fontSize: text.md, fontWeight: 600, color: colors.white,
            background: colors.textPrimary, border: 'none',
            borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Sign in
        </button>
      )}
    </>
  );

  return (
    <PageShell
      logoSize={48}
      navCenter={<StateDropdown onSelect={(code) => router.push(`/states/${code}`)} />}
      navRight={navRightContent}
    >
      {/* ── Hero + Search ── */}
      <HeroSearch
        query={query}
        onQueryChange={setQuery}
        searchFocused={searchFocused}
        onSearchFocus={() => setSearchFocused(true)}
        onSearchBlur={() => setSearchFocused(false)}
        searchRef={searchRef}
        totalRinks={totalRinks}
        stateCount={stateCount}
        onClearSearch={handleClearSearch}
      />

      {/* ── Rink Cards — carousel or search results ── */}
      <section style={{ maxWidth: 750, margin: '0 auto', padding: '24px 24px 32px' }}>
        {showCarousel ? (
          <>
            <h2 style={{
              fontSize: text.md, fontWeight: 600, color: colors.textMuted,
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
            }}>
              Featured rinks
            </h2>

            {/* Horizontal scroll carousel */}
            <div
              className="featured-scroll"
              style={{
                display: 'flex',
                gap: 16,
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                paddingBottom: 4,
              }}
            >
              {rinks.map((rink) => (
                <div
                  key={rink.id}
                  style={{
                    flex: '0 0 auto',
                    width: 'min(85vw, 680px)',
                    scrollSnapAlign: 'start',
                  }}
                >
                  <RinkCard
                    rink={rink}
                    onClick={() => router.push(`/rinks/${rink.id}`)}
                  />
                </div>
              ))}
            </div>
          </>
        ) : displayRinks.length > 0 ? (
          <>
            <h2 style={{
              fontSize: text.md, fontWeight: 600, color: colors.textMuted,
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
            }}>
              Search results
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {displayRinks.map((rink) => (
                <RinkCard
                  key={rink.id}
                  rink={rink}
                  onClick={() => router.push(`/rinks/${rink.id}`)}
                />
              ))}
            </div>
          </>
        ) : searchResults !== null ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏒</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
              No rinks found for &ldquo;{query}&rdquo;
            </p>
            <RinkRequestForm query={query} />
          </div>
        ) : (
          /* Loading skeleton */
          <LoadingSkeleton variant="card" />
        )}
      </section>

      {/* ── My Rinks (saved) ── */}
      {savedRinks.length > 0 && (
        <section id="my-rinks-section" aria-label="Saved rinks" style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 0' }}>
          <h3 style={{
            fontSize: text.md, fontWeight: 600, color: colors.textMuted,
            textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ⭐ My Rinks
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
                  padding: '14px 20px', background: colors.white, border: `1px solid ${colors.borderDefault}`,
                  borderRadius: 12, cursor: 'pointer', transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}
              >
                <div>
                  <div style={{ fontSize: text.lg, fontWeight: 600, color: colors.textPrimary }}>{rink.name}</div>
                  <div style={{ fontSize: text.sm, color: colors.textTertiary, marginTop: 2 }}>{rink.city}, {rink.state}</div>
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
                      fontSize: text.xs, color: colors.textMuted, background: 'none', border: 'none',
                      cursor: 'pointer', padding: '4px',
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

      {/* ── How it works ── */}
      <HowItWorks />

      {/* ── Tagline ── */}
      <section style={{ textAlign: 'center', padding: '40px 24px 48px' }}>
        <p style={{
          fontSize: 'clamp(22px, 4vw, 32px)',
          fontWeight: 700, color: colors.textPrimary,
          letterSpacing: -0.5, lineHeight: 1.2,
        }}>
          Your next away game starts here.
        </p>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        maxWidth: 1100, margin: '0 auto', padding: '28px 24px',
        borderTop: `1px solid ${colors.borderLight}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: text.sm, color: colors.textMuted }}>
          Built by hockey parents, for hockey parents.
        </span>
        <span style={{ fontSize: text.xs, color: colors.textDisabled }}>v0.3</span>
      </footer>

      {/* ── Profile Dropdown ── */}
      {showProfileDropdown && currentUser && (
        <ProfileDropdown
          onClose={() => setShowProfileDropdown(false)}
        />
      )}
    </PageShell>
  );
}
