'use client';

import { useState, useEffect, useRef, RefObject } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../Logo';
import { colors, shadow, layout } from '../../lib/theme';

interface HeroSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  totalRinks: number;
  stateCount: number;
  onClearSearch: () => void;
  onSearchSubmit?: () => void;
}

export function HeroSearch({
  query, onQueryChange, searchRef, totalRinks, stateCount, onClearSearch, onSearchSubmit,
}: HeroSearchProps) {
  const { isLoggedIn, currentUser, openAuth, logout } = useAuth();
  const [focused, setFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <section style={{
      position: 'relative',
      height: '65vh',
      minHeight: 480,
      maxHeight: 640,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Background photo */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
      }}>
        <img
          src="/rink-photos/hero-rink.webp"
          alt=""
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
          }}
        />
      </div>
      {/* Dark overlay on top of photo */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1,
        background: `linear-gradient(135deg, rgba(15,25,35,0.85) 0%, rgba(26,45,61,0.8) 50%, rgba(30,51,68,0.75) 100%)`,
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2,
        background: 'radial-gradient(ellipse at 30% 50%, rgba(15,25,35,0.4) 0%, transparent 70%)',
      }} />

      {/* Top bar */}
      <nav style={{
        position: 'relative', zIndex: 10,
        maxWidth: layout.maxWidth5xl, width: '100%',
        margin: '0 auto', padding: '20px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Logo size={28} stacked light />
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            <span style={{ display: 'block', width: 20, height: 2, background: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
            <span style={{ display: 'block', width: 20, height: 2, background: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
            <span style={{ display: 'block', width: 20, height: 2, background: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 8,
              background: '#ffffff', border: `1px solid ${colors.stone200}`,
              borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              minWidth: 180, padding: '8px 0', zIndex: 100,
            }}>
              {isLoggedIn ? (
                <>
                  <div style={{
                    padding: '10px 16px', fontSize: 13, color: colors.stone400,
                    borderBottom: `1px solid ${colors.stone200}`, marginBottom: 4,
                  }}>
                    {currentUser?.name || 'Signed in'}
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    style={{
                      display: 'block', width: '100%', padding: '10px 16px',
                      fontSize: 14, color: colors.stone700,
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = colors.stone50; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setMenuOpen(false); openAuth(); }}
                  style={{
                    display: 'block', width: '100%', padding: '10px 16px',
                    fontSize: 14, fontWeight: 500, color: colors.brand,
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = colors.stone50; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Sign in
                </button>
              )}
              <div style={{ height: 1, background: colors.stone200, margin: '4px 0' }} />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  const el = document.getElementById('my-rinks-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  display: 'block', width: '100%', padding: '10px 16px',
                  fontSize: 14, color: colors.stone700,
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = colors.stone50; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                My Rinks
              </button>
              <div style={{ height: 1, background: colors.stone200, margin: '4px 0' }} />
              <a
                href="/team"
                style={{
                  display: 'block', padding: '10px 16px',
                  fontSize: 14, color: colors.stone700,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = colors.stone50; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                Team Dashboard
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* Centered content */}
      <div style={{
        position: 'relative', zIndex: 10,
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '0 24px 40px', textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: isMobile ? 36 : 48,
          fontWeight: 600, color: '#ffffff',
          lineHeight: 1.1, letterSpacing: -0.5,
          margin: 0,
        }}>
          Scout the rink
        </h1>
        <p style={{
          fontSize: isMobile ? 15 : 17,
          fontWeight: 300, color: colors.stone300,
          lineHeight: 1.5, marginTop: 12,
          maxWidth: 480,
        }}>
          Parking, cold level, food nearby — from parents who&apos;ve been there.
        </p>

        {/* Pill search */}
        <div
          style={{
            position: 'relative', width: '100%', maxWidth: 520,
            marginTop: 28, borderRadius: 9999,
            background: '#ffffff',
            boxShadow: focused
              ? `${shadow.xl}, 0 0 0 3px rgba(255,255,255,0.4)`
              : shadow.xl,
            transition: 'box-shadow 0.25s ease',
          }}
        >
          <svg
            aria-hidden="true"
            style={{
              position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
              width: 18, height: 18, color: colors.stone400,
            }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && onSearchSubmit) onSearchSubmit(); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search by rink name or city..."
            aria-label="Search rinks"
            style={{
              width: '100%', padding: '14px 120px 14px 48px',
              fontSize: 16, border: 'none', outline: 'none',
              borderRadius: 9999, background: 'transparent',
              color: colors.stone800, fontFamily: 'inherit',
            }}
          />
          {query ? (
            <button
              onClick={onClearSearch}
              aria-label="Clear search"
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                padding: '8px 20px', fontSize: 14, fontWeight: 600,
                background: colors.amber, color: colors.navy900,
                border: 'none', borderRadius: 9999, cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.amber400; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = colors.amber; }}
            >
              Clear
            </button>
          ) : (
            <button
              onClick={onSearchSubmit}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                padding: '8px 20px', fontSize: 14, fontWeight: 600,
                background: colors.amber, color: colors.navy900,
                border: 'none', borderRadius: 9999, cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.amber400; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = colors.amber; }}
            >
              Search
            </button>
          )}
        </div>

        {/* Stats */}
        <p style={{
          fontSize: 13, color: 'rgba(168,162,158,0.8)',
          marginTop: 14, letterSpacing: 0.2,
        }}>
          {totalRinks > 0
            ? `${totalRinks}+ rinks rated · ${stateCount > 0 ? `${stateCount}+ parent reports · ` : ''}PA, NJ, NY, MI`
            : '200+ rinks rated · 1,400+ parent reports · PA, NJ, NY, MI'}
        </p>
      </div>
    </section>
  );
}
