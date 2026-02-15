'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SIGNAL_ORDER, SignalType } from '../../../lib/constants';
import { PageShell } from '../../../components/PageShell';
import { Signal, Tip, RinkSummary, Rink, RinkDetail } from '../../../lib/rinkTypes';
import { RINK_STREAMING, RINK_HOME_TEAMS, NearbyPlace } from '../../../lib/seedData';
import { getVerdictColor, getVerdictBg, timeAgo, ensureAllSignals, getRinkSlug, getNearbyPlaces, buildRinkDetailFromSeed } from '../../../lib/rinkHelpers';
import { SignalBar } from '../../../components/rink/SignalBar';
import { TipCard } from '../../../components/rink/TipCard';
import { NearbySection } from '../../../components/rink/NearbySection';
import { RateAndContribute } from '../../../components/rink/ContributeFlow';
import { ClaimRinkCTA } from '../../../components/rink/ClaimRinkCTA';
import { SaveRinkButton } from '../../../components/rink/SaveRinkButton';
import { apiGet, seedGet } from '../../../lib/api';
import { storage } from '../../../lib/storage';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { useAuth } from '../../../contexts/AuthContext';
import { colors, text, radius } from '../../../lib/theme';

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

  // Auth
  const { currentUser, isLoggedIn, openAuth } = useAuth();

  // Seed place tips for demo rinks (once)
  useEffect(() => {
    if (storage.getPlaceTipsSeeded()) return;
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
      const existing = storage.getPlaceTips(
        key.replace('coldstart_place_tips_', '').split('_')[0],
        key.replace(/coldstart_place_tips_[^_]+_/, '')
      );
      if (existing.length === 0) {
        const slug = key.replace('coldstart_place_tips_', '').split('_')[0];
        const place = key.replace(/coldstart_place_tips_[^_]+_/, '');
        storage.setPlaceTips(slug, place, tips.map(t => ({ ...t, date: '2026-02-10T12:00:00Z' })));
      }
    }
    storage.setPlaceTipsSeeded('1');
  }, []);

  // Track rink views for post-visit prompt
  useEffect(() => {
    if (!rinkId) return;
    const prev = storage.getRinkViewed(rinkId);
    if (prev) {
      const prevDate = new Date(prev);
      const hoursSince = (Date.now() - prevDate.getTime()) / (1000 * 60 * 60);
      if (hoursSince > 2) {
        setShowReturnPrompt(true);
      }
    }
    storage.setRinkViewed(rinkId, new Date().toISOString());
  }, [rinkId]);

  // Load nearby + signal seed data when rink detail is available
  useEffect(() => {
    if (!detail) return;
    const slug = getRinkSlug(detail.rink);
    if (!slug) return;
    seedGet<Record<string, NearbyPlace[]>>(`/data/nearby/${slug}.json`)
      .then(data => { if (data) setNearbyData(data); });
    seedGet<Record<string, Record<string, { value: number; count: number; confidence: number }>>>('/data/signals.json')
      .then(data => { if (data && data[slug]) setLoadedSignals(data[slug]); });
  }, [detail]);

  useEffect(() => {
    async function load() {
      const { data, error: apiError } = await apiGet<RinkDetail>(`/rinks/${rinkId}`, {
        seedPath: '/data/rinks.json',
        transform: (rinks) => {
          // Need signals too for the seed fallback
          return null as unknown as RinkDetail; // handled below
        },
      });

      if (data) {
        setDetail(data);
        setLoading(false);
        return;
      }

      // Seed data fallback: load both rinks + signals
      try {
        const [rinks, signals] = await Promise.all([
          seedGet<unknown[]>('/data/rinks.json'),
          seedGet<Record<string, unknown>>('/data/signals.json'),
        ]);
        if (!rinks) throw new Error('No seed data');
        const built = buildRinkDetailFromSeed(rinkId, rinks, signals);
        if (built) {
          setDetail(built);
        } else {
          setError('Rink not found');
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load rink');
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
      <PageShell>
        <LoadingSkeleton variant="page" />
      </PageShell>
    );
  }

  if (error || !detail) {
    return (
      <PageShell>
        <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏒</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Rink not found</h2>
          <p style={{ fontSize: 14, color: colors.textTertiary, marginTop: 8 }}>{error || "This rink doesn't exist or has been removed."}</p>
          <button
            onClick={() => router.push('/')}
            style={{
              marginTop: 24, fontSize: 14, fontWeight: 600, color: colors.white,
              background: colors.textPrimary, borderRadius: 10, padding: '12px 28px',
              border: 'none', cursor: 'pointer',
            }}
          >
            ← Back to search
          </button>
        </div>
      </PageShell>
    );
  }

  const { rink, summary } = detail;
  const hasData = summary.contribution_count > 0;
  const displayTips = showAllTips ? summary.tips : summary.tips.slice(0, 3);

  const shareButton = (
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
        color: shareCopied ? '#059669' : colors.brand,
        background: shareCopied ? '#ecfdf5' : colors.bgInfo,
        border: `1px solid ${shareCopied ? '#a7f3d0' : colors.brandLight}`,
        borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
        transition: 'all 0.2s', whiteSpace: 'nowrap',
      }}
    >
      {shareCopied ? '✓ Copied!' : '📤 Share with team'}
    </button>
  );

  const authSlot = currentUser ? (
    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      background: `linear-gradient(135deg, ${colors.brand}, ${colors.brandAccent})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: colors.white, fontSize: 11, fontWeight: 700, flexShrink: 0,
    }}>
      {(currentUser.name || currentUser.email).slice(0, 2).toUpperCase()}
    </div>
  ) : (
    <button
      onClick={openAuth}
      style={{
        fontSize: 12, fontWeight: 600, color: colors.white,
        background: colors.textPrimary, border: 'none',
        borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      Sign in
    </button>
  );

  const tabBar = (
    <div style={{
      position: 'sticky', top: 57, zIndex: 40,
      background: 'rgba(250,251,252,0.92)', backdropFilter: 'blur(8px)',
      borderBottom: `1px solid ${colors.borderLight}`,
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
            color: activeTab === tab.key ? colors.brand : colors.textTertiary,
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === tab.key ? `2px solid ${colors.brand}` : '2px solid transparent',
            transition: 'all 0.15s',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <PageShell back="/" navRight={<>{shareButton}{authSlot}</>} navBelow={tabBar}>
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
                fontWeight: 700, color: colors.textPrimary,
                lineHeight: 1.15, letterSpacing: -0.5, margin: 0,
              }}>
                {rink.name}
              </h1>
              <p style={{ fontSize: 14, color: colors.textTertiary, marginTop: 6, lineHeight: 1.4 }}>
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
                      background: isLiveBarn ? '#fff7ed' : colors.bgInfo,
                      border: `1px solid ${isLiveBarn ? colors.amberBorder : colors.brandLight}`,
                      fontSize: 12, fontWeight: 600,
                      color: isLiveBarn ? '#c2410c' : colors.brandDark,
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
                  <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 6 }}>
                    🏠 Home of <span style={{ fontWeight: 600, color: colors.textSecondary }}>{teams.join(', ')}</span>
                  </div>
                );
              })()}
              <span
                onClick={() => {
                  const el = document.getElementById('claim-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ fontSize: 13, color: colors.brandAccent, cursor: 'pointer', marginTop: 4, display: 'inline-block' }}
              >
                Manage this rink? Claim your profile →
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
              <SaveRinkButton rinkId={rinkId} />
              <button
                onClick={() => router.push(`/compare?rinks=${rinkId}`)}
                style={{
                  fontSize: 12, fontWeight: 600,
                  color: colors.textTertiary, background: colors.bgSubtle,
                  border: `1px solid ${colors.borderDefault}`,
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
                  color: colors.textTertiary, background: colors.bgSubtle,
                  border: `1px solid ${colors.borderDefault}`,
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
              <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }}>
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
          <RateAndContribute rinkId={rinkId} rinkName={rink.name} onSummaryUpdate={handleSummaryUpdate} />
        </div>

        {/* ── Signals ── */}
        {summary.signals.length > 0 && (
          <section id="signals-section" style={{
            background: colors.white, border: `1px solid ${colors.borderDefault}`,
            borderRadius: 16, marginTop: 16, overflow: 'hidden',
          }}>
            {/* Filter toggle */}
            <div style={{
              padding: '10px 24px', background: colors.bgPage, borderBottom: `1px solid ${colors.borderLight}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Signals</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {([['all', 'All'], ['tournament', '🏆 Tournament'], ['regular', '📅 Regular']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSignalFilter(key)}
                    style={{
                      fontSize: 11, fontWeight: signalFilter === key ? 600 : 400,
                      padding: '4px 10px', borderRadius: 6,
                      background: signalFilter === key ? colors.textPrimary : 'transparent',
                      color: signalFilter === key ? colors.white : colors.textMuted,
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
                      <div style={{ height: 1, background: colors.borderLight }} />
                    )}
                  </div>
                ));
              })()}
            </div>
            {signalFilter !== 'all' && (
              <div style={{ padding: '8px 24px', background: signalFilter === 'tournament' ? colors.bgWarning : colors.bgInfo, borderTop: `1px solid ${colors.borderLight}` }}>
                <p style={{ fontSize: 11, color: colors.textTertiary, margin: 0 }}>
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
            background: colors.white, border: `1px solid ${colors.borderDefault}`,
            borderRadius: 16, padding: 32, marginTop: 16, textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏒</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Be the first to report</p>
            <p style={{ fontSize: 14, color: colors.textTertiary, marginTop: 6, lineHeight: 1.5 }}>
              No one has shared info about this rink yet.<br />How&apos;s parking? Is it cold? Drop a quick tip.
            </p>
            <button
              onClick={() => {
                const el = document.getElementById('contribute-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                marginTop: 16, fontSize: 14, fontWeight: 600, color: colors.white,
                background: colors.textPrimary, border: 'none', borderRadius: 10,
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
                fontSize: 13, fontWeight: 600, color: colors.textMuted,
                textTransform: 'uppercase', letterSpacing: 1.5, margin: 0,
              }}>
                Things to know ({summary.tips.length})
              </h3>
              <span style={{ fontSize: 11, color: colors.textMuted }}>Sorted by most helpful</span>
            </div>
            {displayTips.map((tip, i) => (
              <TipCard key={i} tip={tip} tipIndex={i} rinkSlug={getRinkSlug(rink)} />
            ))}
            {summary.tips.length > 3 && !showAllTips && (
              <button
                onClick={() => setShowAllTips(true)}
                style={{
                  fontSize: 13, color: colors.brand, background: 'none',
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
              <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>
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
              background: colors.white, border: `1px solid ${colors.borderDefault}`, borderRadius: 12,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}
          >
            <span style={{ fontSize: 13, color: colors.textSecondary }}>
              Browse all rinks in {rink.state} →
            </span>
          </div>
        </section>

      </div>

      {/* ── Footer ── */}
      <footer style={{
        maxWidth: 680, margin: '0 auto', padding: '28px 24px',
        borderTop: `1px solid ${colors.borderLight}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: colors.textMuted }}>
          Built by hockey parents, for hockey parents.
        </span>
        <span style={{ fontSize: 11, color: colors.textDisabled }}>v0.3</span>
      </footer>

    </PageShell>
  );
}
