'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { PageShell } from '../../../components/PageShell';
import { RinkSummary, RinkDetail } from '../../../lib/rinkTypes';
import { NearbyPlace } from '../../../lib/seedData';
import { getRinkSlug, getNearbyPlaces, buildRinkDetailFromSeed } from '../../../lib/rinkHelpers';
import { NearbySection } from '../../../components/rink/NearbySection';
import { RateAndContribute } from '../../../components/rink/ContributeFlow';
import { ClaimRinkCTA } from '../../../components/rink/ClaimRinkCTA';
import { RinkHeader } from '../../../components/rink/RinkHeader';
import { VerdictCard } from '../../../components/rink/VerdictCard';
import { SignalsSection } from '../../../components/rink/SignalsSection';
import { TipsSection } from '../../../components/rink/TipsSection';
import { apiGet, seedGet } from '../../../lib/api';
import { storage } from '../../../lib/storage';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { useAuth } from '../../../contexts/AuthContext';
import { colors } from '../../../lib/theme';

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

  // Track rink views for post-visit prompt
  useEffect(() => {
    if (!rinkId) return;
    const prev = storage.getRinkViewed(rinkId);
    if (prev) {
      const prevDate = new Date(prev);
      const hoursSince = (Date.now() - prevDate.getTime()) / (1000 * 60 * 60);
      if (hoursSince > 2) setShowReturnPrompt(true);
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
      const { data } = await apiGet<RinkDetail>(`/rinks/${rinkId}`, {
        seedPath: '/data/rinks.json',
        transform: () => null as unknown as RinkDetail,
      });
      if (data) { setDetail(data); setLoading(false); return; }
      try {
        const [rinks, signals] = await Promise.all([
          seedGet<unknown[]>('/data/rinks.json'),
          seedGet<Record<string, unknown>>('/data/signals.json'),
        ]);
        if (!rinks) throw new Error('No seed data');
        const built = buildRinkDetailFromSeed(rinkId, rinks, signals);
        if (built) setDetail(built);
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
      position: 'sticky', top: 57, zIndex: 40,
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
    <PageShell back="/" navRight={<>{shareButton}{authSlot}</>} navBelow={tabBar}>
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

        <RinkHeader rink={rink} rinkId={rinkId} verdict={summary.verdict} />

        <VerdictCard rink={rink} summary={summary} loadedSignals={loadedSignals} />

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

        {/* Return visit prompt */}
        {showReturnPrompt && (
          <section style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%)',
            border: '1px solid #c7d2fe', borderRadius: 14, padding: '16px 20px', marginTop: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#4338ca', margin: 0 }}>Been to {rink.name}?</p>
              <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>You looked this up before — how was it?</p>
            </div>
            <button onClick={() => setShowReturnPrompt(false)} aria-label="Dismiss prompt" style={{ fontSize: 14, color: '#c7d2fe', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
          </section>
        )}

        {/* Nearby sections */}
        <div id="nearby-section">
          <NearbySection title="Places to eat" icon="🍽️" rinkSlug={getRinkSlug(rink)} categories={[
            { label: 'Quick bite', icon: '🥯', description: 'Diners, bagel shops, fast casual', places: getNearbyPlaces(rink, 'quick_bite', nearbyData) },
            { label: 'Good coffee', icon: '☕', description: 'Coffee shops nearby', places: getNearbyPlaces(rink, 'coffee', nearbyData) },
            { label: 'Team lunch', icon: '🍕', description: 'Casual chains and group-friendly spots', places: getNearbyPlaces(rink, 'team_lunch', nearbyData) },
            { label: 'Post-game dinner', icon: '🍝', description: 'Family sit-downs after the game', places: getNearbyPlaces(rink, 'dinner', nearbyData) },
          ]} />
          <NearbySection title="Team activities" icon="🎳" rinkSlug={getRinkSlug(rink)} categories={[
            { label: 'Bowling', icon: '🎳', description: 'Bowling alleys nearby', places: getNearbyPlaces(rink, 'bowling', nearbyData) },
            { label: 'Arcade', icon: '🕹️', description: 'Arcades and game centers', places: getNearbyPlaces(rink, 'arcade', nearbyData) },
            { label: 'Movies', icon: '🎬', description: 'Movie theaters nearby', places: getNearbyPlaces(rink, 'movies', nearbyData) },
            { label: 'Fun zone', icon: '🎢', description: 'Trampoline parks, laser tag, etc.', places: getNearbyPlaces(rink, 'fun', nearbyData) },
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
