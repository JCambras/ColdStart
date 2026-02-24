'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getVibe } from '../../../app/vibe';
import { Logo } from '../../../components/Logo';
import { apiGet, apiDelete } from '../../../lib/api';
import { storage } from '../../../lib/storage';
import { useAuth } from '../../../contexts/AuthContext';
import { getBarColor, getBarBg, getBarBorder, getVerdictColor } from '../../../lib/rinkHelpers';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { generateBriefing } from '../../../lib/sentences';
import { colors, text, radius, shadow, spacing, pad } from '../../../lib/theme';
import { generateICS, downloadICS } from '../../../lib/calendar';

interface Game { id: string; day: string; time: string; opponent: string; sheet: string; note: string; }
interface CostItem { id: string; label: string; amount: string; splitType: 'per-family' | 'per-player' | 'total'; }
interface Addition { type: 'restaurant' | 'tip' | 'note'; text: string; addedBy: string; createdAt: string; cost?: string; }
interface Trip {
  id: string; teamName: string; dates: string;
  rink: { id: string; name: string; city: string; state: string };
  hotel: string; hotelCost?: string; lunch: string; lunchCost?: string; dinner: string; dinnerCost?: string;
  games?: Game[]; gameTimes?: string; notes: string;
  collaborative?: boolean; familyCount?: number; costItems?: CostItem[];
  additions?: Addition[]; createdAt: string; rated?: boolean;
}

interface RinkSummary {
  verdict: string;
  signals: { signal: string; value: number; count: number; confidence: number; stddev?: number }[];
  tips: { text: string; contributor_type: string; created_at?: string }[];
  contribution_count?: number;
  last_updated_at?: string | null;
  confirmed_this_season?: boolean;
}

const SIGNAL_META: Record<string, { label: string; icon: string }> = {
  parking: { label: 'Parking', icon: '🅿️' }, cold: { label: 'Cold', icon: '❄️' }, chaos: { label: 'Chaos', icon: '🌀' },
  food_nearby: { label: 'Food', icon: '🍔' }, family_friendly: { label: 'Family', icon: '👨‍👩‍👧' },
  locker_rooms: { label: 'Lockers', icon: '🚪' }, pro_shop: { label: 'Pro shop', icon: '🏒' },
};

// Multi-sheet rink entrance notes
const SHEET_NOTES: Record<string, Record<string, string>> = {
  'IceWorks Skating Complex': {
    'Rink 1': 'Main entrance, turn left past the pro shop',
    'Rink 2': 'Main entrance, turn right past the restaurant',
    'Rink 3': 'Use the back entrance from the rear parking lot — much faster',
    'Rink 4': 'Same as Rink 3, through the back entrance and turn left',
  },
  'Ice Line Quad Rinks': {
    'Rink A': 'Main entrance, ground floor left',
    'Rink B': 'Main entrance, ground floor right',
    'Rink C': 'Enter through the side door near the loading dock',
    'Rink D': 'Upstairs viewing from main entrance, ice level from side door',
  },
  'Ice House': {
    'Rink 1': 'Main entrance on Midtown Bridge Approach',
    'Rink 2': 'Main entrance, second floor',
    'Rink 3': 'Use the River St entrance on the back side of the building',
    'Rink 4': 'Same as Rink 3, River St entrance',
  },
};

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [summary, setSummary] = useState<RinkSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const { currentUser } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [briefingCopied, setBriefingCopied] = useState(false);
  const [addType, setAddType] = useState<'restaurant' | 'tip' | 'note'>('restaurant');
  const [addText, setAddText] = useState('');
  const [addCost, setAddCost] = useState('');
  // Post-trip rating
  const [showRatePrompt, setShowRatePrompt] = useState(false);
  const [rateSubmitted, setRateSubmitted] = useState(false);
  const [isGlancer, setIsGlancer] = useState(false);
  const [showFullTrip, setShowFullTrip] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Trip phase detection: arriving | at_rink | between_games | leaving | reflecting | upcoming
  const [tripPhase, setTripPhase] = useState<'upcoming' | 'arriving' | 'at_rink' | 'between_games' | 'leaving' | 'reflecting'>('upcoming');

  // Log vibe events
  useEffect(() => {
    const v = getVibe();
    v.log('page_view', { path: `/trip/${tripId}` });
    v.log('trip_page_view', { tripId });
    setIsGlancer(v.isSharedLinkGlancer || v.is('glancer'));
  }, [tripId]);

  useEffect(() => {
    const trips = storage.getTrips();
    const t = trips[tripId] as Trip | undefined;
    if (t) {
      setTrip(t);
      if (t.dates) {
        const now = new Date();
        const dateStr = t.dates.replace(/.*?(\w+ \d+).*/, '$1');
        const tripEnd = new Date(dateStr);
        if (tripEnd < now && !t.rated) setShowRatePrompt(true);
      }

      // ── Trip phase detection ──
      const now = Date.now();
      if (t.games && t.games.length > 0 && t.dates) {
        // Parse base date from trip dates string
        const baseDateStr = t.dates.replace(/.*?(\w+ \d+,?\s*\d*).*/, '$1');
        const baseDate = new Date(baseDateStr);
        if (!isNaN(baseDate.getTime())) {
          // Build timestamps from game times
          const gameTimes = t.games.map(g => {
            if (!g.time) return null;
            const [hours, minutes] = g.time.replace(/[^\d:aApP]/g, '').split(':');
            const d = new Date(baseDate);
            let h = parseInt(hours) || 0;
            const m = parseInt(minutes) || 0;
            if (g.time.toLowerCase().includes('pm') && h < 12) h += 12;
            if (g.time.toLowerCase().includes('am') && h === 12) h = 0;
            d.setHours(h, m, 0, 0);
            return d.getTime();
          }).filter((ts): ts is number => ts !== null).sort((a, b) => a - b);

          if (gameTimes.length > 0) {
            const firstGame = gameTimes[0];
            const lastGame = gameTimes[gameTimes.length - 1];
            const HOUR = 60 * 60 * 1000;

            if (now < firstGame - 2 * HOUR) {
              setTripPhase('upcoming');
            } else if (now < firstGame) {
              setTripPhase('arriving');
            } else if (now < lastGame + 2 * HOUR) {
              // During game window — check if between games
              if (gameTimes.length > 1) {
                const inGame = gameTimes.some(gt => now >= gt && now < gt + 2 * HOUR);
                setTripPhase(inGame ? 'at_rink' : 'between_games');
              } else {
                setTripPhase('at_rink');
              }
            } else if (now < lastGame + 4 * HOUR) {
              setTripPhase('leaving');
            } else {
              setTripPhase('reflecting');
            }
          }
        }
      }

      apiGet<{ summary?: RinkSummary }>(`/rinks/${t.rink.id}`).then(({ data }) => {
        if (data?.summary) setSummary(data.summary);
      });
    }
    setLoading(false);
  }, [tripId]);

  function submitAddition() {
    if (!addText.trim() || !trip) return;
    const addition: Addition = { type: addType, text: addText.trim(), cost: addCost.trim() || undefined, addedBy: currentUser?.name || 'Team parent', createdAt: new Date().toISOString() };
    const updated = { ...trip, additions: [...(trip.additions || []), addition] };
    setTrip(updated);
    const trips = storage.getTrips();
    trips[tripId] = updated;
    storage.setTrips(trips);
    setAddText(''); setAddCost(''); setShowAddForm(false);
  }

  function dismissRatePrompt() {
    setShowRatePrompt(false);
    if (trip) {
      const updated = { ...trip, rated: true };
      const trips = storage.getTrips();
      trips[tripId] = updated;
      storage.setTrips(trips);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: colors.bgPage, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <LoadingSkeleton variant="page" />
    </div>
  );

  if (!trip) return (
    <div style={{ minHeight: '100vh', background: colors.bgPage, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: spacing[16] }}>🏒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Trip not found</h2>
        <p style={{ fontSize: 14, color: colors.textTertiary, marginTop: spacing[8] }}>This trip page may have been created on another device.</p>
        <button onClick={() => router.push('/')} style={{ marginTop: spacing[16], fontSize: 13, fontWeight: 600, color: colors.brand, background: colors.bgInfo, border: `1px solid ${colors.brandLight}`, borderRadius: 8, padding: pad(spacing[8], spacing[16]), cursor: 'pointer' }}>Go to ColdStart Hockey →</button>
      </div>
    </div>
  );

  const topSignals = summary?.signals?.sort((a, b) => {
    const order = ['parking', 'cold', 'food_nearby', 'chaos', 'family_friendly', 'locker_rooms', 'pro_shop'];
    return order.indexOf(a.signal) - order.indexOf(b.signal);
  }).slice(0, 5) || [];

  const hasGames = trip.games && trip.games.length > 0;
  const hasCosts = trip.costItems && trip.costItems.length > 0;
  const families = trip.familyCount || 16;
  const sheetNotes = SHEET_NOTES[trip.rink.name] || {};

  return (
    <div style={{ minHeight: '100vh', background: colors.bgPage, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header style={{ background: `linear-gradient(135deg, ${colors.brandDeep} 0%, ${colors.brand} 100%)`, padding: pad(spacing[32], spacing[24], spacing[28]), color: colors.textInverse }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.8, marginBottom: spacing[8] }}>GAME DAY INFO</div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>🏒 {trip.teamName}</h1>
          <p style={{ fontSize: 16, fontWeight: 500, marginTop: spacing[6], opacity: 0.9 }}>at {trip.rink.name}</p>
          {trip.dates && <p style={{ fontSize: 14, marginTop: spacing[4], opacity: 0.75 }}>📅 {trip.dates}</p>}
          <div style={{ display: 'flex', gap: spacing[8], marginTop: spacing[16] }}>
            <button onClick={() => {
              const url = window.location.href;
              const text = `${trip.teamName} at ${trip.rink.name}${trip.dates ? ' — ' + trip.dates : ''}\n\nGame day info: ${url}`;
              const canShare = typeof navigator.share === 'function';
              getVibe().log('trip_share', { tripId, rinkId: trip.rink.id, method: canShare ? 'native' : 'clipboard' });
              if (canShare) { navigator.share({ title: `${trip.teamName} — Game Day`, text, url }).catch(() => {}); }
              else { const fallbackCopy = (t: string) => { if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(t); const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); return Promise.resolve(); }; fallbackCopy(text).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }).catch(() => {}); }
            }} style={{ fontSize: 13, fontWeight: 600, color: colors.textInverse, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: pad(spacing[8], spacing[16]), cursor: 'pointer' }}>
              {shareCopied ? '✓ Copied!' : '📤 Share with team'}
            </button>
            <button onClick={() => router.push(`/trip/new?edit=${tripId}`)} style={{ fontSize: 13, fontWeight: 600, color: colors.textInverse, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: pad(spacing[8], spacing[16]), cursor: 'pointer' }}>
              ✏️ Edit
            </button>
            <button onClick={() => router.push('/trips')} style={{ fontSize: 13, fontWeight: 600, color: colors.textInverse, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: pad(spacing[8], spacing[16]), cursor: 'pointer' }}>
              📁 My trips
            </button>
            {trip.games && trip.games.length > 0 && (() => {
              const ics = generateICS(trip);
              if (!ics) return null;
              return (
                <button onClick={() => {
                  const filename = `${trip.teamName.replace(/[^a-zA-Z0-9]/g, '_')}_games.ics`;
                  downloadICS(filename, ics);
                }} style={{ fontSize: 13, fontWeight: 600, color: colors.textInverse, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: pad(spacing[8], spacing[16]), cursor: 'pointer' }}>
                  📅 Add to Calendar
                </button>
              );
            })()}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: pad(0, spacing[24], spacing[60]) }}>

        {/* ── Phase-aware banner ── */}
        {tripPhase === 'arriving' && !isGlancer && (
          <section style={{
            background: colors.bgInfo, border: `1px solid ${colors.brandLight}`,
            borderRadius: 14, padding: pad(spacing[14], spacing[18]), marginTop: -16, position: 'relative', zIndex: 6,
            boxShadow: shadow.lg,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[10] }}>
              <span style={{ fontSize: 22 }}>🚗</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.brandDark }}>You&apos;re arriving!</div>
                <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>
                  📍 {trip?.rink.name} &middot; {trip?.rink.city}, {trip?.rink.state}
                </div>
              </div>
            </div>
            {summary?.signals && (() => {
              const parking = summary.signals.find(s => s.signal === 'parking');
              if (!parking || parking.count === 0) return null;
              return (
                <div style={{ marginTop: spacing[10], padding: pad(spacing[8], spacing[12]), background: getBarBg(parking.value, parking.count), borderRadius: 8, border: `1px solid ${getBarBorder(parking.value, parking.count)}`, fontSize: 13, fontWeight: 600, color: getBarColor(parking.value, parking.count) }}>
                  🅿️ Parking: {parking.value >= 3.5 ? 'Easy' : parking.value >= 2.5 ? 'Tight' : 'Tough'} ({parking.value.toFixed(1)}/5)
                </div>
              );
            })()}
          </section>
        )}

        {tripPhase === 'between_games' && !isGlancer && (
          <section style={{
            background: colors.bgWarning, border: `1px solid ${colors.warningBorder}`,
            borderRadius: 14, padding: pad(spacing[14], spacing[18]), marginTop: -16, position: 'relative', zIndex: 6,
            boxShadow: shadow.lg,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[10] }}>
              <span style={{ fontSize: 22 }}>⏱️</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.amberDark }}>Between games</div>
                <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>
                  {trip?.lunch ? `Lunch: ${trip.lunch}` : trip?.dinner ? `Dinner: ${trip.dinner}` : 'Check nearby food options on the rink page'}
                </div>
              </div>
            </div>
          </section>
        )}

        {tripPhase === 'leaving' && !isGlancer && !showRatePrompt && (
          <section style={{
            background: colors.bgSuccess, border: `1px solid ${colors.successBorder}`,
            borderRadius: 14, padding: pad(spacing[14], spacing[18]), marginTop: -16, position: 'relative', zIndex: 6,
            boxShadow: shadow.lg,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[10] }}>
              <span style={{ fontSize: 22 }}>👋</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.success }}>Game over!</div>
                <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>Help the next family — rate your experience.</div>
              </div>
            </div>
            <button
              onClick={() => router.push(`/rinks/${trip?.rink.id}`)}
              style={{
                marginTop: spacing[10], width: '100%', padding: pad(spacing[10], 0), fontSize: 13, fontWeight: 700,
                background: colors.success, color: colors.textInverse, border: 'none', borderRadius: 8, cursor: 'pointer',
              }}
            >
              Rate {trip?.rink.name} →
            </button>
          </section>
        )}

        {/* ── Glancer Quick View — essentials pinned above fold ── */}
        {isGlancer && !showFullTrip && (
          <>
            <section style={{
              background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 14,
              padding: spacing[20], marginTop: -16, position: 'relative', zIndex: 5,
              boxShadow: shadow.lg,
            }}>
              {/* Address */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[10], marginBottom: spacing[14] }}>
                <span style={{ fontSize: 18 }}>📍</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>{trip.rink.name}</div>
                  <div style={{ fontSize: 13, color: colors.textTertiary }}>{trip.rink.city}, {trip.rink.state}</div>
                </div>
              </div>

              {/* Next game time */}
              {hasGames && trip.games![0] && (
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[10], marginBottom: spacing[14], padding: pad(spacing[10], spacing[12]), background: colors.bgInfo, borderRadius: 10 }}>
                  <span style={{ fontSize: 18 }}>🕐</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>
                      {trip.games![0].day ? `${trip.games![0].day} ` : ''}{trip.games![0].time || 'TBD'}
                    </div>
                    <div style={{ fontSize: 13, color: colors.textTertiary }}>
                      vs. {trip.games![0].opponent || 'TBD'}
                      {trip.games![0].sheet && ` · ${trip.games![0].sheet}`}
                    </div>
                  </div>
                </div>
              )}

              {/* Parking verdict — the one thing glancers care about */}
              {summary?.signals && (() => {
                const parking = summary.signals.find(s => s.signal === 'parking');
                if (!parking) return null;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[10], padding: pad(spacing[10], spacing[12]), background: getBarBg(parking.value, parking.count), borderRadius: 10, border: `1px solid ${getBarBorder(parking.value, parking.count)}` }}>
                    <span style={{ fontSize: 18 }}>🅿️</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: getBarColor(parking.value, parking.count) }}>
                        Parking: {parking.value >= 3.5 ? 'Easy' : parking.value >= 2.5 ? 'Tight' : 'Tough'} ({parking.value.toFixed(1)}/5)
                      </div>
                      {summary.tips?.[0] && summary.tips[0].text.toLowerCase().includes('park') && (
                        <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2, fontStyle: 'italic' }}>
                          &ldquo;{summary.tips[0].text.slice(0, 80)}{summary.tips[0].text.length > 80 ? '...' : ''}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Entrance tip if sheet specified */}
              {hasGames && trip.games![0]?.sheet && (() => {
                const sheetKey = trip.games![0].sheet.startsWith('Rink') ? trip.games![0].sheet : `Rink ${trip.games![0].sheet}`;
                const note = sheetNotes[sheetKey];
                if (!note) return null;
                return (
                  <div style={{ marginTop: spacing[10], padding: pad(spacing[8], spacing[12]), background: colors.bgInfo, borderRadius: 8, borderLeft: `3px solid ${colors.brandAccent}`, fontSize: 12, color: colors.brandDark }}>
                    🚪 <strong>Entrance:</strong> {note}
                  </div>
                );
              })()}
            </section>

            {/* Show full trip button */}
            <button
              onClick={() => setShowFullTrip(true)}
              style={{
                width: '100%', marginTop: spacing[12], padding: pad(spacing[12], 0),
                fontSize: 13, fontWeight: 600, color: colors.brand,
                background: colors.bgInfo, border: `1px solid ${colors.brandLight}`,
                borderRadius: 10, cursor: 'pointer',
              }}
            >
              See full trip details ({hasGames ? `${trip.games!.length} game${trip.games!.length !== 1 ? 's' : ''}` : ''}{trip.hotel ? ', hotel' : ''}{hasCosts ? ', costs' : ''}) ↓
            </button>

            {/* Soft CTA for conversion */}
            <div style={{ textAlign: 'center', marginTop: spacing[24] }}>
              <p style={{ fontSize: 12, color: colors.textMuted }}>
                📍 Want rink intel for your next away game?{' '}
                <button onClick={() => router.push('/')} style={{ color: colors.brand, cursor: 'pointer', fontWeight: 600, background: 'none', border: 'none', padding: 0, font: 'inherit' }}>See how ColdStart Hockey works →</button>
              </p>
            </div>
          </>
        )}

        {/* ── Full trip content (always shown for non-glancers, expandable for glancers) ── */}
        {(!isGlancer || showFullTrip) && (<>

        {/* ── Post-trip rating prompt ── */}
        {showRatePrompt && !rateSubmitted && (
          <section style={{ background: colors.bgWarning, border: `1px solid ${colors.warningBorder}`, borderRadius: 14, padding: spacing[16], marginTop: -16, position: 'relative', zIndex: 5, boxShadow: shadow.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.amberDark }}>How was {trip.rink.name}?</div>
                <div style={{ fontSize: 12, color: colors.amber, marginTop: 2 }}>Help the next team — rate your experience in 30 seconds</div>
              </div>
              <button onClick={() => dismissRatePrompt()} style={{ fontSize: 11, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Dismiss</button>
            </div>
            <button onClick={() => { dismissRatePrompt(); router.push(`/rinks/${trip.rink.id}`); }} style={{
              marginTop: spacing[10], width: '100%', padding: pad(spacing[10], 0), fontSize: 13, fontWeight: 700,
              background: colors.warning, color: colors.textInverse, border: 'none', borderRadius: 8, cursor: 'pointer',
            }}>
              ⭐ Rate {trip.rink.name} →
            </button>
          </section>
        )}

        {/* ── Rink Verdict Card ── */}
        {summary && (
          <section style={{ background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 14, padding: spacing[20], marginTop: showRatePrompt && !rateSubmitted ? spacing[12] : -16, position: 'relative', boxShadow: shadow.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[12] }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>Rink report</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: getVerdictColor(summary.verdict), marginTop: 4 }}>{summary.verdict}</div>
              </div>
              <button onClick={() => router.push(`/rinks/${trip.rink.id}`)} style={{ fontSize: 11, fontWeight: 600, color: colors.brand, background: colors.bgInfo, border: `1px solid ${colors.brandLight}`, borderRadius: 6, padding: pad(spacing[4], spacing[10]), cursor: 'pointer' }}>Full report →</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[8] }}>
              {topSignals.map(sig => {
                const meta = SIGNAL_META[sig.signal] || { label: sig.signal, icon: '' };
                return (
                  <div key={sig.signal} style={{ padding: pad(spacing[6], spacing[10]), borderRadius: 8, background: getBarBg(sig.value, sig.count), border: `1px solid ${getBarBorder(sig.value, sig.count)}`, fontSize: 12 }}>
                    <span>{meta.icon}</span> <span style={{ fontWeight: 600, color: getBarColor(sig.value, sig.count) }}>{sig.value.toFixed(1)}</span> <span style={{ color: colors.textTertiary }}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
            {summary.tips?.[0] && (
              <div style={{ marginTop: spacing[12], padding: pad(spacing[8], spacing[12]), background: colors.bgInfo, borderRadius: 8, borderLeft: `3px solid ${colors.brand}`, fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' }}>
                💡 &ldquo;{summary.tips[0].text}&rdquo;
              </div>
            )}
          </section>
        )}

        {/* ── Team Briefing — copyable paragraph for group chat ── */}
        {summary && summary.signals.some(s => s.count > 0) && (
          <section style={{
            background: colors.bgInfo, border: `1px solid ${colors.brandLight}`,
            borderRadius: 14, padding: pad(spacing[16], spacing[20]), marginTop: spacing[16],
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[8] }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.brandDark, textTransform: 'uppercase', letterSpacing: 1 }}>
                Team briefing
              </div>
              <button
                onClick={() => {
                  const briefingText = generateBriefing({
                    signals: summary.signals,
                    tips: summary.tips || [],
                    contributionCount: summary.contribution_count || 0,
                    rinkName: trip.rink.name,
                    verdict: summary.verdict,
                    lastUpdatedAt: summary.last_updated_at || null,
                    confirmedThisSeason: summary.confirmed_this_season || false,
                  });
                  const copyText = `${trip.rink.name} — ${trip.rink.city}, ${trip.rink.state}\n\n${briefingText}`;
                  if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(copyText).then(() => {
                      setBriefingCopied(true);
                      setTimeout(() => setBriefingCopied(false), 2000);
                    });
                  }
                }}
                style={{
                  fontSize: 11, fontWeight: 600, color: briefingCopied ? colors.success : colors.brand,
                  background: 'none', border: `1px solid ${briefingCopied ? colors.successBorder : colors.brandLight}`,
                  borderRadius: 6, padding: pad(spacing[3], spacing[10]), cursor: 'pointer',
                }}
              >
                {briefingCopied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <p style={{
              fontSize: 13, color: colors.textSecondary, lineHeight: 1.6, margin: 0,
            }}>
              {generateBriefing({
                signals: summary.signals,
                tips: summary.tips || [],
                contributionCount: summary.contribution_count || 0,
                rinkName: trip.rink.name,
                verdict: summary.verdict,
                lastUpdatedAt: summary.last_updated_at || null,
                confirmedThisSeason: summary.confirmed_this_season || false,
              })}
            </p>
          </section>
        )}

        {/* ── Game Schedule ── */}
        {hasGames && (
          <section style={{ background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 14, padding: spacing[20], marginTop: spacing[16] }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>🕐 Game schedule</h3>
            <div style={{ marginTop: spacing[12], display: 'flex', flexDirection: 'column', gap: spacing[10] }}>
              {trip.games!.map((game, i) => {
                const sheetKey = game.sheet ? (game.sheet.startsWith('Rink') ? game.sheet : `Rink ${game.sheet}`) : '';
                const entranceNote = sheetKey ? sheetNotes[sheetKey] : null;
                return (
                  <div key={i} style={{ padding: pad(spacing[10], spacing[12]), background: colors.bgSubtle, borderRadius: 10, border: `1px solid ${colors.borderLight}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[12] }}>
                      <div style={{ minWidth: 52, textAlign: 'center' }}>
                        {game.day && <div style={{ fontSize: 11, fontWeight: 700, color: colors.textTertiary, textTransform: 'uppercase' }}>{game.day}</div>}
                        <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{game.time || 'TBD'}</div>
                      </div>
                      <div style={{ width: 1, height: 32, background: colors.borderDefault }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                          vs. {game.opponent || 'TBD'}
                          {game.sheet && <span style={{ fontSize: 11, color: colors.textTertiary, marginLeft: 6 }}>· {game.sheet.startsWith('Rink') || game.sheet.startsWith('Sheet') ? game.sheet : `Sheet ${game.sheet}`}</span>}
                        </div>
                        {game.note && <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>{game.note}</div>}
                      </div>
                    </div>
                    {/* Entrance note for multi-sheet rinks */}
                    {entranceNote && (
                      <div style={{ marginTop: spacing[8], padding: pad(spacing[6], spacing[10]), background: colors.bgInfo, border: `1px solid ${colors.brandLight}`, borderRadius: 6, fontSize: 11, color: colors.brandDark }}>
                        🚪 <strong>Entrance tip:</strong> {entranceNote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Fallback: old plain text gameTimes */}
        {!hasGames && trip.gameTimes && (
          <section style={{ background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 14, padding: spacing[20], marginTop: spacing[16] }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>🕐 Game times</h3>
            <div style={{ marginTop: spacing[12], fontSize: 14, color: colors.textPrimary, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{trip.gameTimes}</div>
          </section>
        )}

        {/* ── Lodging & Food (consolidated) ── */}
        {(trip.hotel || trip.lunch || trip.dinner) && (
          <section style={{ background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 14, padding: spacing[20], marginTop: spacing[16] }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>🏨 Lodging & food</h3>
            {trip.hotel && (
              <div style={{ marginTop: spacing[12] }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.textTertiary }}>WHERE WE&apos;RE STAYING</div>
                <p style={{ fontSize: 14, color: colors.textPrimary, marginTop: 4, lineHeight: 1.5, margin: 0 }}>{trip.hotel}</p>
                {trip.hotelCost && <p style={{ fontSize: 12, color: colors.success, fontWeight: 600, marginTop: 2, margin: 0 }}>💲 {trip.hotelCost}</p>}
              </div>
            )}
            {trip.lunch && (
              <div style={{ marginTop: spacing[14], paddingTop: spacing[12], borderTop: `1px solid ${colors.borderLight}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.textTertiary }}>LUNCH</div>
                <p style={{ fontSize: 14, color: colors.textPrimary, marginTop: 4, margin: 0 }}>{trip.lunch}</p>
                {trip.lunchCost && <p style={{ fontSize: 12, color: colors.success, fontWeight: 600, marginTop: 2, margin: 0 }}>💲 {trip.lunchCost}</p>}
              </div>
            )}
            {trip.dinner && (
              <div style={{ marginTop: spacing[14], paddingTop: spacing[12], borderTop: `1px solid ${colors.borderLight}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.textTertiary }}>DINNER</div>
                <p style={{ fontSize: 14, color: colors.textPrimary, marginTop: 4, margin: 0 }}>{trip.dinner}</p>
                {trip.dinnerCost && <p style={{ fontSize: 12, color: colors.success, fontWeight: 600, marginTop: 2, margin: 0 }}>💲 {trip.dinnerCost}</p>}
              </div>
            )}
          </section>
        )}

        {/* ── Cost Breakdown ── */}
        {hasCosts && (
          <section style={{ background: colors.bgSuccess, border: `1px solid ${colors.successBorder}`, borderRadius: 14, padding: spacing[20], marginTop: spacing[16] }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.success, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>💰 Cost breakdown</h3>
              <span style={{ fontSize: 11, color: colors.textTertiary }}>{families} families</span>
            </div>
            <div style={{ marginTop: spacing[12], display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
              {trip.costItems!.map((item, i) => {
                const amt = parseFloat(item.amount) || 0;
                const perFamily = item.splitType === 'total' ? Math.ceil((amt / families) * 100) / 100 : amt;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${colors.bgSuccess}` }}>
                    <div>
                      <div style={{ fontSize: 14, color: colors.textPrimary, fontWeight: 500 }}>{item.label}</div>
                      {item.splitType === 'total' && <div style={{ fontSize: 11, color: colors.textMuted }}>${amt.toFixed(0)} total ÷ {families} families</div>}
                      {item.splitType === 'per-player' && <div style={{ fontSize: 11, color: colors.textMuted }}>Per player</div>}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: colors.success }}>${perFamily.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: spacing[12], padding: pad(spacing[12], spacing[14]), background: colors.bgSuccess, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>Total per family</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: colors.success }}>
                ${trip.costItems!.reduce((sum, item) => {
                  const amt = parseFloat(item.amount) || 0;
                  return sum + (item.splitType === 'total' ? Math.ceil((amt / families) * 100) / 100 : amt);
                }, 0).toFixed(2)}
              </span>
            </div>
          </section>
        )}

        {/* ── Notes — compact amber callout ── */}
        {trip.notes && (
          <section style={{ background: colors.bgWarning, border: `1px solid ${colors.warningBorder}`, borderRadius: 10, padding: pad(spacing[12], spacing[16]), marginTop: spacing[12] }}>
            <div style={{ display: 'flex', gap: spacing[8], alignItems: 'flex-start' }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📝</span>
              <p style={{ fontSize: 13, color: colors.amberDark, lineHeight: 1.5, margin: 0 }}>{trip.notes}</p>
            </div>
          </section>
        )}

        {/* ── Team additions ── */}
        {trip.additions && trip.additions.length > 0 && (
          <section style={{ background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 14, padding: spacing[20], marginTop: spacing[16] }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.textSecondary, margin: 0 }}>👥 From the team <span style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted }}>({trip.additions.length} contribution{trip.additions.length !== 1 ? 's' : ''})</span></h3>
            <div style={{ marginTop: spacing[12], display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
              {trip.additions.map((a, i) => (
                <div key={i} style={{ padding: pad(spacing[10], spacing[12]), background: colors.bgSubtle, borderRadius: 10, border: `1px solid ${colors.borderLight}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[8] }}>
                    {/* Contributor avatar */}
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: colors.bgInfo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: text['2xs'], fontWeight: 700, color: colors.brandDark, flexShrink: 0 }}>
                      {(a.addedBy || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span style={{ fontSize: text['2xs'], fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: a.type === 'restaurant' ? colors.bgSuccess : a.type === 'tip' ? colors.bgInfo : colors.purpleBg, color: a.type === 'restaurant' ? colors.success : a.type === 'tip' ? colors.brand : colors.purple }}>
                      {a.type === 'restaurant' ? '🍴 Restaurant' : a.type === 'tip' ? '💡 Tip' : '📝 Note'}
                    </span>
                    <span style={{ fontSize: text['2xs'], color: colors.textMuted }}>{a.addedBy}</span>
                  </div>
                  <p style={{ fontSize: 13, color: colors.textPrimary, marginTop: 4, lineHeight: 1.4, margin: 0 }}>{a.text}</p>
                  {a.cost && <p style={{ fontSize: 12, color: colors.success, fontWeight: 600, marginTop: 2, margin: 0 }}>💲 {a.cost}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Add to trip ── */}
        {trip.collaborative !== false && (
          <section style={{ marginTop: spacing[16] }}>
            {!showAddForm ? (
              <button onClick={() => setShowAddForm(true)} style={{ width: '100%', padding: pad(spacing[14], 0), fontSize: 14, fontWeight: 600, color: colors.brand, background: colors.bgInfo, border: `1px dashed ${colors.brandLight}`, borderRadius: 12, cursor: 'pointer' }}>
                + Add a restaurant, tip, or note for the team
              </button>
            ) : (
              <div style={{ background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 14, padding: spacing[16] }}>
                <div style={{ display: 'flex', gap: spacing[6], marginBottom: spacing[12] }}>
                  {(['restaurant', 'tip', 'note'] as const).map(t => (
                    <button key={t} onClick={() => setAddType(t)} style={{ fontSize: 12, fontWeight: 600, padding: pad(spacing[5], spacing[12]), borderRadius: 8, background: addType === t ? colors.textPrimary : colors.borderLight, color: addType === t ? colors.textInverse : colors.textTertiary, border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}>{t === 'restaurant' ? '🍴 Restaurant' : t === 'tip' ? '💡 Tip' : '📝 Note'}</button>
                  ))}
                </div>
                <input value={addText} onChange={(e) => setAddText(e.target.value)} placeholder={addType === 'restaurant' ? 'Restaurant name and location' : addType === 'tip' ? 'Your tip for the team' : 'Your note'} style={{ width: '100%', padding: pad(spacing[10], spacing[14]), fontSize: 14, border: `1px solid ${colors.borderMedium}`, borderRadius: 10, outline: 'none', boxSizing: 'border-box' }} />
                {addType === 'restaurant' && <input value={addCost} onChange={(e) => setAddCost(e.target.value)} placeholder="💲 Cost (e.g. ~$15/person)" style={{ width: '100%', padding: pad(spacing[8], spacing[14]), fontSize: 13, border: `1px solid ${colors.borderMedium}`, borderRadius: 10, outline: 'none', boxSizing: 'border-box', marginTop: spacing[6] }} />}
                <div style={{ display: 'flex', gap: spacing[8], justifyContent: 'flex-end', marginTop: spacing[10] }}>
                  <button onClick={() => { setShowAddForm(false); setAddText(''); setAddCost(''); }} style={{ fontSize: 13, color: colors.textTertiary, background: 'none', border: `1px solid ${colors.borderDefault}`, borderRadius: 8, padding: pad(spacing[6], spacing[14]), cursor: 'pointer' }}>Cancel</button>
                  <button onClick={submitAddition} disabled={!addText.trim()} style={{ fontSize: 13, fontWeight: 600, color: colors.textInverse, background: addText.trim() ? colors.textPrimary : colors.textDisabled, border: 'none', borderRadius: 8, padding: pad(spacing[6], spacing[14]), cursor: 'pointer' }}>Add</button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Delete trip ── */}
        <section style={{ marginTop: spacing[24], textAlign: 'center' }}>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                fontSize: 12, color: colors.error, background: 'none',
                border: 'none', cursor: 'pointer', padding: pad(spacing[8], spacing[16]),
                opacity: 0.7,
              }}
            >
              Delete this trip
            </button>
          ) : (
            <div style={{
              background: colors.bgError, border: `1px solid ${colors.error}`,
              borderRadius: 12, padding: spacing[16], textAlign: 'left',
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: colors.error, margin: 0 }}>
                Delete this trip?
              </p>
              <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 6, marginBottom: 0 }}>
                Anyone with the shared link will see &ldquo;Trip not found&rdquo;.
              </p>
              <div style={{ display: 'flex', gap: spacing[8], justifyContent: 'flex-end', marginTop: spacing[12] }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    fontSize: 13, color: colors.textTertiary, background: 'none',
                    border: `1px solid ${colors.borderDefault}`, borderRadius: 8,
                    padding: pad(spacing[6], spacing[14]), cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const trips = storage.getTrips();
                    delete trips[tripId];
                    storage.setTrips(trips);
                    apiDelete('/trips/schedule', { trip_id: tripId }).catch(() => {});
                    router.push('/trips');
                  }}
                  style={{
                    fontSize: 13, fontWeight: 600, color: colors.textInverse,
                    background: colors.error, border: 'none', borderRadius: 8,
                    padding: pad(spacing[6], spacing[14]), cursor: 'pointer',
                  }}
                >
                  Yes, delete
                </button>
              </div>
            </div>
          )}
        </section>

        {/* End of conditional full trip content */}
        </>)}

        {/* Footer */}
        <footer style={{ marginTop: spacing[32], textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: colors.textMuted }}>Built with <button onClick={() => router.push('/')} style={{ color: colors.brand, cursor: 'pointer', fontWeight: 600, background: 'none', border: 'none', padding: 0, font: 'inherit' }}>ColdStart Hockey</button> — rink intel from hockey parents</p>
        </footer>
      </main>
    </div>
  );
}
