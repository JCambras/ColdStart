'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { PageShell } from '../../../components/PageShell';
import { RinkSummary, RinkDetail } from '../../../lib/rinkTypes';
import { NearbyPlace, SEEDED_FAN_FAVORITES, RINK_STREAMING } from '../../../lib/seedData';
import { getRinkSlug, getNearbyPlaces, buildRinkDetailFromSeed, getVerdictColor, getVerdictBg, timeAgo, ensureAllSignals, getBarColor } from '../../../lib/rinkHelpers';
import { SIGNAL_META, API_URL } from '../../../lib/constants';
import { NearbySection } from '../../../components/rink/NearbySection';
import { RateAndContribute } from '../../../components/rink/ContributeFlow';
import { ClaimRinkCTA } from '../../../components/rink/ClaimRinkCTA';
import { SaveRinkButton } from '../../../components/rink/SaveRinkButton';
import { SignalsSection } from '../../../components/rink/SignalsSection';
import { TipsSection } from '../../../components/rink/TipsSection';
import { apiGet, seedGet } from '../../../lib/api';
import { storage } from '../../../lib/storage';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { useAuth } from '../../../contexts/AuthContext';
import { colors } from '../../../lib/theme';
import type { Signal } from '../../../lib/rinkTypes';

// ── Post-Visit Rating Prompt — single-signal-at-a-time ──
function ReturnRatingPrompt({
  rinkId,
  rinkName,
  onDismiss,
  onSummaryUpdate
}: {
  rinkId: string;
  rinkName: string;
  onDismiss: () => void;
  onSummaryUpdate: (s: RinkSummary) => void;
}) {
  const PROMPT_SIGNALS = [
    { key: 'parking', icon: '🅿️', question: 'How was parking?', low: 'Tough', high: 'Easy' },
    { key: 'cold', icon: '❄️', question: 'How cold was it?', low: 'Warm', high: 'Freezing' },
    { key: 'food_nearby', icon: '🍔', question: 'Food options nearby?', low: 'None', high: 'Plenty' },
    { key: 'chaos', icon: '🌀', question: 'How chaotic was it?', low: 'Calm', high: 'Wild' },
    { key: 'family_friendly', icon: '👨‍👩‍👧', question: 'Family friendly?', low: 'Not great', high: 'Great' },
    { key: 'locker_rooms', icon: '🚪', question: 'Locker rooms?', low: 'Tight', high: 'Spacious' },
    { key: 'pro_shop', icon: '🏒', question: 'Pro shop?', low: 'None', high: 'Stocked' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [rated, setRated] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [tipMode, setTipMode] = useState(false);
  const [tipText, setTipText] = useState('');

  const current = PROMPT_SIGNALS[currentIndex];
  const totalRated = Object.keys(rated).length;

  async function submitRating(signal: string, value: number) {
    setRated(prev => ({ ...prev, [signal]: value }));
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rink_id: rinkId,
          kind: 'signal_rating',
          contributor_type: 'visiting_parent',
          signal_rating: { signal, value },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.summary) onSummaryUpdate(data.data.summary);
      }
    } catch {}

    setSubmitting(false);

    // Move to next signal or show done state
    if (currentIndex < PROMPT_SIGNALS.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    } else {
      setDone(true);
    }
  }

  async function submitTip() {
    if (!tipText.trim()) return;
    try {
      const res = await fetch(`${API_URL}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rink_id: rinkId,
          kind: 'tip',
          contributor_type: 'visiting_parent',
          tip: { text: tipText.trim() },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.summary) onSummaryUpdate(data.data.summary);
      }
    } catch {}
    setTipMode(false);
    setDone(true);
  }

  // Mark this rink as rated so prompt doesn't show again
  function handleFinish() {
    try {
      localStorage.setItem(`coldstart_rated_${rinkId}`, new Date().toISOString());
    } catch {}
    onDismiss();
  }

  if (done) {
    return (
      <section style={{
        background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
        border: '1px solid #a7f3d0',
        borderRadius: 14, padding: '18px 20px', marginTop: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#059669', margin: 0 }}>
              Thanks! You rated {totalRated} signal{totalRated !== 1 ? 's' : ''}.
            </p>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 3, margin: '3px 0 0' }}>
              The next family will see your intel.
            </p>
          </div>
          <button
            onClick={handleFinish}
            style={{
              fontSize: 12, fontWeight: 600, color: '#059669',
              background: '#fff', border: '1px solid #a7f3d0',
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </section>
    );
  }

  if (tipMode) {
    return (
      <section style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%)',
        border: '1px solid #c7d2fe',
        borderRadius: 14, padding: '18px 20px', marginTop: 16,
      }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#4338ca', margin: 0 }}>
          Drop a quick tip about {rinkName}
        </p>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 3, margin: '3px 0 0' }}>
          Parking hack, entrance tip, food recommendation — anything that helps the next family.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            value={tipText}
            onChange={(e) => setTipText(e.target.value)}
            placeholder="e.g. Use the side entrance for Rink C"
            onKeyDown={(e) => e.key === 'Enter' && submitTip()}
            autoFocus
            style={{
              flex: 1, fontSize: 14, padding: '10px 14px',
              border: '1px solid #d1d5db', borderRadius: 10,
              outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={submitTip}
            disabled={!tipText.trim()}
            style={{
              fontSize: 13, fontWeight: 600, color: '#fff',
              background: tipText.trim() ? '#4338ca' : '#c7d2fe',
              border: 'none', borderRadius: 10, padding: '10px 18px',
              cursor: tipText.trim() ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
            }}
          >
            Send
          </button>
        </div>
        <button
          onClick={() => { setTipMode(false); setDone(true); }}
          style={{
            fontSize: 11, color: '#9ca3af', background: 'none', border: 'none',
            cursor: 'pointer', marginTop: 8, padding: 0,
          }}
        >
          Skip →
        </button>
      </section>
    );
  }

  return (
    <section style={{
      background: 'linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%)',
      border: '1px solid #c7d2fe',
      borderRadius: 14, padding: '18px 20px', marginTop: 16,
    }}>
      {/* Header with progress and dismiss */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#4338ca', margin: 0 }}>
            {totalRated === 0 ? `Been to ${rinkName}?` : current.question}
          </p>
          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2, margin: '2px 0 0' }}>
            {totalRated === 0
              ? 'Quick rate — tap a number, help the next family.'
              : `${totalRated} of ${PROMPT_SIGNALS.length} · tap to rate or skip`
            }
          </p>
        </div>
        <button
          onClick={() => {
            if (totalRated > 0) { setDone(true); }
            else { handleFinish(); }
          }}
          style={{ fontSize: 14, color: '#c7d2fe', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '4px' }}
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#e0e7ff', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: '#4338ca',
          width: `${(currentIndex / PROMPT_SIGNALS.length) * 100}%`,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Current signal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 28 }}>{current.icon}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
            {current.question}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
            {current.low} ← 1 · · · 5 → {current.high}
          </div>
        </div>
      </div>

      {/* Rating buttons — 1 through 5 */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((val) => {
          const isRated = rated[current.key] === val;
          const color = val >= 4 ? '#059669' : val >= 3 ? '#d97706' : '#ef4444';
          const bg = val >= 4 ? '#ecfdf5' : val >= 3 ? '#fffbeb' : '#fef2f2';
          return (
            <button
              key={val}
              onClick={() => !submitting && submitRating(current.key, val)}
              disabled={submitting}
              style={{
                flex: 1, height: 48,
                fontSize: 18, fontWeight: 700,
                color: isRated ? '#fff' : color,
                background: isRated ? color : bg,
                border: `2px solid ${isRated ? color : 'transparent'}`,
                borderRadius: 10, cursor: submitting ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {val}
            </button>
          );
        })}
      </div>

      {/* Skip / add tip links */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <button
          onClick={() => {
            if (currentIndex < PROMPT_SIGNALS.length - 1) {
              setCurrentIndex(prev => prev + 1);
            } else {
              setTipMode(true);
            }
          }}
          style={{
            fontSize: 12, color: '#9ca3af', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0,
          }}
        >
          Skip this →
        </button>
        {totalRated > 0 && (
          <button
            onClick={() => setTipMode(true)}
            style={{
              fontSize: 12, color: '#4338ca', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, fontWeight: 600,
            }}
          >
            + Add a tip instead
          </button>
        )}
      </div>
    </section>
  );
}

export default function RinkPage() {
  const params = useParams();
  const router = useRouter();
  const rinkId = params.id as string;

  const [detail, setDetail] = useState<RinkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [showReturnPrompt, setShowReturnPrompt] = useState(false);
  const [signalFilter, setSignalFilter] = useState<'all' | 'tournament' | 'regular'>('all');

  const [nearbyData, setNearbyData] = useState<Record<string, NearbyPlace[]> | null>(null);
  const [loadedSignals, setLoadedSignals] = useState<Record<string, { value: number; count: number; confidence: number }> | null>(null);

  const [activeTab, setActiveTab] = useState('signals');

  const { currentUser, openAuth } = useAuth();

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

  // Seed fan favorites for demo rinks (once)
  useEffect(() => {
    if (storage.getFanFavsSeeded()) return;
    for (const [slug, favs] of Object.entries(SEEDED_FAN_FAVORITES)) {
      const existing = storage.getFanFavorites(slug);
      if (existing.length === 0) {
        storage.setFanFavorites(slug, favs);
      }
    }
    storage.setFanFavsSeeded('1');
  }, []);

  // Track rink views for post-visit prompt
  useEffect(() => {
    if (!rinkId) return;
    try {
      // Don't show if already rated this rink
      const alreadyRated = localStorage.getItem(`coldstart_rated_${rinkId}`);
      if (alreadyRated) return;

      // Show if: viewed before (>2 hours ago, <7 days ago) OR rink is saved
      const key = `coldstart_viewed_${rinkId}`;
      const prev = localStorage.getItem(key);
      const savedRinks = JSON.parse(localStorage.getItem('coldstart_my_rinks') || '[]');
      const isSaved = savedRinks.includes(rinkId);

      if (prev) {
        const prevDate = new Date(prev);
        const hoursSince = (Date.now() - prevDate.getTime()) / (1000 * 60 * 60);
        const daysSince = hoursSince / 24;
        if (hoursSince > 2 && daysSince < 7) {
          setShowReturnPrompt(true);
        }
      } else if (isSaved) {
        // Saved rink, first detail visit — they might have just been there
        setShowReturnPrompt(true);
      }

      localStorage.setItem(key, new Date().toISOString());
    } catch {}
  }, [rinkId]);

  // Load nearby + signal seed data when rink detail is available
  useEffect(() => {
    if (!detail) return;
    const slug = getRinkSlug(detail.rink);
    const id = detail.rink.id;
    // Find matching seed rink ID by name (handles API rinks with UUID ids)
    const findSeedId = async (): Promise<string | null> => {
      const rinks = await seedGet<Array<{ id: string; name: string }>>('/data/rinks.json');
      if (!rinks) return null;
      const nameNorm = detail.rink.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = rinks.find(r => r.name.toLowerCase().replace(/[^a-z0-9]/g, '') === nameNorm);
      return match?.id || null;
    };
    const tryNearby = async () => {
      // Try seed ID match first (most reliable for API rinks with UUID ids)
      const seedId = await findSeedId();
      if (seedId) {
        const bySeed = await seedGet<Record<string, NearbyPlace[]>>(`/data/nearby/${seedId}.json`);
        if (bySeed) { setNearbyData(bySeed); return; }
      }
      // Then try rink ID directly
      const byId = await seedGet<Record<string, NearbyPlace[]>>(`/data/nearby/${id}.json`);
      if (byId) { setNearbyData(byId); return; }
      // Finally try generated slug
      if (slug && slug !== id) {
        const bySlug = await seedGet<Record<string, NearbyPlace[]>>(`/data/nearby/${slug}.json`);
        if (bySlug) setNearbyData(bySlug);
      }
    };
    tryNearby();
    seedGet<Record<string, Record<string, { value: number; count: number; confidence: number }>>>('/data/signals.json')
      .then(async data => {
        if (!data) return;
        const seedId = await findSeedId();
        const match = (seedId ? data[seedId] : null) || data[id] || (slug ? data[slug] : null);
        if (match) setLoadedSignals(match);
      });
  }, [detail]);

  useEffect(() => {
    async function load() {
      const { data } = await apiGet<RinkDetail>(`/rinks/${rinkId}`, {
        seedPath: '/data/rinks.json',
        transform: () => null as unknown as RinkDetail,
      });
      if (data) {
        // If API didn't return home_teams, try loading from seed
        if (!data.home_teams || data.home_teams.length === 0) {
          const ht = await seedGet<Record<string, string[]>>('/data/home-teams.json');
          if (ht && ht[rinkId]) data.home_teams = ht[rinkId];
        }
        setDetail(data); setLoading(false); return;
      }
      try {
        const [rinks, signals, homeTeams] = await Promise.all([
          seedGet<unknown[]>('/data/rinks.json'),
          seedGet<Record<string, unknown>>('/data/signals.json'),
          seedGet<Record<string, string[]>>('/data/home-teams.json'),
        ]);
        if (!rinks) throw new Error('No seed data');
        const built = buildRinkDetailFromSeed(rinkId, rinks, signals);
        if (built) {
          if (homeTeams && homeTeams[rinkId]) built.home_teams = homeTeams[rinkId];
          setDetail(built);
        }
        else setError('Rink not found');
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
          if (entry.isIntersecting) setActiveTab(entry.target.id.replace('-section', ''));
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
    if (detail) setDetail({ ...detail, summary });
  }

  if (loading) {
    return <PageShell><LoadingSkeleton variant="page" /></PageShell>;
  }

  if (error || !detail) {
    return (
      <PageShell>
        <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏒</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Rink not found</h2>
          <p style={{ fontSize: 14, color: colors.textTertiary, marginTop: 8 }}>{error || "This rink doesn't exist or has been removed."}</p>
          <button onClick={() => router.push('/')} style={{ marginTop: 24, fontSize: 14, fontWeight: 600, color: colors.white, background: colors.textPrimary, borderRadius: 10, padding: '12px 28px', border: 'none', cursor: 'pointer' }}>
            ← Back to search
          </button>
        </div>
      </PageShell>
    );
  }

  const { rink, summary } = detail;
  const hasData = summary.contribution_count > 0;

  const shareButton = (
    <button
      aria-label="Share rink with team"
      onClick={() => {
        const url = window.location.href;
        const parking = summary.signals.find(s => s.signal === 'parking');
        const parkingNote = parking ? ` (Parking: ${parking.value.toFixed(1)}/5)` : '';
        const topTip = summary.tips.length > 0 ? `\n💡 "${summary.tips[0].text}"` : '';
        const shareText = `${rink.name}${parkingNote} — ${summary.verdict}\n${topTip}\nRink info from hockey parents: ${url}`;
        if (navigator.share) {
          navigator.share({ title: `${rink.name} — ColdStart Hockey`, text: shareText, url }).catch(() => {});
        } else {
          navigator.clipboard.writeText(shareText).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }).catch(() => {});
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
    <button onClick={openAuth} style={{ fontSize: 12, fontWeight: 600, color: colors.white, background: colors.textPrimary, border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      Sign in
    </button>
  );

  const tabBar = (
    <div role="tablist" aria-label="Rink sections" style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: 'rgba(250,251,252,0.92)', backdropFilter: 'blur(8px)',
      borderBottom: `1px solid ${colors.borderLight}`,
      display: 'flex', justifyContent: 'center', gap: 0, padding: '0 24px',
    }}>
      {[
        { key: 'signals', label: 'Signals' },
        { key: 'tips', label: 'Tips' },
        { key: 'nearby', label: 'Nearby' },
      ].map(tab => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
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
    <PageShell logoStacked navBelow={<>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '6px 24px 8px',
        background: 'rgba(250,251,252,0.92)',
        backdropFilter: 'blur(8px)',
      }}>
        {shareButton}
      </div>
      {tabBar}
    </>}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>

        {/* Rink hero image */}
        {getRinkSlug(rink) === 'ice-line' && (
          <div style={{ marginTop: 16, borderRadius: 16, overflow: 'hidden', height: 220, position: 'relative' }}>
            <Image
              src="/rink-photos/ice-line.jpeg"
              alt={rink.name}
              fill
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              sizes="(max-width: 680px) 100vw, 680px"
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

        {/* ── Rink header — Glance View (mobile-first) ── */}
        <section style={{ paddingTop: 24, paddingBottom: 0 }}>
          {/* Row 1: Name + Save button — always visible */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: 'clamp(22px, 5vw, 36px)',
                fontWeight: 700, color: '#111827',
                lineHeight: 1.15, letterSpacing: -0.5, margin: 0,
              }}>
                {rink.name}
              </h1>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4, lineHeight: 1.4, margin: '4px 0 0' }}>
                {rink.address}, {rink.city}, {rink.state}
              </p>
            </div>
            <div style={{ flexShrink: 0, paddingTop: 4 }}>
              <SaveRinkButton rinkId={rinkId} />
            </div>
          </div>

          {/* Verdict card — immediately after name */}
          {hasData && (
            <div style={{
              background: getVerdictBg(summary.verdict),
              border: `1px solid ${getVerdictColor(summary.verdict)}22`,
              borderRadius: 12, padding: '14px 18px', marginTop: 14,
            }}>
              <p style={{
                fontSize: 16, fontWeight: 700,
                color: getVerdictColor(summary.verdict),
                margin: 0, lineHeight: 1.3,
              }}>
                {summary.verdict}
              </p>
              <p style={{ fontSize: 11, color: '#6b7280', marginTop: 3, margin: '3px 0 0' }}>
                From {summary.contribution_count} hockey parent{summary.contribution_count !== 1 ? 's' : ''}
                {summary.last_updated_at && ` · Updated ${timeAgo(summary.last_updated_at)}`}
              </p>
            </div>
          )}


          {/* ── Secondary info — below the fold ── */}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                    padding: '5px 12px', borderRadius: 8,
                    background: isLiveBarn ? '#fff7ed' : '#f0f9ff',
                    border: `1px solid ${isLiveBarn ? '#fed7aa' : '#bae6fd'}`,
                    fontSize: 12, fontWeight: 600,
                    color: isLiveBarn ? '#c2410c' : '#0369a1',
                    textDecoration: 'none', cursor: 'pointer',
                    alignSelf: 'flex-start',
                  }}
                >
                  {isLiveBarn ? '📹 LiveBarn' : '🐻 BlackBear TV'}
                  <span style={{ fontSize: 10, opacity: 0.7 }}>Watch live →</span>
                </a>
              );
            })()}

            {/* Home teams */}
            {(() => {
              const teams = detail.home_teams;
              if (!teams || teams.length === 0) return null;
              return (
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  🏠 Home of <span style={{ fontWeight: 600, color: '#374151' }}>{teams.join(', ')}</span>
                </div>
              );
            })()}

            {/* Action buttons — horizontal row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <button
                onClick={() => router.push(`/compare?rinks=${rinkId}`)}
                style={{
                  fontSize: 12, fontWeight: 600,
                  color: '#6b7280', background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                ⚖️ Compare
              </button>
              <button
                onClick={() => router.push(`/trip/new?rink=${rinkId}`)}
                style={{
                  fontSize: 12, fontWeight: 600,
                  color: '#6b7280', background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                📋 Plan trip
              </button>
              <span
                onClick={() => {
                  const el = document.getElementById('claim-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{ fontSize: 11, color: '#3b82f6', cursor: 'pointer', padding: '6px 0', display: 'flex', alignItems: 'center' }}
              >
                Claim this rink →
              </span>
            </div>
          </div>
        </section>

        {/* ── Post-visit rating prompt ── */}
        {showReturnPrompt && (
          <ReturnRatingPrompt
            rinkId={rinkId}
            rinkName={rink.name}
            onDismiss={() => setShowReturnPrompt(false)}
            onSummaryUpdate={handleSummaryUpdate}
          />
        )}

        {/* Rate & Contribute */}
        <div id="contribute-section">
          <RateAndContribute rinkId={rinkId} rinkName={rink.name} onSummaryUpdate={handleSummaryUpdate} />
        </div>

        <SignalsSection
          rink={rink}
          summary={summary}
          loadedSignals={loadedSignals}
          signalFilter={signalFilter}
          onFilterChange={setSignalFilter}
        />

        {/* No data state */}
        {!hasData && (
          <section style={{ background: colors.white, border: `1px solid ${colors.borderDefault}`, borderRadius: 16, padding: 32, marginTop: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏒</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Be the first to report</p>
            <p style={{ fontSize: 14, color: colors.textTertiary, marginTop: 6, lineHeight: 1.5 }}>
              No one has shared info about this rink yet.<br />How&apos;s parking? Is it cold? Drop a quick tip.
            </p>
            <button
              onClick={() => { const el = document.getElementById('contribute-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ marginTop: 16, fontSize: 14, fontWeight: 600, color: colors.white, background: colors.textPrimary, border: 'none', borderRadius: 10, padding: '12px 28px', cursor: 'pointer' }}
            >
              Share what you know →
            </button>
          </section>
        )}

        <TipsSection tips={summary.tips} rinkSlug={getRinkSlug(rink)} />

        {/* Nearby sections */}
        <div id="nearby-section">
          <NearbySection title="Places to eat" icon="🍽️" rinkSlug={getRinkSlug(rink)} fanFavorites categories={[
            { label: 'Quick bite', icon: '🥯', description: 'Grab & go before the game — bagels, donuts, drive-throughs. Think Wawa run at 6am.', places: getNearbyPlaces(rink, 'quick_bite', nearbyData) },
            { label: 'Good coffee', icon: '☕', description: 'A real coffee while you wait for warmups. Not the vending machine in the lobby.', places: getNearbyPlaces(rink, 'coffee', nearbyData) },
            { label: 'Team lunch', icon: '🍕', description: 'Where you take 15 kids in hockey gear between games. Needs big tables and patience.', places: getNearbyPlaces(rink, 'team_lunch', nearbyData) },
            { label: 'Post-game dinner', icon: '🍝', description: 'Sit-down spot after the last game. Somewhere the parents can finally relax.', places: getNearbyPlaces(rink, 'dinner', nearbyData) },
          ]} />
          <NearbySection title="Team activities" icon="🎳" rinkSlug={getRinkSlug(rink)} categories={[
            { label: 'Bowling', icon: '🎳', description: 'Classic team bonding night. Book lanes ahead on tournament weekends.', places: getNearbyPlaces(rink, 'bowling', nearbyData) },
            { label: 'Arcade', icon: '🕹️', description: 'Burn off energy between games. Dave & Busters, Round1, local spots.', places: getNearbyPlaces(rink, 'arcade', nearbyData) },
            { label: 'Movies', icon: '🎬', description: 'Kill 2 hours between a 9am and 3pm game. Popcorn counts as a meal.', places: getNearbyPlaces(rink, 'movies', nearbyData) },
            { label: 'Fun zone', icon: '🎢', description: 'Trampoline parks, laser tag, go-karts — the stuff kids actually want to do.', places: getNearbyPlaces(rink, 'fun', nearbyData) },
          ]} />
          <NearbySection title="Where to stay" icon="🏨" rinkSlug={getRinkSlug(rink)} categories={[
            { label: 'Hotels nearby', icon: '🏨', description: 'Within 10 minutes of the rink', places: getNearbyPlaces(rink, 'hotels', nearbyData) },
          ]} />
          <NearbySection title="Gas stations" icon="⛽" rinkSlug={getRinkSlug(rink)} categories={[
            { label: 'Gas nearby', icon: '⛽', description: 'Fill up near the rink', places: getNearbyPlaces(rink, 'gas', nearbyData) },
          ]} />
        </div>

        <section id="claim-section" style={{ marginTop: 24 }}>
          <ClaimRinkCTA rinkId={rinkId} rinkName={rink.name} />
        </section>

        <section style={{ marginTop: 24, paddingBottom: 60 }}>
          <div
            onClick={() => router.push(`/states/${rink.state}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/states/${rink.state}`); } }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', background: colors.white, border: `1px solid ${colors.borderDefault}`, borderRadius: 12,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}
          >
            <span style={{ fontSize: 13, color: colors.textSecondary }}>Browse all rinks in {rink.state} →</span>
          </div>
        </section>
      </div>

      <footer style={{
        maxWidth: 680, margin: '0 auto', padding: '28px 24px',
        borderTop: `1px solid ${colors.borderLight}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: colors.textMuted }}>Built by hockey parents, for hockey parents.</span>
        <span style={{ fontSize: 11, color: colors.textDisabled }}>v0.3</span>
      </footer>
    </PageShell>
  );
}
