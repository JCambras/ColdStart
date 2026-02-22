'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PageShell } from '../../../components/PageShell';
import { RinkSummary, RinkDetail } from '../../../lib/rinkTypes';
import { NearbyPlace, SEEDED_FAN_FAVORITES, RINK_STREAMING } from '../../../lib/seedData';
import { getRinkSlug, getRinkPhoto, getNearbyPlaces, buildRinkDetailFromSeed } from '../../../lib/rinkHelpers';
import { NearbySection } from '../../../components/rink/NearbySection';
import { RateAndContribute } from '../../../components/rink/ContributeFlow';
import { ClaimRinkCTA } from '../../../components/rink/ClaimRinkCTA';
import { SaveRinkButton } from '../../../components/rink/SaveRinkButton';
import { SignalsSection } from '../../../components/rink/SignalsSection';
import { TipsSection } from '../../../components/rink/TipsSection';
import { VerdictCard } from '../../../components/rink/VerdictCard';
import { ReturnRatingPrompt } from '../../../components/rink/ReturnRatingPrompt';
import { PhotoGallery } from '../../../components/rink/PhotoGallery';
import { apiGet, seedGet } from '../../../lib/api';
import { storage } from '../../../lib/storage';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { useAuth } from '../../../contexts/AuthContext';
import { colors, text } from '../../../lib/theme';

export default function RinkPage() {
  const params = useParams();
  const router = useRouter();
  const rinkId = params.id as string;

  const [detail, setDetail] = useState<RinkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [showReturnPrompt, setShowReturnPrompt] = useState(false);

  const [nearbyData, setNearbyData] = useState<Record<string, NearbyPlace[]> | null>(null);
  const [loadedSignals, setLoadedSignals] = useState<Record<string, { value: number; count: number; confidence: number }> | null>(null);

  const [activeTab, setActiveTab] = useState('signals');
  const [referralSource, setReferralSource] = useState<string | null>(null);
  const [rinkPhotos, setRinkPhotos] = useState<{ id: number; url: string; caption?: string; contributor_name?: string }[]>([]);

  const searchParams = useSearchParams();
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

  // Detect referral source
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralSource(ref);
      fetch('/api/v1/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rink_id: rinkId, source: ref }),
      }).catch(() => {});
      try { sessionStorage.setItem('coldstart_ref', ref); } catch {}
    }
  }, [searchParams, rinkId]);

  // Track rink views for post-visit prompt
  useEffect(() => {
    if (!rinkId) return;
    try {
      const alreadyRated = localStorage.getItem(`coldstart_rated_${rinkId}`);
      if (alreadyRated) return;

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
        setShowReturnPrompt(true);
      }

      localStorage.setItem(key, new Date().toISOString());
    } catch {}
  }, [rinkId]);

  // Store richer view data for "Recently Viewed" on homepage
  useEffect(() => {
    if (!detail || !rinkId) return;
    try {
      localStorage.setItem(`coldstart_viewed_meta_${rinkId}`, JSON.stringify({
        name: detail.rink.name,
        city: detail.rink.city,
        state: detail.rink.state,
        viewedAt: new Date().toISOString(),
      }));
    } catch {}
  }, [detail, rinkId]);

  // Load nearby + signal seed data when rink detail is available
  useEffect(() => {
    if (!detail) return;
    const slug = getRinkSlug(detail.rink);
    const id = detail.rink.id;
    const findSeedId = async (): Promise<string | null> => {
      const rinks = await seedGet<Array<{ id: string; name: string }>>('/data/rinks.json');
      if (!rinks) return null;
      const nameNorm = detail.rink.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = rinks.find(r => r.name.toLowerCase().replace(/[^a-z0-9]/g, '') === nameNorm);
      return match?.id || null;
    };
    const tryNearby = async () => {
      const seedId = await findSeedId();
      if (seedId) {
        const bySeed = await seedGet<Record<string, NearbyPlace[]>>(`/data/nearby/${seedId}.json`);
        if (bySeed) { setNearbyData(bySeed); return; }
      }
      const byId = await seedGet<Record<string, NearbyPlace[]>>(`/data/nearby/${id}.json`);
      if (byId) { setNearbyData(byId); return; }
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

  // Fetch rink photos from DB
  useEffect(() => {
    if (!rinkId) return;
    fetch(`/api/v1/rinks/${rinkId}/photos`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.photos) setRinkPhotos(data.photos); })
      .catch(() => {});
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
    setDetail(prev => prev ? { ...prev, summary } : prev);
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
  const rinkSlug = getRinkSlug(rink);

  const shareButton = (
    <button
      aria-label="Share rink with team"
      onClick={() => {
        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('ref', 'share');
        const url = shareUrl.toString();
        const parking = summary.signals.find(s => s.signal === 'parking');
        const parkingNote = parking ? ` (Parking: ${parking.value.toFixed(1)}/5)` : '';
        const address = `📍 ${rink.address}, ${rink.city}, ${rink.state}`;
        const topTip = summary.tips.length > 0 ? `\n💡 "${summary.tips[0].text}"` : '';
        const shareText = `${rink.name}${parkingNote}\n${address}${topTip}\nRink info from hockey parents: ${url}`;
        if (navigator.share) {
          navigator.share({ title: `${rink.name} — ColdStart Hockey`, text: shareText, url }).catch(() => {});
        } else {
          const copyToClipboard = (t: string) => {
            if (navigator.clipboard?.writeText) {
              return navigator.clipboard.writeText(t);
            }
            // Fallback for older browsers / HTTP contexts
            const textarea = document.createElement('textarea');
            textarea.value = t;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return Promise.resolve();
          };
          copyToClipboard(shareText).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }).catch(() => {});
        }
      }}
      style={{
        fontSize: 12, fontWeight: 500,
        color: shareCopied ? colors.success : colors.brand,
        background: shareCopied ? colors.bgSuccess : colors.bgInfo,
        border: `1px solid ${shareCopied ? colors.successBorder : colors.brandLight}`,
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
        { key: 'signals', label: 'Ratings' },
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
    <PageShell logoStacked navBelow={tabBar}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>

        {referralSource === 'share' && (
          <div style={{
            marginTop: 12, padding: '10px 16px', borderRadius: 10,
            background: colors.bgInfo, border: `1px solid ${colors.brandLight}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>&#128101;</span>
            <span style={{ fontSize: 13, color: colors.brandDark }}>
              Shared by a hockey parent on your team
            </span>
          </div>
        )}

        <PhotoGallery
          photos={rinkPhotos}
          rinkId={rinkId}
          rinkName={rink.name}
          staticPhoto={getRinkPhoto(rink)}
          currentUserId={currentUser?.id}
          onPhotoAdded={(photo) => setRinkPhotos(prev => [photo, ...prev])}
        />

        {/* ── Rink header — Glance View (mobile-first) ── */}
        <section style={{ paddingTop: 24, paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: 'clamp(22px, 5vw, 36px)',
                fontWeight: 700, color: colors.textPrimary,
                lineHeight: 1.15, letterSpacing: -0.5, margin: 0,
              }}>
                {rink.name}
              </h1>
              <a
                href={`https://maps.apple.com/?address=${encodeURIComponent(`${rink.address}, ${rink.city}, ${rink.state}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: colors.textTertiary, marginTop: 4, lineHeight: 1.4, margin: '4px 0 0', display: 'block', textDecoration: 'underline', textDecorationColor: colors.borderMedium, textUnderlineOffset: 2 }}
              >
                {rink.address}, {rink.city}, {rink.state}
              </a>
              {detail.same_name_rinks && detail.same_name_rinks.length > 0 && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', borderRadius: 8,
                  background: colors.bgInfo, border: `1px solid ${colors.brandLight}`,
                  fontSize: 12, color: colors.brandDark,
                }}>
                  Not the right one? There&apos;s also a {rink.name} in{' '}
                  {detail.same_name_rinks.map((s, i) => (
                    <span key={s.id}>
                      {i > 0 && ', '}
                      <a
                        href={`/rinks/${s.id}`}
                        style={{ color: colors.brand, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}
                      >
                        {s.city}, {s.state}
                      </a>
                    </span>
                  ))}
                </div>
              )}
              {rinkSlug === 'ice-line' && (
                <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }}>
                  🏠 Home of the{' '}
                  <a href="https://myhockeyrankings.com/association-info?a=212" target="_blank" rel="noopener noreferrer" style={{ color: colors.brand, textDecoration: 'none', fontWeight: 500 }}>Philadelphia Junior Flyers</a>
                  ,{' '}
                  <a href="https://myhockeyrankings.com/association-info?a=3363" target="_blank" rel="noopener noreferrer" style={{ color: colors.brand, textDecoration: 'none', fontWeight: 500 }}>Team Philadelphia</a>
                  , and{' '}
                  <a href="https://www.wcwolverines.org/" target="_blank" rel="noopener noreferrer" style={{ color: colors.brand, textDecoration: 'none', fontWeight: 500 }}>West Chester Wolverines</a>
                </div>
              )}
            </div>
            <div style={{ flexShrink: 0, paddingTop: 4 }}>
              <SaveRinkButton rinkId={rinkId} />
            </div>
          </div>

          {hasData && (
            <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 10, margin: '10px 0 0' }}>
              From {summary.contribution_count} hockey parent{summary.contribution_count !== 1 ? 's' : ''}
            </p>
          )}

          {hasData && (
            <VerdictCard rink={rink} summary={summary} loadedSignals={loadedSignals} />
          )}

          <div style={{ marginTop: 12 }}>
            {shareButton}
          </div>

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(() => {
                  const streaming = RINK_STREAMING[rinkSlug];
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
                        background: isLiveBarn ? colors.bgOrangeLight : colors.bgInfo,
                        border: `1px solid ${isLiveBarn ? colors.amberBorder : colors.brandLight}`,
                        fontSize: 12, fontWeight: 600,
                        color: isLiveBarn ? colors.orangeDeep : colors.brandDark,
                        textDecoration: 'none', cursor: 'pointer',
                      }}
                    >
                      {isLiveBarn ? '📹 LiveBarn' : '🐻 BlackBear TV'}
                      <span style={{ fontSize: text['2xs'], opacity: 0.7 }}>Watch live →</span>
                    </a>
                  );
                })()}
                {rinkSlug === 'ice-line' && (
                  <a
                    href="https://icelinequadrinks.com/about/pro-shop/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 8,
                      background: colors.bgSuccess, border: `1px solid ${colors.successBorder}`,
                      fontSize: 12, fontWeight: 600, color: colors.success,
                      textDecoration: 'none', cursor: 'pointer',
                    }}
                  >
                    🏒 Pro Shop
                    <span style={{ fontSize: text['2xs'], opacity: 0.7 }}>Visit site →</span>
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  onClick={() => router.push(`/trip/new?rink=${rinkId}`)}
                  style={{
                    fontSize: 12, fontWeight: 600,
                    color: colors.textTertiary, background: colors.bgSubtle,
                    border: `1px solid ${colors.borderDefault}`,
                    borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  📋 Plan trip
                </button>
              </div>
            </div>

            {rinkSlug !== 'ice-line' && (() => {
              const teams = detail.home_teams;
              if (!teams || teams.length === 0) return null;
              return (
                <div style={{ fontSize: 12, color: colors.textTertiary }}>
                  🏠 Home of <span style={{ fontWeight: 600, color: colors.textSecondary }}>{teams.join(', ')}</span>
                </div>
              );
            })()}

            <button
              onClick={() => {
                const el = document.getElementById('claim-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ fontSize: 11, color: colors.brandAccent, cursor: 'pointer', padding: '6px 0', display: 'flex', alignItems: 'center', background: 'none', border: 'none' }}
            >
              Claim this rink →
            </button>
          </div>
        </section>

        {showReturnPrompt && (
          <ReturnRatingPrompt
            rinkId={rinkId}
            rinkName={rink.name}
            rinkAddress={`${rink.address}, ${rink.city}, ${rink.state}`}
            contributionCount={summary.contribution_count}
            onDismiss={() => setShowReturnPrompt(false)}
            onSummaryUpdate={handleSummaryUpdate}
            currentUser={currentUser}
          />
        )}

        <div id="contribute-section">
          <RateAndContribute rinkId={rinkId} rinkName={rink.name} onSummaryUpdate={handleSummaryUpdate} />
        </div>

        <SignalsSection rink={rink} summary={summary} loadedSignals={loadedSignals} />

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

        <TipsSection tips={summary.tips} rinkSlug={rinkSlug} />

        <div id="nearby-section">
          <NearbySection title="Places to eat" icon="🍽️" rinkSlug={rinkSlug} fanFavorites categories={[
            { label: 'Quick bite', icon: '🥯', description: 'Grab & go before the game — bagels, donuts, drive-throughs. Think Wawa run at 6am.', places: getNearbyPlaces(rink, 'quick_bite', nearbyData) },
            { label: 'Good coffee', icon: '☕', description: 'A real coffee while you wait for warmups. Not the vending machine in the lobby.', places: getNearbyPlaces(rink, 'coffee', nearbyData) },
            { label: 'Team Restaurants', icon: '🍕', description: 'Where you take 15 kids in hockey gear between games. Needs big tables and patience.', places: getNearbyPlaces(rink, 'team_lunch', nearbyData) },
          ]} />
          <NearbySection title="Team activities" icon="🎳" rinkSlug={rinkSlug} categories={[
            { label: 'Bowling', icon: '🎳', description: 'Classic team bonding night. Book lanes ahead on tournament weekends.', places: getNearbyPlaces(rink, 'bowling', nearbyData) },
            { label: 'Arcade', icon: '🕹️', description: 'Burn off energy between games. Dave & Busters, Round1, local spots.', places: getNearbyPlaces(rink, 'arcade', nearbyData) },
            { label: 'Movies', icon: '🎬', description: 'Kill 2 hours between a 9am and 3pm game. Popcorn counts as a meal.', places: getNearbyPlaces(rink, 'movies', nearbyData) },
            { label: 'Fun zone', icon: '🎢', description: 'Trampoline parks, laser tag, go-karts — the stuff kids actually want to do.', places: getNearbyPlaces(rink, 'fun', nearbyData) },
          ]} />
          <NearbySection title="Where to stay" icon="🏨" rinkSlug={rinkSlug} categories={[
            { label: 'Hotels nearby', icon: '🏨', description: 'Within 10 minutes of the rink', places: getNearbyPlaces(rink, 'hotels', nearbyData) },
          ]} />
          <NearbySection title="Gas stations" icon="⛽" rinkSlug={rinkSlug} categories={[
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
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: colors.textMuted }}>Built by hockey parents, for hockey parents.</span>
          <span style={{ fontSize: 11, color: colors.textMuted }}>v0.3</span>
        </div>
        <span style={{ fontSize: 11, color: colors.textMuted }}>
          Rink operator? Contact us at{' '}
          <a href="mailto:rinks@coldstarthockey.com" style={{ color: colors.textMuted, textDecoration: 'underline' }}>
            rinks@coldstarthockey.com
          </a>
        </span>
      </footer>
    </PageShell>
  );
}
