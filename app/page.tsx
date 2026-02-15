'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../lib/constants';
import { Logo } from '../components/Logo';
import { apiGet } from '../lib/api';
import { storage } from '../lib/storage';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { colors, text } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { RinkCard, RinkData } from '../components/RinkCard';
import { StateDropdown } from '../components/StateDropdown';
import { ProfileDropdown } from '../components/ProfileDropdown';


const FEATURED_SEARCHES = [
  'IceWorks',
  'Ice Line',
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
  const [rinkRequestEmail, setRinkRequestEmail] = useState('');
  const [rinkRequestSent, setRinkRequestSent] = useState(false);
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
      setRinkRequestSent(false);
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

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bgPage,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* ── Nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
        background: 'rgba(250,251,252,0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: `1px solid ${colors.borderLight}`,
      }}>
        {/* Logo — bigger */}
        <Logo size={48} />
        <StateDropdown onSelect={(code) => router.push(`/states/${code}`)} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => router.push('/calendar')}
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
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: text.sm, fontWeight: 700,
                border: 'none', cursor: 'pointer', flexShrink: 0,
              }}
            >
              {(currentUser.name || currentUser.email).slice(0, 2).toUpperCase()}
            </button>
          ) : (
            <button
              onClick={openAuth}
              style={{
                fontSize: text.md, fontWeight: 600, color: '#fff',
                background: colors.textPrimary, border: 'none',
                borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Sign in
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero + Search ── */}
      <section style={{
        maxWidth: 700, margin: '0 auto',
        padding: 'clamp(40px, 8vw, 80px) 24px 24px', textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 52px)',
          fontWeight: 700, color: colors.textPrimary,
          lineHeight: 1.08, letterSpacing: -1,
        }}>
          Scout the rink before you go.
        </h1>
        <p style={{
          fontSize: 17, color: colors.textTertiary, lineHeight: 1.5,
          marginTop: 16,
          marginLeft: 'auto', marginRight: 'auto',
        }}>
          Parking, temp, food, and tips — from parents who were just there.
        </p>

        {/* ── Search Bar ── */}
        <div style={{
          position: 'relative', maxWidth: 560,
          margin: '32px auto 0',
        }}>
          <svg
            style={{
              position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
              width: 20, height: 20, color: searchFocused ? colors.brand : colors.textMuted,
              transition: 'color 0.2s',
            }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by rink name, city, or state..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: '100%',
              padding: '16px 20px 16px 52px',
              fontSize: 17,
              border: `2px solid ${searchFocused ? colors.brand : colors.borderDefault}`,
              borderRadius: 16,
              outline: 'none',
              background: '#fff',
              color: colors.textPrimary,
              transition: 'all 0.25s ease',
              boxShadow: searchFocused
                ? '0 0 0 4px rgba(14,165,233,0.1), 0 8px 24px rgba(0,0,0,0.06)'
                : '0 2px 8px rgba(0,0,0,0.04)',
              fontFamily: 'inherit',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setSearchResults(null); searchRef.current?.focus(); }}
              style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 16, color: colors.textMuted, padding: 4,
              }}
            >
              ✕
            </button>
          )}
        </div>
        <p style={{ fontSize: text.sm, color: '#b0b7c3', marginTop: 10 }}>
          {totalRinks > 0 ? `${totalRinks} rinks across ${stateCount} states` : ''}
        </p>
      </section>

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
            {rinkRequestSent ? (
              <div style={{ marginTop: 16, padding: '16px 20px', background: colors.bgSuccess, border: `1px solid ${colors.successBorder}`, borderRadius: 12 }}>
                <p style={{ fontSize: text.base, fontWeight: 600, color: colors.success, margin: 0 }}>Got it!</p>
                <p style={{ fontSize: text.md, color: colors.textTertiary, marginTop: 4 }}>
                  We&apos;ll add &ldquo;{query}&rdquo; and email you when it&apos;s live.
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: text.base, color: colors.textTertiary, marginTop: 8, lineHeight: 1.5 }}>
                  Know a rink we&apos;re missing? Drop your email and we&apos;ll add it.
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <input
                    value={rinkRequestEmail}
                    onChange={(e) => setRinkRequestEmail(e.target.value)}
                    placeholder="your@email.com"
                    type="email"
                    autoComplete="email"
                    style={{
                      flex: 1, fontSize: text.base, padding: '10px 14px',
                      border: `1px solid ${colors.borderDefault}`, borderRadius: 10,
                      outline: 'none', fontFamily: 'inherit', color: colors.textPrimary,
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}
                  />
                  <button
                    onClick={() => {
                      if (!rinkRequestEmail.trim()) return;
                      const requests = storage.getRinkRequests();
                      requests.push({ query, email: rinkRequestEmail.trim(), timestamp: new Date().toISOString() });
                      storage.setRinkRequests(requests);
                      setRinkRequestSent(true);
                    }}
                    disabled={!rinkRequestEmail.trim()}
                    style={{
                      fontSize: text.base, fontWeight: 600, color: rinkRequestEmail.trim() ? '#fff' : colors.textMuted,
                      background: rinkRequestEmail.trim() ? colors.brand : colors.borderDefault,
                      border: 'none', borderRadius: 10, padding: '10px 20px',
                      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                    }}
                  >
                    Notify me
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Loading skeleton */
          <LoadingSkeleton variant="card" />
        )}
      </section>

      {/* ── My Rinks (saved) ── */}
      {savedRinks.length > 0 && (
        <section id="my-rinks-section" style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 0' }}>
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
                onClick={() => router.push(`/rinks/${rink.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px', background: '#fff', border: `1px solid ${colors.borderDefault}`,
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
                      localStorage.setItem('coldstart_my_rinks', JSON.stringify(updated));
                    }}
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
      <section style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px 40px' }}>
        <h2 style={{
          fontSize: 28, fontWeight: 700, color: colors.textPrimary,
          textAlign: 'center', marginBottom: 28, letterSpacing: -0.5,
        }}>
          How it works
        </h2>

        {[
          { num: '01', title: 'Search for a rink', desc: 'By name, city, or state. New rinks added weekly.' },
          { num: '02', title: 'Get the parent verdict', desc: 'Parking, cold, food, chaos — rated and summarized by parents who were just there.' },
          { num: '03', title: 'Drop a tip or rate a signal', desc: 'Takes 10 seconds. Your info updates the summary instantly for the next family.' },
          { num: '04', title: 'Share with the team', desc: 'Send the link to your group chat. Better info = fewer surprises on game day.' },
        ].map((step, i) => (
          <div key={step.num} style={{
            display: 'flex', gap: 20, alignItems: 'flex-start',
            padding: '16px 0',
            borderBottom: i < 3 ? `1px solid ${colors.borderLight}` : 'none',
          }}>
            <span style={{
              fontSize: 32, fontWeight: 700, color: colors.borderDefault, lineHeight: 1,
              flexShrink: 0, width: 40,
            }}>
              {step.num}
            </span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: text.base, color: colors.textTertiary, lineHeight: 1.55, marginTop: 4 }}>
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

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
    </div>
  );
}
