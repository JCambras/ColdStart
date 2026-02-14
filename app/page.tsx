'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';


// ── Types ──
interface Signal {
  signal: string;
  value: number;
  confidence: number;
  count: number;
}
interface Tip {
  text: string;
  contributor_type: string;
}
interface RinkData {
  id: string;
  name: string;
  city: string;
  state: string;
  address?: string;
  created_at?: string;
  summary?: {
    verdict: string;
    signals: Signal[];
    tips: Tip[];
    contribution_count: number;
    confirmed_this_season: boolean;
  };
}

const API = 'http://localhost:8080/api/v1';

const SIGNAL_LABELS: Record<string, string> = {
  cold: 'Cold',
  parking: 'Parking',
  food_nearby: 'Food',
  chaos: 'Chaos',
  family_friendly: 'Family',
  locker_rooms: 'Lockers',
  pro_shop: 'Pro shop',
};

const SIGNAL_ICONS: Record<string, string> = {
  parking: '🅿️',
  cold: '❄️',
  food_nearby: '🍔',
  chaos: '🌀',
  family_friendly: '👨‍👩‍👧',
  locker_rooms: '🚪',
  pro_shop: '🏒',
};

const FEATURED_SEARCHES = [
  'IceWorks',
  'Ice Line',
  'hackensack',
];

const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

// Top hockey states first
const HOCKEY_STATES = ['MN', 'MI', 'MA', 'NY', 'PA', 'NJ', 'CT', 'NH', 'WI', 'IL', 'OH', 'CO', 'CA', 'TX', 'FL'];

function getVerdictColor(verdict: string) {
  if (verdict.includes('Good')) return '#16a34a';
  if (verdict.includes('Heads up')) return '#d97706';
  return '#6b7280';
}

// ── Compact signal badge ──
function SignalBadge({ signal, value }: { signal: string; value: number }) {
  const color = value >= 3.5 ? '#16a34a' : value >= 2.5 ? '#d97706' : '#ef4444';
  const bgColor = value >= 3.5 ? '#f0fdf4' : value >= 2.5 ? '#fffbeb' : '#fef2f2';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 6,
      background: bgColor, fontSize: 11, fontWeight: 600, color,
    }}>
      <span>{SIGNAL_ICONS[signal] || '📊'}</span>
      <span>{value.toFixed(1)}</span>
    </div>
  );
}

// ── Rink Card — redesigned with image placeholder right, signals compact left ──
function RinkCard({ rink, onClick }: { rink: RinkData; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const summary = rink.summary;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered
          ? '0 20px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(14,165,233,0.12)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        display: 'flex',
        minHeight: 200,
      }}
    >
      {/* Left: content */}
      <div style={{ flex: 1, padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
        {/* Rink name */}
        <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', lineHeight: 1.1, letterSpacing: -0.5 }}>
          {rink.name}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
          {rink.city}, {rink.state}
        </div>

        {summary ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginTop: 12 }}>
            <div>
              {/* Verdict */}
              <p style={{
                fontSize: 13, fontWeight: 600, color: getVerdictColor(summary.verdict),
                margin: 0, lineHeight: 1.4,
              }}>
                {summary.verdict}
              </p>

              {/* Signal bars */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginTop: 10 }}>
                {[...summary.signals]
                  .sort((a, b) => { if (a.signal === 'parking') return -1; if (b.signal === 'parking') return 1; return 0; })
                  .map((s) => {
                    const pct = Math.round(((s.value - 1) / 4) * 100);
                    const label = SIGNAL_LABELS[s.signal] || s.signal;
                    const color = s.value >= 3.5 ? '#0ea5e9' : s.value >= 2.5 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={s.signal} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <span style={{ width: 52, flexShrink: 0, color: '#374151', fontWeight: 500 }}>{label}</span>
                        <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.6s ease' }} />
                        </div>
                        <span style={{ width: 24, textAlign: 'right' as const, fontWeight: 600, fontSize: 11, color: '#374151' }}>
                          {s.value.toFixed(1)}
                        </span>
                      </div>
                    );
                  })
                }
              </div>
            </div>

            {/* Tip preview + count */}
            <div style={{ marginTop: 12 }}>
              {summary.tips.length > 0 && (
                <p style={{
                  fontSize: 12, color: '#6b7280', lineHeight: 1.45, margin: 0,
                  fontStyle: 'italic',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                  overflow: 'hidden',
                }}>
                  &ldquo;{summary.tips[0].text}&rdquo;
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  {summary.contribution_count} reports
                </span>
                {summary.confirmed_this_season && (
                  <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 10, background: '#ecfdf5', color: '#059669' }}>
                    ✓ This season
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 12 }}>
            No reports yet — be the first.
          </p>
        )}
      </div>

      {/* Right: image or placeholder */}
      {(() => {
        const n = (rink.name || '').toLowerCase();
        const hasPhoto = n.includes('ice line');
        if (hasPhoto) {
          return (
            <div style={{
              width: 180, flexShrink: 0,
              position: 'relative', overflow: 'hidden',
              borderLeft: '1px solid #f1f5f9',
            }}>
              <img
                src="/rink-photos/ice-line.jpeg"
                alt={rink.name}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center',
                  display: 'block',
                }}
              />
            </div>
          );
        }
        return (
          <div style={{
            width: 180, flexShrink: 0,
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderLeft: '1px solid #f1f5f9',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ fontSize: 48, opacity: 0.4 }}>🏒</div>
            <span style={{ fontSize: 10, color: '#93c5fd', marginTop: 4, fontWeight: 500 }}>Photo coming soon</span>
            <div style={{
              position: 'absolute', top: 20, right: -20,
              width: 80, height: 80, borderRadius: '50%',
              border: '2px solid rgba(14,165,233,0.08)',
            }} />
            <div style={{
              position: 'absolute', bottom: -10, left: -10,
              width: 60, height: 60, borderRadius: '50%',
              border: '2px solid rgba(14,165,233,0.06)',
            }} />
          </div>
        );
      })()}
    </div>
  );
}

// ── State Dropdown ──
function StateDropdown({ onSelect }: { onSelect: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  function handleEnter() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  }
  function handleLeave() {
    timerRef.current = setTimeout(() => setOpen(false), 200);
  }

  return (
    <div
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ position: 'relative' }}
    >
      <span style={{ fontSize: 13, color: '#6b7280', cursor: 'pointer', userSelect: 'none' }}>
        Browse by state ▾
      </span>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
          boxShadow: '0 20px 50px rgba(0,0,0,0.12)', padding: '12px 0',
          width: 280, maxHeight: 400, overflowY: 'auto', zIndex: 100,
        }}>
          <div style={{ padding: '0 16px 8px', fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>
            Top hockey states
          </div>
          {HOCKEY_STATES.map(code => (
            <div
              key={code}
              onClick={() => { onSelect(code); setOpen(false); }}
              style={{
                padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: '#374151',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f9ff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {US_STATES[code]} <span style={{ color: '#9ca3af', fontSize: 11 }}>({code})</span>
            </div>
          ))}
          <div style={{ height: 1, background: '#f1f5f9', margin: '8px 16px' }} />
          <div style={{ padding: '0 16px 8px', fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>
            All states
          </div>
          {Object.entries(US_STATES)
            .filter(([code]) => !HOCKEY_STATES.includes(code))
            .sort((a, b) => a[1].localeCompare(b[1]))
            .map(([code, name]) => (
              <div
                key={code}
                onClick={() => { onSelect(code); setOpen(false); }}
                style={{
                  padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: '#374151',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f9ff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {name} <span style={{ color: '#9ca3af', fontSize: 11 }}>({code})</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ── Auth types ──
interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  rinksRated: number;
  tipsSubmitted: number;
}

// ── Auth Modal ──
function AuthModal({ onClose, onLogin }: { onClose: () => void; onLogin: (profile: UserProfile) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSubmit() {
    if (!email.trim()) return;
    setSending(true);
    // In production: POST to /api/v1/auth/magic-link
    // For now: create/retrieve profile from localStorage
    setTimeout(() => {
      const existing = JSON.parse(localStorage.getItem('coldstart_profiles') || '{}');
      let profile = existing[email.toLowerCase()];
      if (!profile) {
        if (mode === 'signin') {
          // Show "no account" and switch to signup
          setSending(false);
          setMode('signup');
          return;
        }
        // Create new profile
        profile = {
          id: 'user_' + Math.random().toString(36).slice(2, 10),
          email: email.toLowerCase(),
          name: name.trim() || email.split('@')[0],
          createdAt: new Date().toISOString(),
          rinksRated: 0,
          tipsSubmitted: 0,
        };
        existing[email.toLowerCase()] = profile;
        localStorage.setItem('coldstart_profiles', JSON.stringify(existing));
      }
      localStorage.setItem('coldstart_current_user', JSON.stringify(profile));
      setSending(false);
      setSent(true);
      setTimeout(() => onLogin(profile), 600);
    }, 800);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, maxWidth: 400, width: '100%',
          padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>You&apos;re in!</p>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>Welcome to ColdStart.</p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>
                cold<span style={{ color: '#0ea5e9' }}>start</span>
              </span>
              <p style={{ fontSize: 15, color: '#6b7280', marginTop: 8, margin: '8px 0 0' }}>
                {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
              </p>
            </div>

            {mode === 'signup' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: 15,
                    border: '1px solid #d1d5db', borderRadius: 10,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="your@email.com"
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 15,
                  border: '1px solid #d1d5db', borderRadius: 10,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={sending || !email.trim()}
              style={{
                width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 700,
                background: sending ? '#93c5fd' : '#0ea5e9', color: '#fff',
                border: 'none', borderRadius: 10, cursor: sending ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                opacity: !email.trim() ? 0.5 : 1,
              }}
            >
              {sending ? 'Signing in...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>

            <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
              {mode === 'signin' ? (
                <>Don&apos;t have an account?{' '}
                  <span onClick={() => setMode('signup')} style={{ color: '#0ea5e9', cursor: 'pointer', fontWeight: 600 }}>
                    Sign up
                  </span>
                </>
              ) : (
                <>Already have an account?{' '}
                  <span onClick={() => setMode('signin')} style={{ color: '#0ea5e9', cursor: 'pointer', fontWeight: 600 }}>
                    Sign in
                  </span>
                </>
              )}
            </p>

            <div style={{
              marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', margin: 0 }}>
                Save rinks, track your contributions, and build your reputation as a trusted reviewer.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Profile Dropdown ──
function ProfileDropdown({ user, onSignOut, onClose }: { user: UserProfile; onSignOut: () => void; onClose: () => void }) {
  const initials = (user.name || user.email).slice(0, 2).toUpperCase();
  const savedCount = (() => {
    try { return JSON.parse(localStorage.getItem('coldstart_my_rinks') || '[]').length; } catch { return 0; }
  })();

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: 56, right: 16,
          background: '#fff', borderRadius: 14, width: 280,
          boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Profile header */}
        <div style={{ padding: '16px 16px 12px', background: '#f9fafb', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13, fontWeight: 700,
            }}>
              {initials}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{user.name}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{user.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '12px 16px', display: 'flex', gap: 16, borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>{user.rinksRated}</p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Rinks rated</p>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>{user.tipsSubmitted}</p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Tips shared</p>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>{savedCount}</p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Saved rinks</p>
          </div>
        </div>

        {/* Trusted badge progress */}
        {user.rinksRated < 10 && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>🏅 Trusted Reviewer</span>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{user.rinksRated}/10 rinks</span>
            </div>
            <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2 }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, #0ea5e9, #3b82f6)',
                width: `${Math.min(100, (user.rinksRated / 10) * 100)}%`,
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}
        {user.rinksRated >= 10 && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>🏅</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#d97706' }}>Trusted Reviewer</span>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={onSignOut}
          style={{
            width: '100%', padding: '12px 16px', fontSize: 13, fontWeight: 500,
            color: '#ef4444', background: 'none', border: 'none',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── Main page ──
export default function HomePage() {
  const router = useRouter();
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


  // Auth state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Load current user on mount
  useEffect(() => {
    try {
      const u = localStorage.getItem('coldstart_current_user');
      if (u) setCurrentUser(JSON.parse(u));
    } catch {}
  }, []);

  function handleLogin(profile: UserProfile) {
    setCurrentUser(profile);
    setShowAuthModal(false);
  }

  function handleSignOut() {
    localStorage.removeItem('coldstart_current_user');
    setCurrentUser(null);
    setShowProfileDropdown(false);
  }

  // Load saved rinks
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('coldstart_my_rinks') || '[]');
      setSavedRinkIds(saved);
    } catch {}
  }, []);

  // Fetch saved rink details
  useEffect(() => {
    if (savedRinkIds.length === 0) return;
    async function loadSaved() {
      const results: RinkData[] = [];
      for (const id of savedRinkIds) {
        try {
          const res = await fetch(`${API}/rinks/${id}`);
          const d = await res.json();
          if (d.data) results.push({ ...d.data.rink, ...d.data, name: d.data.rink?.name || d.data.name });
        } catch {}
      }
      setSavedRinks(results);
    }
    loadSaved();
  }, [savedRinkIds]);

  // Carousel state — rotate through featured rinks
  const [activeCard, setActiveCard] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  // Auto-focus search on desktop
  useEffect(() => {
    if (window.innerWidth > 768) {
      setTimeout(() => searchRef.current?.focus(), 300);
    }
  }, []);

  // Carousel auto-rotation
  useEffect(() => {
    if (carouselPaused || rinks.length <= 1) return;
    const interval = setInterval(() => {
      setActiveCard(prev => (prev + 1) % rinks.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [carouselPaused, rinks.length]);

  // Count unique states from featured + recent rinks
  const stateCount = new Set([...rinks, ...recentRinks].map(r => r.state)).size || 15;

  // Load featured rinks + recent rinks on mount
  useEffect(() => {
    async function loadFeatured() {
      const results: RinkData[] = [];
      for (const q of FEATURED_SEARCHES) {
        try {
          const res = await fetch(`${API}/rinks?query=${encodeURIComponent(q)}`);
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            const rink = data.data[0];
            try {
              const detail = await fetch(`${API}/rinks/${rink.id}`);
              const d = await detail.json();
              if (d.data) {
                // Merge: keep name/city/state from search if detail is missing them
                results.push({
                  ...rink,
                  ...d.data,
                  name: d.data.name || rink.name,
                  city: d.data.city || rink.city,
                  state: d.data.state || rink.state,
                });
              } else {
                results.push(rink);
              }
            } catch {
              results.push(rink);
            }
          }
        } catch {}
      }
      // Deduplicate by id
      const seen = new Set<string>();
      const unique = results.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
      setRinks(unique);
    }

    async function loadRecent() {
      try {
        const res = await fetch(`${API}/rinks?limit=6`);
        const data = await res.json();
        if (data.data) setRecentRinks(data.data);
        if (data.total) setTotalRinks(data.total);
      } catch {}
    }

    loadFeatured();
    loadRecent();
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      setRinkRequestSent(false);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/rinks?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(data.data || []);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const displayRinks = searchResults !== null ? searchResults : rinks;
  const showCarousel = searchResults === null && rinks.length > 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fafbfc',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* ── Nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
        background: 'rgba(250,251,252,0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid #f1f5f9',
      }}>
        {/* Logo — bigger */}
        <span style={{ fontSize: 48, fontWeight: 800, color: '#111827', letterSpacing: -1 }}>
          cold<span style={{ color: '#0ea5e9' }}>start</span>
        </span>
        <StateDropdown onSelect={(code) => router.push(`/states/${code}`)} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => router.push('/calendar')}
            style={{
              fontSize: 13, fontWeight: 600, color: '#d97706',
              background: '#fffbeb', border: '1px solid #fde68a',
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
              fontSize: 13, fontWeight: 600, color: '#0ea5e9',
              background: '#f0f9ff', border: '1px solid #bae6fd',
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            ⭐ My Rinks
          </button>
          {currentUser ? (
            <button
              onClick={() => setShowProfileDropdown(true)}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer', flexShrink: 0,
              }}
            >
              {(currentUser.name || currentUser.email).slice(0, 2).toUpperCase()}
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                fontSize: 13, fontWeight: 600, color: '#fff',
                background: '#111827', border: 'none',
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
          fontWeight: 700, color: '#111827',
          lineHeight: 1.08, letterSpacing: -1,
        }}>
          Scout the rink before you go.
        </h1>
        <p style={{
          fontSize: 17, color: '#6b7280', lineHeight: 1.5,
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
              width: 20, height: 20, color: searchFocused ? '#0ea5e9' : '#9ca3af',
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
              border: `2px solid ${searchFocused ? '#0ea5e9' : '#e5e7eb'}`,
              borderRadius: 16,
              outline: 'none',
              background: '#fff',
              color: '#111827',
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
                fontSize: 16, color: '#9ca3af', padding: 4,
              }}
            >
              ✕
            </button>
          )}
        </div>
        <p style={{ fontSize: 12, color: '#b0b7c3', marginTop: 10 }}>
          {totalRinks > 0 ? `${totalRinks} rinks across ${stateCount} states` : ''}
        </p>
      </section>

      {/* ── Rink Cards — carousel or search results ── */}
      <section style={{ maxWidth: 750, margin: '0 auto', padding: '24px 24px 32px' }}>
        {showCarousel ? (
          <>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <h2 style={{
                fontSize: 13, fontWeight: 600, color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: 1.5,
              }}>
                Featured rinks
              </h2>
              {/* Carousel dots */}
              <div style={{ display: 'flex', gap: 6 }}>
                {rinks.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveCard(i); setCarouselPaused(true); }}
                    style={{
                      width: i === activeCard ? 20 : 8, height: 8,
                      borderRadius: 4,
                      background: i === activeCard ? '#0ea5e9' : '#d1d5db',
                      border: 'none', cursor: 'pointer', padding: 0,
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Single card display with fade */}
            <div
              onMouseEnter={() => setCarouselPaused(true)}
              onMouseLeave={() => setCarouselPaused(false)}
            >
              {rinks[activeCard] && (
                <div
                  key={rinks[activeCard].id}
                  style={{
                    animation: 'fadeIn 0.4s ease',
                  }}
                >
                  <RinkCard
                    rink={rinks[activeCard]}
                    onClick={() => router.push(`/rinks/${rinks[activeCard].id}`)}
                  />
                </div>
              )}
            </div>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          </>
        ) : displayRinks.length > 0 ? (
          <>
            <h2 style={{
              fontSize: 13, fontWeight: 600, color: '#9ca3af',
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
            <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
              No rinks found for &ldquo;{query}&rdquo;
            </p>
            {rinkRequestSent ? (
              <div style={{ marginTop: 16, padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#16a34a', margin: 0 }}>Got it!</p>
                <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                  We&apos;ll add &ldquo;{query}&rdquo; and email you when it&apos;s live.
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8, lineHeight: 1.5 }}>
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
                      flex: 1, fontSize: 14, padding: '10px 14px',
                      border: '1px solid #e5e7eb', borderRadius: 10,
                      outline: 'none', fontFamily: 'inherit', color: '#111827',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
                  />
                  <button
                    onClick={() => {
                      if (!rinkRequestEmail.trim()) return;
                      try {
                        const requests = JSON.parse(localStorage.getItem('coldstart_rink_requests') || '[]');
                        requests.push({ query, email: rinkRequestEmail.trim(), timestamp: new Date().toISOString() });
                        localStorage.setItem('coldstart_rink_requests', JSON.stringify(requests));
                      } catch {}
                      setRinkRequestSent(true);
                    }}
                    disabled={!rinkRequestEmail.trim()}
                    style={{
                      fontSize: 14, fontWeight: 600, color: rinkRequestEmail.trim() ? '#fff' : '#9ca3af',
                      background: rinkRequestEmail.trim() ? '#0ea5e9' : '#e5e7eb',
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
          <div>
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
              display: 'flex', minHeight: 200, overflow: 'hidden',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              <div style={{ flex: 1, padding: 24 }}>
                <div style={{ height: 22, width: '70%', background: '#f1f5f9', borderRadius: 8, marginBottom: 8 }} />
                <div style={{ height: 14, width: '40%', background: '#f1f5f9', borderRadius: 6, marginBottom: 20 }} />
                <div style={{ height: 14, width: '55%', background: '#f1f5f9', borderRadius: 6, marginBottom: 14 }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} style={{ height: 24, width: 48, background: '#f1f5f9', borderRadius: 6 }} />
                  ))}
                </div>
              </div>
              <div style={{ width: 180, background: '#f8fafc', borderLeft: '1px solid #f1f5f9' }} />
            </div>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
          </div>
        )}
      </section>

      {/* ── My Rinks (saved) ── */}
      {savedRinks.length > 0 && (
        <section id="my-rinks-section" style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 0' }}>
          <h3 style={{
            fontSize: 13, fontWeight: 600, color: '#9ca3af',
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
                  padding: '14px 20px', background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: 12, cursor: 'pointer', transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{rink.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{rink.city}, {rink.state}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {rink.summary && (
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 10,
                      background: rink.summary.verdict.includes('Good') ? '#f0fdf4' : '#fffbeb',
                      color: rink.summary.verdict.includes('Good') ? '#16a34a' : '#d97706',
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
                      fontSize: 11, color: '#9ca3af', background: 'none', border: 'none',
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
          fontSize: 28, fontWeight: 700, color: '#111827',
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
            borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none',
          }}>
            <span style={{
              fontSize: 32, fontWeight: 700, color: '#e5e7eb', lineHeight: 1,
              flexShrink: 0, width: 40,
            }}>
              {step.num}
            </span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.55, marginTop: 4 }}>
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
          fontWeight: 700, color: '#111827',
          letterSpacing: -0.5, lineHeight: 1.2,
        }}>
          Your next away game starts here.
        </p>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        maxWidth: 1100, margin: '0 auto', padding: '28px 24px',
        borderTop: '1px solid #f1f5f9',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          Built by hockey parents, for hockey parents.
        </span>
        <span style={{ fontSize: 11, color: '#d1d5db' }}>v0.3</span>
      </footer>

      {/* ── Auth Modal ── */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />
      )}

      {/* ── Profile Dropdown ── */}
      {showProfileDropdown && currentUser && (
        <ProfileDropdown
          user={currentUser}
          onSignOut={handleSignOut}
          onClose={() => setShowProfileDropdown(false)}
        />
      )}
    </div>
  );
}
