'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SIGNAL_ORDER, API_URL, SignalType } from '../../../lib/constants';
import { Logo } from '../../../components/Logo';
import { Signal, Tip, RinkSummary, Rink, RinkDetail } from '../../../lib/rinkTypes';
import { RINK_STREAMING, RINK_HOME_TEAMS, NearbyPlace } from '../../../lib/seedData';
import { getVerdictColor, getVerdictBg, timeAgo, ensureAllSignals, getRinkSlug, getNearbyPlaces } from '../../../lib/rinkHelpers';
import { SignalBar } from '../../../components/rink/SignalBar';
import { TipCard } from '../../../components/rink/TipCard';
import { NearbySection } from '../../../components/rink/NearbySection';
import { RateAndContribute } from '../../../components/rink/ContributeFlow';
import { ClaimRinkCTA } from '../../../components/rink/ClaimRinkCTA';
import { SaveRinkButton } from '../../../components/rink/SaveRinkButton';

// ── Main Page ──
export default function RinkPage() {
  const params = useParams();
  const router = useRouter();
  const rinkId = params.id as string;

  const [detail, setDetail] = useState<RinkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllTips, setShowAllTips] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showReturnPrompt, setShowReturnPrompt] = useState(false);
  const [signalFilter, setSignalFilter] = useState<'all' | 'tournament' | 'regular'>('all');

  // Seed data loaded from public files
  const [nearbyData, setNearbyData] = useState<Record<string, NearbyPlace[]> | null>(null);
  const [loadedSignals, setLoadedSignals] = useState<Record<string, { value: number; count: number; confidence: number }> | null>(null);

  // Sticky tab bar
  const [activeTab, setActiveTab] = useState('signals');

  // Auth state
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    try {
      const u = localStorage.getItem('coldstart_current_user');
      if (u) setCurrentUser(JSON.parse(u));
    } catch {}
  }, []);

  // Seed place tips for demo rinks (once)
  useEffect(() => {
    const seeded = localStorage.getItem('coldstart_place_tips_seeded');
    if (seeded) return;
    const seeds: Record<string, { text: string; author: string }[]> = {
      'coldstart_place_tips_bww_Applebee_s': [
        { text: "Can seat 30, call ahead and ask for the back room", author: "Mike B." },
      ],
      'coldstart_place_tips_bww_Tim_Hortons': [
        { text: "Drive-thru line is 15 min on Saturday mornings, go inside", author: "Sarah K." },
      ],
      'coldstart_place_tips_ice-line_Sal_s_Pizza': [
        { text: "Honors the 10% rink discount even for takeout orders", author: "Kevin M." },
      ],
      'coldstart_place_tips_ice-line_Hampton_Inn': [
        { text: "Has a small pool — good for siblings between games", author: "Sarah K." },
      ],
    };
    for (const [key, tips] of Object.entries(seeds)) {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(tips.map(t => ({ ...t, date: '2026-02-10T12:00:00Z' }))));
      }
    }
    localStorage.setItem('coldstart_place_tips_seeded', '1');
  }, []);

  // Track rink views for post-visit prompt
  useEffect(() => {
    if (!rinkId) return;
    try {
      const key = `coldstart_viewed_${rinkId}`;
      const prev = localStorage.getItem(key);
      if (prev) {
        // They've seen this rink page before — show return prompt
        const prevDate = new Date(prev);
        const hoursSince = (Date.now() - prevDate.getTime()) / (1000 * 60 * 60);
        if (hoursSince > 2) { // Only show if >2 hours since last view (they probably went to the rink)
          setShowReturnPrompt(true);
        }
      }
      localStorage.setItem(key, new Date().toISOString());
    } catch {}
  }, [rinkId]);

  // Load nearby + signal seed data when rink detail is available
  useEffect(() => {
    if (!detail) return;
    const slug = getRinkSlug(detail.rink);
    if (!slug) return;
    fetch(`/data/nearby/${slug}.json`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setNearbyData(data); })
      .catch(() => {});
    fetch('/data/signals.json')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && data[slug]) setLoadedSignals(data[slug]); })
      .catch(() => {});
  }, [detail]);

  useEffect(() => {
    async function load() {
      // Try backend first
      try {
        const res = await fetch(`${API_URL}/rinks/${rinkId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Failed to load');
        setDetail(data.data);
        setLoading(false);
        return;
      } catch {}

      // Fall back to seed data
      try {
        const [rinksRes, signalsRes] = await Promise.all([
          fetch('/data/rinks.json'),
          fetch('/data/signals.json'),
        ]);
        if (!rinksRes.ok) throw new Error('No seed data');
        const rinks = await rinksRes.json();
        const seedRink = rinks.find((r: any) => r.id === rinkId);
        if (!seedRink) throw new Error('Rink not found');

        const signals = signalsRes.ok ? await signalsRes.json() : {};
        const seedSignals = signals[rinkId] || {};
        const signalArray: Signal[] = Object.entries(seedSignals).map(([key, val]: [string, any]) => ({
          signal: key,
          value: val.value,
          confidence: val.confidence,
          count: val.count,
        }));

        setDetail({
          rink: {
            id: seedRink.id,
            name: seedRink.name,
            address: seedRink.address || '',
            city: seedRink.city || '',
            state: seedRink.state || '',
            latitude: seedRink.latitude || null,
            longitude: seedRink.longitude || null,
            created_at: new Date().toISOString(),
          },
          summary: {
            rink_id: seedRink.id,
            verdict: '',
            signals: signalArray,
            tips: [],
            evidence_counts: {},
            contribution_count: signalArray.reduce((sum: number, s: Signal) => sum + s.count, 0),
            last_updated_at: null,
            confirmed_this_season: false,
          },
        });
      } catch (e: any) {
        setError(e.message || 'Failed to load rink');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [rinkId]);

  // IntersectionObserver for sticky tab bar
  useEffect(() => {
    const sectionIds = ['signals-section', 'tips-section', 'nearby-section', 'contribute-section'];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id.replace('-section', ''));
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [detail]);

  function handleSummaryUpdate(summary: RinkSummary) {
    if (detail) {
      setDetail({ ...detail, summary });
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#fafbfc',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>Loading rink...</div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{
        minHeight: '100vh', background: '#fafbfc',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <nav style={{
          display: 'flex', alignItems: 'center', padding: '14px 24px',
          background: 'rgba(250,251,252,0.85)', backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #f1f5f9',
        }}>
          <Logo size={36} />
        </nav>
        <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏒</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Rink not found</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>{error || "This rink doesn't exist or has been removed."}</p>
          <button
            onClick={() => router.push('/')}
            style={{
              marginTop: 24, fontSize: 14, fontWeight: 600, color: '#fff',
              background: '#111827', borderRadius: 10, padding: '12px 28px',
              border: 'none', cursor: 'pointer',
            }}
          >
            ← Back to search
          </button>
        </div>
      </div>
    );
  }

  const { rink, summary } = detail;
  const hasData = summary.contribution_count > 0;
  const displayTips = showAllTips ? summary.tips : summary.tips.slice(0, 3);

  return (
    <div style={{
      minHeight: '100vh', background: '#fafbfc',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* ── Nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
        background: 'rgba(250,251,252,0.85)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #f1f5f9',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/')}
            style={{
              fontSize: 13, fontWeight: 500, color: '#374151',
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            ← Back
          </button>
          <Logo size={36} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => {
              const url = window.location.href;
              const parking = summary.signals.find(s => s.signal === 'parking');
              const parkingNote = parking ? ` (Parking: ${parking.value.toFixed(1)}/5)` : '';
              const topTip = summary.tips.length > 0 ? `\n💡 "${summary.tips[0].text}"` : '';
              const text = `${rink.name}${parkingNote} — ${summary.verdict}\n${topTip}\nRink info from hockey parents: ${url}`;
              if (navigator.share) {
                navigator.share({ title: `${rink.name} — ColdStart Hockey`, text, url }).catch(() => {});
              } else {
                navigator.clipboard.writeText(text).then(() => {
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                }).catch(() => {});
              }
            }}
            style={{
              fontSize: 12, fontWeight: 500,
              color: shareCopied ? '#059669' : '#0ea5e9',
              background: shareCopied ? '#ecfdf5' : '#f0f9ff',
              border: `1px solid ${shareCopied ? '#a7f3d0' : '#bae6fd'}`,
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            {shareCopied ? '✓ Copied!' : '📤 Share with team'}
          </button>
          {currentUser ? (
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {(currentUser.name || currentUser.email).slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                fontSize: 12, fontWeight: 600, color: '#fff',
                background: '#111827', border: 'none',
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Sign in
            </button>
          )}
        </div>
      </nav>

      {/* ── Sticky Tab Bar ── */}
      <div style={{
        position: 'sticky', top: 57, zIndex: 40,
        background: 'rgba(250,251,252,0.92)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', justifyContent: 'center', gap: 0,
        padding: '0 24px',
      }}>
        {[
          { key: 'signals', label: 'Signals' },
          { key: 'tips', label: 'Tips' },
          { key: 'nearby', label: 'Nearby' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              const el = document.getElementById(`${tab.key}-section`);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              padding: '10px 16px', fontSize: 13,
              fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? '#0ea5e9' : '#6b7280',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '2px solid #0ea5e9' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>

        {/* ── Rink hero image ── */}
        {getRinkSlug(rink) === 'ice-line' && (
          <div style={{
            marginTop: 16, borderRadius: 16, overflow: 'hidden',
            height: 220, position: 'relative',
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
            <div style={{
              position: 'absolute', bottom: 10, right: 10,
              fontSize: 10, color: 'rgba(255,255,255,0.7)',
              background: 'rgba(0,0,0,0.4)', padding: '3px 8px',
              borderRadius: 6, backdropFilter: 'blur(4px)',
            }}>
              📷 Photo from a hockey parent
            </div>
          </div>
        )}

        {/* ── Rink header ── */}
        <section style={{ paddingTop: 40, paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(24px, 5vw, 36px)',
                fontWeight: 700, color: '#111827',
                lineHeight: 1.15, letterSpacing: -0.5, margin: 0,
              }}>
                {rink.name}
              </h1>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6, lineHeight: 1.4 }}>
                {rink.address}, {rink.city}, {rink.state}
              </p>
              {/* Streaming badge */}
              {(() => {
                const streaming = RINK_STREAMING[getRinkSlug(rink)];
                if (!streaming || streaming.type === 'none') return null;
                const isLiveBarn = streaming.type === 'livebarn';
                return (
                  <a
                    href={streaming.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      marginTop: 8, padding: '5px 12px', borderRadius: 8,
                      background: isLiveBarn ? '#fff7ed' : '#f0f9ff',
                      border: `1px solid ${isLiveBarn ? '#fed7aa' : '#bae6fd'}`,
                      fontSize: 12, fontWeight: 600,
                      color: isLiveBarn ? '#c2410c' : '#0369a1',
                      textDecoration: 'none', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isLiveBarn ? '📹 LiveBarn' : '🐻 BlackBear TV'}
                    <span style={{ fontSize: 10, opacity: 0.7 }}>Watch live →</span>
                  </a>
                );
              })()}
              {/* Home teams */}
              {(() => {
                const teams = RINK_HOME_TEAMS[getRinkSlug(rink)];
                if (!teams || teams.length === 0) return null;
                return (
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                    🏠 Home of <span style={{ fontWeight: 600, color: '#374151' }}>{teams.join(', ')}</span>
                  </div>
                );
              })()}
              <span
                onClick={() => {
                  const el = document.getElementById('claim-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ fontSize: 13, color: '#3b82f6', cursor: 'pointer', marginTop: 4, display: 'inline-block' }}
              >
                Manage this rink? Claim your profile →
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
              <SaveRinkButton rinkId={rinkId} isLoggedIn={!!currentUser} onAuthRequired={() => setShowAuthModal(true)} />
              <button
                onClick={() => router.push(`/compare?rinks=${rinkId}`)}
                style={{
                  fontSize: 12, fontWeight: 600,
                  color: '#6b7280', background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                ⚖️ Compare rinks
              </button>
              <button
                onClick={() => router.push(`/trip/new?rink=${rinkId}`)}
                style={{
                  fontSize: 12, fontWeight: 600,
                  color: '#6b7280', background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                📋 Plan a trip
              </button>
            </div>
          </div>
        </section>

        {/* ── Verdict card ── */}
        <section style={{
          background: getVerdictBg(summary.verdict),
          border: `1px solid ${getVerdictColor(summary.verdict)}22`,
          borderRadius: 16, padding: '20px 24px', marginTop: 20,
        }}>
          <div>
            <p style={{
              fontSize: 18, fontWeight: 700,
              color: getVerdictColor(summary.verdict),
              margin: 0, lineHeight: 1.3,
            }}>
              {summary.verdict}
            </p>
            {hasData && (
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                {(() => {
                  const allSigs = ensureAllSignals(summary.signals, getRinkSlug(rink), loadedSignals);
                  const aboveAvg = allSigs.filter(s => s.value >= 3.0).length;
                  const total = allSigs.length;
                  return `${aboveAvg} of ${total} signals above average · `;
                })()}
                From {summary.contribution_count} hockey parent{summary.contribution_count !== 1 ? 's' : ''} this season
                {summary.last_updated_at && ` · Updated ${timeAgo(summary.last_updated_at)}`}
              </p>
            )}
          </div>

        </section>

        {/* ── Rate & Contribute — collapsed by default ── */}
        <div id="contribute-section">
          <RateAndContribute rinkId={rinkId} rinkName={rink.name} onSummaryUpdate={handleSummaryUpdate} isLoggedIn={!!currentUser} onAuthRequired={() => setShowAuthModal(true)} />
        </div>

        {/* ── Signals ── */}
        {summary.signals.length > 0 && (
          <section id="signals-section" style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 16, marginTop: 16, overflow: 'hidden',
          }}>
            {/* Filter toggle */}
            <div style={{
              padding: '10px 24px', background: '#fafbfc', borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Signals</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {([['all', 'All'], ['tournament', '🏆 Tournament'], ['regular', '📅 Regular']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSignalFilter(key)}
                    style={{
                      fontSize: 11, fontWeight: signalFilter === key ? 600 : 400,
                      padding: '4px 10px', borderRadius: 6,
                      background: signalFilter === key ? '#111827' : 'transparent',
                      color: signalFilter === key ? '#fff' : '#9ca3af',
                      border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: '0 24px' }}>
              {/* Fixed order: arrival → inside → between games → detail */}
              {(() => {
                const allSignals = ensureAllSignals(summary.signals, getRinkSlug(rink), loadedSignals);
                const sorted = [...allSignals].sort((a, b) => {
                  const ai = SIGNAL_ORDER.indexOf(a.signal as SignalType);
                  const bi = SIGNAL_ORDER.indexOf(b.signal as SignalType);
                  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
                });
                return sorted.map((s, i) => (
                  <div key={s.signal}>
                    <SignalBar signal={s} rinkSlug={getRinkSlug(rink)} />
                    {i < sorted.length - 1 && (
                      <div style={{ height: 1, background: '#f1f5f9' }} />
                    )}
                  </div>
                ));
              })()}
            </div>
            {signalFilter !== 'all' && (
              <div style={{ padding: '8px 24px', background: signalFilter === 'tournament' ? '#fffbeb' : '#f0f9ff', borderTop: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>
                  {signalFilter === 'tournament'
                    ? '🏆 Showing tournament weekend ratings only. In production, this filters to ratings tagged as tournament.'
                    : '📅 Showing regular season ratings only. In production, this filters to ratings tagged as regular season.'}
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── No data state — direct contribution prompt ── */}
        {!hasData && (
          <section style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 16, padding: 32, marginTop: 16, textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏒</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Be the first to report</p>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6, lineHeight: 1.5 }}>
              No one has shared info about this rink yet.<br />How&apos;s parking? Is it cold? Drop a quick tip.
            </p>
            <button
              onClick={() => {
                const el = document.getElementById('contribute-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                marginTop: 16, fontSize: 14, fontWeight: 600, color: '#fff',
                background: '#111827', border: 'none', borderRadius: 10,
                padding: '12px 28px', cursor: 'pointer',
              }}
            >
              Share what you know →
            </button>
          </section>
        )}

        {/* ── Tips ── */}
        {summary.tips.length > 0 && (
          <section id="tips-section" style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{
                fontSize: 13, fontWeight: 600, color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: 1.5, margin: 0,
              }}>
                Things to know ({summary.tips.length})
              </h3>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>Sorted by most helpful</span>
            </div>
            {displayTips.map((tip, i) => (
              <TipCard key={i} tip={tip} tipIndex={i} rinkSlug={getRinkSlug(rink)} isLoggedIn={!!currentUser} onAuthRequired={() => setShowAuthModal(true)} />
            ))}
            {summary.tips.length > 3 && !showAllTips && (
              <button
                onClick={() => setShowAllTips(true)}
                style={{
                  fontSize: 13, color: '#0ea5e9', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '8px 0',
                  fontWeight: 500,
                }}
              >
                Show {summary.tips.length - 3} more tips →
              </button>
            )}
          </section>
        )}

        {/* ── Return visit prompt ── */}
        {showReturnPrompt && (
          <section style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%)',
            border: '1px solid #c7d2fe',
            borderRadius: 14, padding: '16px 20px', marginTop: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#4338ca', margin: 0 }}>
                Been to {rink.name}?
              </p>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                You looked this up before — how was it?
              </p>
            </div>
            <button onClick={() => setShowReturnPrompt(false)} style={{ fontSize: 14, color: '#c7d2fe', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
          </section>
        )}

        {/* ── Nearby (all sections wrapped for sticky tab) ── */}
        <div id="nearby-section">
          {/* ── Nearby Eats ── */}
          <NearbySection
            title="Places to eat"
            icon="🍽️"
            rinkSlug={getRinkSlug(rink)}
            categories={[
              { label: 'Quick bite', icon: '🥯', description: 'Diners, bagel shops, fast casual',
                places: getNearbyPlaces(rink, 'quick_bite', nearbyData) },
              { label: 'Good coffee', icon: '☕', description: 'Coffee shops nearby',
                places: getNearbyPlaces(rink, 'coffee', nearbyData) },
              { label: 'Team lunch', icon: '🍕', description: 'Casual chains and group-friendly spots',
                places: getNearbyPlaces(rink, 'team_lunch', nearbyData) },
              { label: 'Post-game dinner', icon: '🍝', description: 'Family sit-downs after the game',
                places: getNearbyPlaces(rink, 'dinner', nearbyData) },
            ]}
          />

          {/* ── Team Activities ── */}
          <NearbySection
            title="Team activities"
            icon="🎳"
            rinkSlug={getRinkSlug(rink)}
            categories={[
              { label: 'Bowling', icon: '🎳', description: 'Bowling alleys nearby',
                places: getNearbyPlaces(rink, 'bowling', nearbyData) },
              { label: 'Arcade', icon: '🕹️', description: 'Arcades and game centers',
                places: getNearbyPlaces(rink, 'arcade', nearbyData) },
              { label: 'Movies', icon: '🎬', description: 'Movie theaters nearby',
                places: getNearbyPlaces(rink, 'movies', nearbyData) },
              { label: 'Fun zone', icon: '🎢', description: 'Trampoline parks, laser tag, etc.',
                places: getNearbyPlaces(rink, 'fun', nearbyData) },
            ]}
          />

          {/* ── Where to Stay ── */}
          <NearbySection
            title="Where to stay"
            icon="🏨"
            rinkSlug={getRinkSlug(rink)}
            categories={[
              { label: 'Hotels nearby', icon: '🏨', description: 'Within 10 minutes of the rink',
                places: getNearbyPlaces(rink, 'hotels', nearbyData) },
            ]}
          />

          {/* ── Gas ── */}
          <NearbySection
            title="Gas stations"
            icon="⛽"
            rinkSlug={getRinkSlug(rink)}
            categories={[
              { label: 'Gas nearby', icon: '⛽', description: 'Fill up near the rink',
                places: getNearbyPlaces(rink, 'gas', nearbyData) },
            ]}
          />
        </div>

        {/* ── Claim This Rink ── */}
        <section id="claim-section" style={{ marginTop: 24 }}>
          <ClaimRinkCTA rinkId={rinkId} rinkName={rink.name} />
        </section>

        {/* ── Browse more in state ── */}
        <section style={{ marginTop: 24, paddingBottom: 60 }}>
          <div
            onClick={() => router.push(`/states/${rink.state}`)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px',
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
          >
            <span style={{ fontSize: 13, color: '#374151' }}>
              Browse all rinks in {rink.state} →
            </span>
          </div>
        </section>

      </div>

      {/* ── Footer ── */}
      <footer style={{
        maxWidth: 680, margin: '0 auto', padding: '28px 24px',
        borderTop: '1px solid #f1f5f9',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          Built by hockey parents, for hockey parents.
        </span>
        <span style={{ fontSize: 11, color: '#d1d5db' }}>v0.3</span>
      </footer>

      {/* ── Auth Modal (inline — same as homepage) ── */}
      {showAuthModal && (() => {
        const AuthModalInline = () => {
          const [mode, setMode] = useState<'signin' | 'signup'>('signin');
          const [email, setEmail] = useState('');
          const [name, setName] = useState('');
          const [sending, setSending] = useState(false);
          const [sent, setSent] = useState(false);

          function handleSubmit() {
            if (!email.trim()) return;
            setSending(true);
            setTimeout(() => {
              const existing = JSON.parse(localStorage.getItem('coldstart_profiles') || '{}');
              let profile = existing[email.toLowerCase()];
              if (!profile) {
                if (mode === 'signin') { setSending(false); setMode('signup'); return; }
                profile = {
                  id: 'user_' + Math.random().toString(36).slice(2, 10),
                  email: email.toLowerCase(),
                  name: name.trim() || email.split('@')[0],
                  createdAt: new Date().toISOString(),
                  rinksRated: 0, tipsSubmitted: 0,
                };
                existing[email.toLowerCase()] = profile;
                localStorage.setItem('coldstart_profiles', JSON.stringify(existing));
              }
              localStorage.setItem('coldstart_current_user', JSON.stringify(profile));
              setSending(false); setSent(true);
              setTimeout(() => { setCurrentUser(profile); setShowAuthModal(false); }, 600);
            }, 800);
          }

          return (
            <div onClick={() => setShowAuthModal(false)} style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
              zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}>
              <div onClick={(e) => e.stopPropagation()} style={{
                background: '#fff', borderRadius: 20, maxWidth: 400, width: '100%',
                padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              }}>
                {sent ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>You&apos;re in!</p>
                  </div>
                ) : (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <Logo size={28} />
                      <p style={{ fontSize: 15, color: '#6b7280', marginTop: 8, margin: '8px 0 0' }}>
                        {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
                      </p>
                    </div>
                    {mode === 'signup' && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                          style={{ width: '100%', padding: '10px 14px', fontSize: 15, border: '1px solid #d1d5db', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    )}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder="your@email.com" autoFocus
                        style={{ width: '100%', padding: '10px 14px', fontSize: 15, border: '1px solid #d1d5db', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <button onClick={handleSubmit} disabled={sending || !email.trim()} style={{
                      width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 700,
                      background: sending ? '#93c5fd' : '#0ea5e9', color: '#fff',
                      border: 'none', borderRadius: 10, cursor: sending ? 'wait' : 'pointer',
                      opacity: !email.trim() ? 0.5 : 1,
                    }}>
                      {sending ? 'Signing in...' : mode === 'signin' ? 'Sign in' : 'Create account'}
                    </button>
                    <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
                      {mode === 'signin' ? (
                        <>Don&apos;t have an account?{' '}
                          <span onClick={() => setMode('signup')} style={{ color: '#0ea5e9', cursor: 'pointer', fontWeight: 600 }}>Sign up</span>
                        </>
                      ) : (
                        <>Already have an account?{' '}
                          <span onClick={() => setMode('signin')} style={{ color: '#0ea5e9', cursor: 'pointer', fontWeight: 600 }}>Sign in</span>
                        </>
                      )}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        };
        return <AuthModalInline />;
      })()}
    </div>
  );
}
