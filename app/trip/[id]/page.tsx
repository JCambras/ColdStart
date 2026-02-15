'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getVibe } from '../../../app/vibe';
import { Logo } from '../../../components/Logo';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

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

interface RinkSummary { verdict: string; signals: { signal: string; value: number; count: number; confidence: number }[]; tips: { text: string; contributor_type: string }[]; }

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

function getBarColor(v: number) { return v >= 3.5 ? '#16a34a' : v >= 2.5 ? '#f59e0b' : '#ef4444'; }
function getVerdictColor(v: string) { return v.includes('Good') ? '#16a34a' : v.includes('Mixed') ? '#d97706' : '#6b7280'; }

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [summary, setSummary] = useState<RinkSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'restaurant' | 'tip' | 'note'>('restaurant');
  const [addText, setAddText] = useState('');
  const [addCost, setAddCost] = useState('');
  // Post-trip rating
  const [showRatePrompt, setShowRatePrompt] = useState(false);
  const [rateSubmitted, setRateSubmitted] = useState(false);
  const [isGlancer, setIsGlancer] = useState(false);
  const [showFullTrip, setShowFullTrip] = useState(false);

  // Log vibe events
  useEffect(() => {
    const v = getVibe();
    v.log('page_view', { path: `/trip/${tripId}` });
    v.log('trip_page_view', { tripId });
    setIsGlancer(v.isSharedLinkGlancer || v.is('glancer'));
  }, [tripId]);

  useEffect(() => {
    try {
      const trips = JSON.parse(localStorage.getItem('coldstart_trips') || '{}');
      const t = trips[tripId];
      if (t) {
        setTrip(t);
        // Check if trip is in the past (show rate prompt)
        if (t.dates) {
          const now = new Date();
          const dateStr = t.dates.replace(/.*?(\w+ \d+).*/, '$1');
          const tripEnd = new Date(dateStr);
          if (tripEnd < now && !t.rated) setShowRatePrompt(true);
        }
        fetch(`${API}/rinks/${t.rink.id}`)
          .then(r => r.json())
          .then(d => { if (d.data?.summary) setSummary(d.data.summary); })
          .catch(() => {});
      }
    } catch {}
    setLoading(false);
  }, [tripId]);

  function submitAddition() {
    if (!addText.trim() || !trip) return;
    const user = JSON.parse(localStorage.getItem('coldstart_current_user') || '{}');
    const addition: Addition = { type: addType, text: addText.trim(), cost: addCost.trim() || undefined, addedBy: user.name || 'Team parent', createdAt: new Date().toISOString() };
    const updated = { ...trip, additions: [...(trip.additions || []), addition] };
    setTrip(updated);
    const trips = JSON.parse(localStorage.getItem('coldstart_trips') || '{}');
    trips[tripId] = updated;
    localStorage.setItem('coldstart_trips', JSON.stringify(trips));
    setAddText(''); setAddCost(''); setShowAddForm(false);
  }

  function dismissRatePrompt() {
    setShowRatePrompt(false);
    if (trip) {
      const updated = { ...trip, rated: true };
      const trips = JSON.parse(localStorage.getItem('coldstart_trips') || '{}');
      trips[tripId] = updated;
      localStorage.setItem('coldstart_trips', JSON.stringify(trips));
    }
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, sans-serif" }}><div style={{ color: '#9ca3af', fontSize: 13 }}>Loading trip...</div></div>;

  if (!trip) return (
    <div style={{ minHeight: '100vh', background: '#fafbfc', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Trip not found</h2>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>This trip page may have been created on another device.</p>
        <button onClick={() => router.push('/')} style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: '#0ea5e9', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Go to ColdStart Hockey →</button>
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
    <div style={{ minHeight: '100vh', background: '#fafbfc', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 100%)', padding: '32px 24px 28px', color: '#fff' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.8, marginBottom: 8 }}>GAME DAY INFO</div>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>🏒 {trip.teamName}</h1>
          <p style={{ fontSize: 16, fontWeight: 500, marginTop: 6, opacity: 0.9 }}>at {trip.rink.name}</p>
          {trip.dates && <p style={{ fontSize: 14, marginTop: 4, opacity: 0.75 }}>📅 {trip.dates}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => {
              const url = window.location.href;
              const text = `${trip.teamName} at ${trip.rink.name}${trip.dates ? ' — ' + trip.dates : ''}\n\nGame day info: ${url}`;
              const canShare = typeof navigator.share === 'function';
              getVibe().log('trip_share', { tripId, rinkId: trip.rink.id, method: canShare ? 'native' : 'clipboard' });
              if (canShare) { navigator.share({ title: `${trip.teamName} — Game Day`, text, url }).catch(() => {}); }
              else { navigator.clipboard.writeText(text).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }).catch(() => {}); }
            }} style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
              {shareCopied ? '✓ Copied!' : '📤 Share with team'}
            </button>
            <button onClick={() => router.push('/trips')} style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
              📁 My trips
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px 60px' }}>

        {/* ── Glancer Quick View — essentials pinned above fold ── */}
        {isGlancer && !showFullTrip && (
          <>
            <section style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
              padding: 20, marginTop: -16, position: 'relative', zIndex: 5,
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}>
              {/* Address */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 18 }}>📍</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{trip.rink.name}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{trip.rink.city}, {trip.rink.state}</div>
                </div>
              </div>

              {/* Next game time */}
              {hasGames && trip.games![0] && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 12px', background: '#f0f9ff', borderRadius: 10 }}>
                  <span style={{ fontSize: 18 }}>🕐</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                      {trip.games![0].day ? `${trip.games![0].day} ` : ''}{trip.games![0].time || 'TBD'}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: parking.value >= 3.5 ? '#f0fdf4' : parking.value >= 2.5 ? '#fffbeb' : '#fef2f2', borderRadius: 10, border: `1px solid ${parking.value >= 3.5 ? '#bbf7d0' : parking.value >= 2.5 ? '#fde68a' : '#fecaca'}` }}>
                    <span style={{ fontSize: 18 }}>🅿️</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: getBarColor(parking.value) }}>
                        Parking: {parking.value >= 3.5 ? 'Easy' : parking.value >= 2.5 ? 'Tight' : 'Tough'} ({parking.value.toFixed(1)}/5)
                      </div>
                      {summary.tips?.[0] && summary.tips[0].text.toLowerCase().includes('park') && (
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, fontStyle: 'italic' }}>
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
                  <div style={{ marginTop: 10, padding: '8px 12px', background: '#eff6ff', borderRadius: 8, borderLeft: '3px solid #3b82f6', fontSize: 12, color: '#1e40af' }}>
                    🚪 <strong>Entrance:</strong> {note}
                  </div>
                );
              })()}
            </section>

            {/* Show full trip button */}
            <button
              onClick={() => setShowFullTrip(true)}
              style={{
                width: '100%', marginTop: 12, padding: '12px 0',
                fontSize: 13, fontWeight: 600, color: '#0ea5e9',
                background: '#f0f9ff', border: '1px solid #bae6fd',
                borderRadius: 10, cursor: 'pointer',
              }}
            >
              See full trip details ({hasGames ? `${trip.games!.length} game${trip.games!.length !== 1 ? 's' : ''}` : ''}{trip.hotel ? ', hotel' : ''}{hasCosts ? ', costs' : ''}) ↓
            </button>

            {/* Soft CTA for conversion */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <p style={{ fontSize: 12, color: '#9ca3af' }}>
                📍 Want rink intel for your next away game?{' '}
                <span onClick={() => router.push('/')} style={{ color: '#0ea5e9', cursor: 'pointer', fontWeight: 600 }}>See how ColdStart Hockey works →</span>
              </p>
            </div>
          </>
        )}

        {/* ── Full trip content (always shown for non-glancers, expandable for glancers) ── */}
        {(!isGlancer || showFullTrip) && (<>

        {/* ── Post-trip rating prompt ── */}
        {showRatePrompt && !rateSubmitted && (
          <section style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: 16, marginTop: -16, position: 'relative', zIndex: 5, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>How was {trip.rink.name}?</div>
                <div style={{ fontSize: 12, color: '#a16207', marginTop: 2 }}>Help the next team — rate your experience in 30 seconds</div>
              </div>
              <button onClick={() => dismissRatePrompt()} style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>Dismiss</button>
            </div>
            <button onClick={() => { dismissRatePrompt(); router.push(`/rinks/${trip.rink.id}`); }} style={{
              marginTop: 10, width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 700,
              background: '#d97706', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
            }}>
              ⭐ Rate {trip.rink.name} →
            </button>
          </section>
        )}

        {/* ── Rink Verdict Card ── */}
        {summary && (
          <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginTop: showRatePrompt && !rateSubmitted ? 12 : -16, position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Rink report</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: getVerdictColor(summary.verdict), marginTop: 4 }}>{summary.verdict}</div>
              </div>
              <button onClick={() => router.push(`/rinks/${trip.rink.id}`)} style={{ fontSize: 11, fontWeight: 600, color: '#0ea5e9', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Full report →</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {topSignals.map(sig => {
                const meta = SIGNAL_META[sig.signal] || { label: sig.signal, icon: '' };
                return (
                  <div key={sig.signal} style={{ padding: '6px 10px', borderRadius: 8, background: sig.value >= 3.5 ? '#f0fdf4' : sig.value >= 2.5 ? '#fffbeb' : '#fef2f2', border: `1px solid ${sig.value >= 3.5 ? '#bbf7d0' : sig.value >= 2.5 ? '#fde68a' : '#fecaca'}`, fontSize: 12 }}>
                    <span>{meta.icon}</span> <span style={{ fontWeight: 600, color: getBarColor(sig.value) }}>{sig.value.toFixed(1)}</span> <span style={{ color: '#6b7280' }}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
            {summary.tips?.[0] && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#f0f9ff', borderRadius: 8, borderLeft: '3px solid #0ea5e9', fontSize: 12, color: '#374151', fontStyle: 'italic' }}>
                💡 &ldquo;{summary.tips[0].text}&rdquo;
              </div>
            )}
          </section>
        )}

        {/* ── Game Schedule ── */}
        {hasGames && (
          <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginTop: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>🕐 Game schedule</h3>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trip.games!.map((game, i) => {
                const sheetKey = game.sheet ? (game.sheet.startsWith('Rink') ? game.sheet : `Rink ${game.sheet}`) : '';
                const entranceNote = sheetKey ? sheetNotes[sheetKey] : null;
                return (
                  <div key={i} style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ minWidth: 52, textAlign: 'center' }}>
                        {game.day && <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{game.day}</div>}
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{game.time || 'TBD'}</div>
                      </div>
                      <div style={{ width: 1, height: 32, background: '#e5e7eb' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                          vs. {game.opponent || 'TBD'}
                          {game.sheet && <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 6 }}>· {game.sheet.startsWith('Rink') || game.sheet.startsWith('Sheet') ? game.sheet : `Sheet ${game.sheet}`}</span>}
                        </div>
                        {game.note && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{game.note}</div>}
                      </div>
                    </div>
                    {/* Entrance note for multi-sheet rinks */}
                    {entranceNote && (
                      <div style={{ marginTop: 8, padding: '6px 10px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 11, color: '#1e40af' }}>
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
          <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginTop: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>🕐 Game times</h3>
            <div style={{ marginTop: 12, fontSize: 14, color: '#111827', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{trip.gameTimes}</div>
          </section>
        )}

        {/* ── Lodging & Food (consolidated) ── */}
        {(trip.hotel || trip.lunch || trip.dinner) && (
          <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginTop: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>🏨 Lodging & food</h3>
            {trip.hotel && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>WHERE WE&apos;RE STAYING</div>
                <p style={{ fontSize: 14, color: '#111827', marginTop: 4, lineHeight: 1.5, margin: 0 }}>{trip.hotel}</p>
                {trip.hotelCost && <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 2, margin: 0 }}>💲 {trip.hotelCost}</p>}
              </div>
            )}
            {trip.lunch && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>LUNCH</div>
                <p style={{ fontSize: 14, color: '#111827', marginTop: 4, margin: 0 }}>{trip.lunch}</p>
                {trip.lunchCost && <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 2, margin: 0 }}>💲 {trip.lunchCost}</p>}
              </div>
            )}
            {trip.dinner && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>DINNER</div>
                <p style={{ fontSize: 14, color: '#111827', marginTop: 4, margin: 0 }}>{trip.dinner}</p>
                {trip.dinnerCost && <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 2, margin: 0 }}>💲 {trip.dinnerCost}</p>}
              </div>
            )}
          </section>
        )}

        {/* ── Cost Breakdown ── */}
        {hasCosts && (
          <section style={{ background: '#fafff8', border: '1px solid #bbf7d0', borderRadius: 14, padding: 20, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>💰 Cost breakdown</h3>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{families} families</span>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {trip.costItems!.map((item, i) => {
                const amt = parseFloat(item.amount) || 0;
                const perFamily = item.splitType === 'total' ? Math.ceil((amt / families) * 100) / 100 : amt;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0fdf4' }}>
                    <div>
                      <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{item.label}</div>
                      {item.splitType === 'total' && <div style={{ fontSize: 11, color: '#9ca3af' }}>${amt.toFixed(0)} total ÷ {families} families</div>}
                      {item.splitType === 'per-player' && <div style={{ fontSize: 11, color: '#9ca3af' }}>Per player</div>}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>${perFamily.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12, padding: '12px 14px', background: '#f0fdf4', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Total per family</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>
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
          <section style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginTop: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📝</span>
              <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5, margin: 0 }}>{trip.notes}</p>
            </div>
          </section>
        )}

        {/* ── Team additions ── */}
        {trip.additions && trip.additions.length > 0 && (
          <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: 0 }}>👥 From the team <span style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af' }}>({trip.additions.length} contribution{trip.additions.length !== 1 ? 's' : ''})</span></h3>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trip.additions.map((a, i) => (
                <div key={i} style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Contributor avatar */}
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0369a1', flexShrink: 0 }}>
                      {(a.addedBy || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: a.type === 'restaurant' ? '#f0fdf4' : a.type === 'tip' ? '#f0f9ff' : '#f5f3ff', color: a.type === 'restaurant' ? '#16a34a' : a.type === 'tip' ? '#0ea5e9' : '#7c3aed' }}>
                      {a.type === 'restaurant' ? '🍴 Restaurant' : a.type === 'tip' ? '💡 Tip' : '📝 Note'}
                    </span>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>{a.addedBy}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#111827', marginTop: 4, lineHeight: 1.4, margin: 0 }}>{a.text}</p>
                  {a.cost && <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 2, margin: 0 }}>💲 {a.cost}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Add to trip ── */}
        {trip.collaborative !== false && (
          <section style={{ marginTop: 16 }}>
            {!showAddForm ? (
              <button onClick={() => setShowAddForm(true)} style={{ width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 600, color: '#0ea5e9', background: '#f0f9ff', border: '1px dashed #bae6fd', borderRadius: 12, cursor: 'pointer' }}>
                + Add a restaurant, tip, or note for the team
              </button>
            ) : (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {(['restaurant', 'tip', 'note'] as const).map(t => (
                    <button key={t} onClick={() => setAddType(t)} style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: addType === t ? '#111827' : '#f1f5f9', color: addType === t ? '#fff' : '#6b7280', border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}>{t === 'restaurant' ? '🍴 Restaurant' : t === 'tip' ? '💡 Tip' : '📝 Note'}</button>
                  ))}
                </div>
                <input value={addText} onChange={(e) => setAddText(e.target.value)} placeholder={addType === 'restaurant' ? 'Restaurant name and location' : addType === 'tip' ? 'Your tip for the team' : 'Your note'} style={{ width: '100%', padding: '10px 14px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }} />
                {addType === 'restaurant' && <input value={addCost} onChange={(e) => setAddCost(e.target.value)} placeholder="💲 Cost (e.g. ~$15/person)" style={{ width: '100%', padding: '8px 14px', fontSize: 13, border: '1px solid #d1d5db', borderRadius: 10, outline: 'none', boxSizing: 'border-box', marginTop: 6 }} />}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button onClick={() => { setShowAddForm(false); setAddText(''); setAddCost(''); }} style={{ fontSize: 13, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={submitAddition} disabled={!addText.trim()} style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: addText.trim() ? '#111827' : '#d1d5db', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>Add</button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* End of conditional full trip content */}
        </>)}

        {/* Footer */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#9ca3af' }}>Built with <span onClick={() => router.push('/')} style={{ color: '#0ea5e9', cursor: 'pointer', fontWeight: 600 }}>ColdStart Hockey</span> — rink intel from hockey parents</p>
        </div>
      </div>
    </div>
  );
}
