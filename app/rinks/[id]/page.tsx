'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';


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
  context?: string;
  created_at: string;
}
interface RinkSummary {
  rink_id: string;
  verdict: string;
  signals: Signal[];
  tips: Tip[];
  evidence_counts: Record<string, number>;
  contribution_count: number;
  last_updated_at: string | null;
  confirmed_this_season: boolean;
}
interface Rink {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}
interface RinkDetail {
  rink: Rink;
  summary: RinkSummary;
}

const API = 'http://localhost:8080/api/v1';

const SIGNAL_META: Record<string, { label: string; icon: string; lowLabel: string; highLabel: string; info: string }> = {
  cold: { label: 'Cold factor', icon: '❄️', lowLabel: 'Warm', highLabel: 'Freezing', info: 'How cold is the rink? Higher means the ice stays hard and the arena runs cold — great for players, bring a blanket for spectators.' },
  parking: { label: 'Parking', icon: '🅿️', lowLabel: 'Tough', highLabel: 'Easy', info: 'How easy is it to find parking? Accounts for lot size, overflow options, and how bad it gets during tournaments.' },
  food_nearby: { label: 'Food nearby', icon: '🍔', lowLabel: 'None', highLabel: 'Plenty', info: 'Are there food options near the rink? Includes snack bars inside, restaurants within walking distance, and drive-throughs nearby.' },
  chaos: { label: 'Chaos level', icon: '🌀', lowLabel: 'Calm', highLabel: 'Wild', info: 'How hectic is the rink? Factors in lobby crowding, confusing layouts, overlapping game times, and general noise level.' },
  family_friendly: { label: 'Family friendly', icon: '👨‍👩‍👧', lowLabel: 'Not great', highLabel: 'Great', info: 'How welcoming is this rink for families with younger kids? Considers seating, bathrooms, play areas, and overall vibe.' },
  locker_rooms: { label: 'Locker rooms', icon: '🚪', lowLabel: 'Tight', highLabel: 'Spacious', info: 'Are the locker rooms big enough for a full team with bags? Separate ref room? Clean, well-lit, and accessible?' },
  pro_shop: { label: 'Pro shop', icon: '🏒', lowLabel: 'None', highLabel: 'Stocked', info: 'Does the rink have a pro shop? Covers tape, laces, skate sharpening, and emergency gear availability on game day.' },
};

type SignalType = 'cold' | 'parking' | 'chaos' | 'food_nearby' | 'family_friendly' | 'locker_rooms' | 'pro_shop';
type ContributorType = 'local_parent' | 'visiting_parent';

const SIGNAL_OPTIONS: { key: SignalType; label: string; icon: string }[] = [
  { key: 'parking', label: 'Parking', icon: '🅿️' },
  { key: 'cold', label: 'Cold', icon: '❄️' },
  { key: 'food_nearby', label: 'Food', icon: '🍔' },
  { key: 'chaos', label: 'Chaos', icon: '🌀' },
  { key: 'family_friendly', label: 'Family', icon: '👨‍👩‍👧' },
  { key: 'locker_rooms', label: 'Lockers', icon: '🚪' },
  { key: 'pro_shop', label: 'Pro shop', icon: '🏒' },
];

function getVerdictColor(verdict: string) {
  if (verdict.includes('Good')) return '#16a34a';
  if (verdict.includes('Heads up')) return '#d97706';
  if (verdict.includes('Mixed')) return '#ea580c';
  return '#6b7280';
}

function getVerdictBg(verdict: string) {
  if (verdict.includes('Good')) return '#f0fdf4';
  if (verdict.includes('Heads up')) return '#fffbeb';
  if (verdict.includes('Mixed')) return '#fff7ed';
  return '#f9fafb';
}

function getBarColor(value: number) {
  if (value >= 3.5) return '#16a34a';
  if (value >= 2.5) return '#f59e0b';
  return '#ef4444';
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Multi-sheet rink entrance/navigation notes
// Seeded facility details per signal — rink manager notes
const FACILITY_DETAILS: Record<string, Record<string, { text: string; name: string }>> = {
  'ice-line': {
    parking: { text: "200 spots in main lot + 30 overflow behind Building C. Free parking always.", name: "Kevin M." },
    cold: { text: "We keep the arena at 55°F. Heated viewing room available upstairs for families.", name: "Kevin M." },
    family_friendly: { text: "New family seating section installed this season with wider seats and cup holders. Family restroom on the ground floor.", name: "Kevin M." },
    food_nearby: { text: "Sal's Pizza next door gives our families 10% off. Vending machines inside with hot chocolate.", name: "Kevin M." },
    locker_rooms: { text: "Full-size rooms for home and away, separate ref room. Rubber flooring installed this season. Each room fits 20 players with bags.", name: "Kevin M." },
    pro_shop: { text: "Full pro shop on-site — tape, laces, skate sharpening while you wait. Open during all ice times.", name: "Kevin M." },
  },
};

// Ensure all 6 signals exist for demo rinks — in production the API returns all
const SEEDED_SIGNALS: Record<string, Record<string, { value: number; count: number; confidence: number }>> = {
  'bww': {
    family_friendly: { value: 4.8, count: 32, confidence: 0.85 },
    locker_rooms: { value: 3.2, count: 18, confidence: 0.6 },
    pro_shop: { value: 3.9, count: 14, confidence: 0.5 },
  },
  'ice-line': {
    family_friendly: { value: 4.5, count: 28, confidence: 0.8 },
    locker_rooms: { value: 4.6, count: 22, confidence: 0.75 },
    pro_shop: { value: 4.7, count: 20, confidence: 0.7 },
  },
  'proskate': {
    family_friendly: { value: 3.8, count: 15, confidence: 0.55 },
    locker_rooms: { value: 2.4, count: 10, confidence: 0.4 },
    pro_shop: { value: 1.8, count: 8, confidence: 0.35 },
  },
};

function ensureAllSignals(signals: Signal[], rinkSlug: string): Signal[] {
  const allKeys = ['parking', 'cold', 'food_nearby', 'chaos', 'family_friendly', 'locker_rooms', 'pro_shop'];
  const existing = new Set(signals.map(s => s.signal));
  const seeded = SEEDED_SIGNALS[rinkSlug] || {};
  const result = [...signals];
  for (const key of allKeys) {
    if (!existing.has(key) && seeded[key]) {
      result.push({ signal: key, ...seeded[key] });
    }
  }
  return result;
}

// Streaming info per rink
const RINK_STREAMING: Record<string, { type: 'livebarn' | 'blackbear' | 'none'; url?: string }> = {
  'ice-line': { type: 'livebarn', url: 'https://www.livebarn.com/en/videoplayer/ice-line-quad-rinks' },
  'bww': { type: 'livebarn', url: 'https://www.livebarn.com/en/videoplayer/brewster-wheeler-works' },
  'iceworks': { type: 'blackbear', url: 'https://www.blackbeartv.com/arena/iceworks-skating-complex' },
  'virtua': { type: 'livebarn', url: 'https://www.livebarn.com/en/videoplayer/virtua-center-flyers-skate-zone' },
  'proskate': { type: 'none' },
  'hatfield': { type: 'none' },
};

// Home teams per rink
const RINK_HOME_TEAMS: Record<string, string[]> = {
  'ice-line': ['Ice Line Revolution', 'West Chester Storm'],
  'bww': ['BWW Icehawks', 'Detroit Jr. Vipers'],
  'iceworks': ['Aston Rebels', 'Delaware Valley Eagles'],
  'virtua': ['Flyers Skate Zone Warriors', 'South Jersey Bandits'],
  'proskate': ['Central Jersey Cobras'],
  'hatfield': ['Hatfield Ice Dogs'],
};

// ── Signal Bar (compact, expandable on click) ──
function SignalBar({ signal, rinkSlug }: { signal: Signal; rinkSlug: string }) {
  const meta = SIGNAL_META[signal.signal] || { label: signal.signal, icon: '', lowLabel: '1', highLabel: '5', info: '' };
  const pct = Math.round(((signal.value - 1) / 4) * 100);
  const color = getBarColor(signal.value);
  const opacity = 0.3 + signal.confidence * 0.7;
  const [expanded, setExpanded] = useState(false);
  const facilityDetail = FACILITY_DETAILS[rinkSlug]?.[signal.signal];

  return (
    <div
      style={{ padding: '14px 0', cursor: 'pointer' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
            {meta.icon} {meta.label}
          </span>
          <span style={{
            fontSize: 10, color: '#9ca3af',
            transform: expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s', display: 'inline-block',
          }}>
            ▸
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color }}>{signal.value.toFixed(1)}</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>/5</span>
        </div>
      </div>
      <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 5,
          background: color,
          opacity,
          transition: 'width 0.8s ease, opacity 0.4s ease',
        }} />
      </div>
      {!expanded && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>{meta.lowLabel}</span>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>
            {signal.count} rating{signal.count !== 1 ? 's' : ''} · {Math.round(signal.confidence * 100)}% confident
          </span>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>{meta.highLabel}</span>
        </div>
      )}
      {expanded && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>← {meta.lowLabel}</span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>
              {signal.count} rating{signal.count !== 1 ? 's' : ''} · {Math.round(signal.confidence * 100)}% confident
            </span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{meta.highLabel} →</span>
          </div>
          {meta.info && (
            <div style={{
              fontSize: 12, color: '#6b7280', lineHeight: 1.5,
              background: '#f8fafc', border: '1px solid #e5e7eb',
              borderRadius: 8, padding: '8px 12px', marginTop: 4,
            }}>
              {meta.info}
            </div>
          )}
          {facilityDetail && (
            <div style={{
              marginTop: 6, padding: '8px 12px',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 8, borderLeft: '3px solid #3b82f6',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                <span style={{
                  fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                  background: '#3b82f6', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  Verified
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#1e40af' }}>
                  {facilityDetail.name}, Rink Manager
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#1e40af', lineHeight: 1.4, margin: 0 }}>
                {facilityDetail.text}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Seeded manager responses — in production these come from the API
const MANAGER_RESPONSES: Record<string, Record<number, { text: string; name: string; role: string }>> = {
  // Ice Line tips get responses from Kevin
  'ice-line': {
    0: { text: "We added 30 overflow spots behind Building C this season. Should help on tournament weekends!", name: "Kevin M.", role: "Rink Manager" },
    1: { text: "Great tip! We also have the heated viewing room upstairs if the bleachers are too cold.", name: "Kevin M.", role: "Rink Manager" },
  },
};

// ── Tip Card — compact, expandable for details ──
function TipCard({ tip, tipIndex, rinkSlug, isLoggedIn, onAuthRequired }: { tip: Tip; tipIndex: number; rinkSlug: string; isLoggedIn: boolean; onAuthRequired: () => void }) {
  const isLocal = tip.contributor_type === 'local_parent';
  const response = MANAGER_RESPONSES[rinkSlug]?.[tipIndex];
  const [expanded, setExpanded] = useState(false);

  // Voting state — stored in localStorage keyed by rink+tipIndex
  const voteKey = `coldstart_tip_vote_${rinkSlug}_${tipIndex}`;
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(voteKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserVote(parsed.vote);
        setScore(parsed.score);
      } else {
        // Seed some initial scores for demo
        const seeded = (tipIndex === 0 ? 12 : tipIndex === 1 ? 8 : tipIndex === 2 ? 5 : Math.floor(Math.random() * 6) + 1);
        setScore(seeded);
      }
    } catch { }
  }, [voteKey, tipIndex]);

  function handleVote(direction: 'up' | 'down', e: React.MouseEvent) {
    e.stopPropagation();
    if (!isLoggedIn) { onAuthRequired(); return; }

    let newVote: 'up' | 'down' | null = direction;
    let newScore = score;

    if (userVote === direction) {
      // Undo vote
      newVote = null;
      newScore += direction === 'up' ? -1 : 1;
    } else if (userVote === null) {
      newScore += direction === 'up' ? 1 : -1;
    } else {
      // Switching vote
      newScore += direction === 'up' ? 2 : -2;
    }

    setUserVote(newVote);
    setScore(newScore);
    localStorage.setItem(voteKey, JSON.stringify({ vote: newVote, score: newScore }));
  }

  return (
    <div
      style={{
        padding: '10px 14px',
        background: '#fff',
        border: '1px solid #f1f5f9',
        borderRadius: 10,
        marginBottom: 6,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f1f5f9'; }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Vote buttons */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 0, flexShrink: 0, minWidth: 28,
        }}>
          <button
            onClick={(e) => handleVote('up', e)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
              fontSize: 14, lineHeight: 1,
              color: userVote === 'up' ? '#0ea5e9' : '#d1d5db',
              transition: 'color 0.15s',
            }}
            title="Helpful"
          >▲</button>
          <span style={{
            fontSize: 12, fontWeight: 700, lineHeight: 1,
            color: score > 0 ? '#111827' : score < 0 ? '#ef4444' : '#9ca3af',
          }}>{score}</span>
          <button
            onClick={(e) => handleVote('down', e)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
              fontSize: 14, lineHeight: 1,
              color: userVote === 'down' ? '#ef4444' : '#d1d5db',
              transition: 'color 0.15s',
            }}
            title="Not helpful"
          >▼</button>
        </div>

        {/* Tip content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, margin: 0, flex: 1 }}>
              &ldquo;{tip.text}&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {response && <span style={{ fontSize: 10, color: '#3b82f6' }}>💬</span>}
              <span style={{
                fontSize: 10, color: '#9ca3af',
                transform: expanded ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s', display: 'inline-block',
              }}>
                ▸
              </span>
            </div>
          </div>
          {expanded && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{
                  fontSize: 10, fontWeight: 500, padding: '2px 8px',
                  borderRadius: 10,
                  background: isLocal ? '#eff6ff' : '#faf5ff',
                  color: isLocal ? '#2563eb' : '#7c3aed',
                }}>
                  {isLocal ? 'Plays here regularly' : 'Visiting parent'}
                </span>
                {tip.context && (
                  <span style={{
                    fontSize: 10, fontWeight: 500, padding: '2px 8px',
                    borderRadius: 10,
                    background: tip.context === 'tournament' ? '#fffbeb' : '#f0fdf4',
                    color: tip.context === 'tournament' ? '#d97706' : '#16a34a',
                  }}>
                    {tip.context === 'tournament' ? '🏆 Tournament' : '📅 Regular season'}
                  </span>
                )}
                <span style={{ fontSize: 10, color: '#9ca3af' }}>{timeAgo(tip.created_at)}</span>
              </div>
              {response && (
                <div style={{
                  marginTop: 8, padding: '8px 10px',
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  borderRadius: 8, borderLeft: '3px solid #3b82f6',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                      background: '#3b82f6', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>
                      Verified
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#1e40af' }}>{response.name}</span>
                    <span style={{ fontSize: 10, color: '#6b7280' }}>· {response.role}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.45, margin: 0 }}>
                    {response.text}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Visitor/Regular Toggle (stores preference in localStorage) ──
function VisitorToggle() {
  const [type, setType] = useState<'visiting_parent' | 'local_parent'>('visiting_parent');

  useEffect(() => {
    const saved = localStorage.getItem('coldstart_contributor_type');
    if (saved === 'local_parent' || saved === 'visiting_parent') setType(saved);
  }, []);

  function toggle() {
    const next = type === 'visiting_parent' ? 'local_parent' : 'visiting_parent';
    setType(next);
    localStorage.setItem('coldstart_contributor_type', next);
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {([['visiting_parent', '✈️ Visiting'], ['local_parent', '🏠 Regular']] as const).map(([val, label]) => (
        <button
          key={val}
          onClick={toggle}
          style={{
            fontSize: 12, fontWeight: type === val ? 600 : 400,
            padding: '5px 12px', borderRadius: 20,
            background: type === val ? (val === 'local_parent' ? '#eff6ff' : '#faf5ff') : 'transparent',
            color: type === val ? (val === 'local_parent' ? '#1d4ed8' : '#7c3aed') : '#9ca3af',
            border: `1px solid ${type === val ? (val === 'local_parent' ? '#bfdbfe' : '#ddd6fe') : 'transparent'}`,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Quick Vote Row — tap emoji, then 1-5 ──
function QuickVoteRow({ rinkId, context, onSummaryUpdate }: { rinkId: string; context: string; onSummaryUpdate: (s: RinkSummary) => void }) {
  const [activeSignal, setActiveSignal] = useState<SignalType | null>(null);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justRated, setJustRated] = useState<string | null>(null);

  const signals: { key: SignalType; icon: string; label: string }[] = [
    { key: 'parking', icon: '🅿️', label: 'Parking' },
    { key: 'cold', icon: '❄️', label: 'Cold' },
    { key: 'food_nearby', icon: '🍔', label: 'Food' },
    { key: 'chaos', icon: '🌀', label: 'Chaos' },
    { key: 'family_friendly', icon: '👨‍👩‍👧', label: 'Family' },
    { key: 'locker_rooms', icon: '🚪', label: 'Lockers' },
    { key: 'pro_shop', icon: '🏒', label: 'Pro shop' },
  ];

  async function submitRating(value: number) {
    if (!activeSignal || submitting) return;
    setSubmitting(true);
    const contributorType = localStorage.getItem('coldstart_contributor_type') || 'visiting_parent';
    try {
      const res = await fetch(`${API}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rink_id: rinkId,
          kind: 'signal_rating',
          contributor_type: contributorType,
          context: context,
          signal_rating: { signal: activeSignal, value },
        }),
      });
      const data = await res.json();
      if (data.data?.summary) onSummaryUpdate(data.data.summary);
      setJustRated(activeSignal);
      setActiveSignal(null);
      setTimeout(() => setJustRated(null), 2000);

    } catch {}
    setSubmitting(false);
  }

  return (
    <div>
      {/* Signal selector row */}
      {!activeSignal && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {signals.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSignal(s.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 14px', borderRadius: 12,
                background: justRated === s.key ? '#f0fdf4' : '#fafbfc',
                border: `1px solid ${justRated === s.key ? '#bbf7d0' : '#e5e7eb'}`,
                cursor: 'pointer', transition: 'all 0.15s',
                minWidth: 64,
              }}
              onMouseEnter={(e) => { if (justRated !== s.key) { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.background = '#f0f9ff'; } }}
              onMouseLeave={(e) => { if (justRated !== s.key) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fafbfc'; } }}
            >
              <span style={{ fontSize: 22 }}>{justRated === s.key ? '✓' : s.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: justRated === s.key ? '#16a34a' : '#6b7280' }}>{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Rating 1-5 when signal is active */}
      {activeSignal && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{SIGNAL_META[activeSignal]?.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
              {SIGNAL_META[activeSignal]?.label}
            </span>
            <button
              onClick={() => setActiveSignal(null)}
              style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4 }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map(v => (
              <button
                key={v}
                onClick={() => submitRating(v)}
                onMouseEnter={() => setHoveredValue(v)}
                onMouseLeave={() => setHoveredValue(null)}
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  border: `1.5px solid ${hoveredValue === v ? '#0ea5e9' : '#e5e7eb'}`,
                  background: hoveredValue === v ? '#f0f9ff' : '#fff',
                  color: '#374151', fontSize: 18, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 280, margin: '6px auto 0', padding: '0 4px' }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>← {SIGNAL_META[activeSignal]?.lowLabel}</span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{SIGNAL_META[activeSignal]?.highLabel} →</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Quick Tip Input — inline, one line ──
function QuickTipInput({ rinkId, context, onSummaryUpdate }: { rinkId: string; context: string; onSummaryUpdate: (s: RinkSummary) => void }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const contributorType = localStorage.getItem('coldstart_contributor_type') || 'visiting_parent';
    try {
      const res = await fetch(`${API}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rink_id: rinkId,
          kind: 'one_thing_tip',
          contributor_type: contributorType,
          context: context,
          one_thing_tip: { text: text.trim() },
        }),
      });
      const data = await res.json();
      if (data.data?.summary) onSummaryUpdate(data.data.summary);
      setText('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {}
    setSubmitting(false);
  }

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
        <span style={{ fontSize: 16 }}>✓</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>Tip added — thanks!</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>💬</span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="One thing parents should know..."
        maxLength={140}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        style={{
          flex: 1, fontSize: 14, padding: '10px 14px',
          border: '1px solid #e5e7eb', borderRadius: 10,
          outline: 'none', fontFamily: 'inherit', color: '#111827',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
      />
      <button
        onClick={submit}
        disabled={!text.trim() || submitting}
        style={{
          fontSize: 13, fontWeight: 600,
          color: text.trim() ? '#fff' : '#9ca3af',
          background: text.trim() ? '#111827' : '#e5e7eb',
          border: 'none', borderRadius: 10, padding: '10px 18px',
          cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'all 0.2s', opacity: submitting ? 0.5 : 1,
        }}
      >
        Add
      </button>
    </div>
  );
}

// ── Contribution Form (inline, 2-step) ──
function ContributeSection({ rinkId, onSummaryUpdate }: { rinkId: string; onSummaryUpdate: (s: RinkSummary) => void }) {
  const [mode, setMode] = useState<'idle' | 'signal' | 'tip'>('idle');
  const [selectedSignal, setSelectedSignal] = useState<SignalType | null>(null);
  const [signalValue, setSignalValue] = useState<number | null>(null);
  const [tipText, setTipText] = useState('');
  const [contributorType, setContributorType] = useState<ContributorType>('visiting_parent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  function reset() {
    setMode('idle');
    setSelectedSignal(null);
    setSignalValue(null);
    setTipText('');
    setError(null);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const body: any = {
      rink_id: rinkId,
      contributor_type: contributorType,
    };

    if (mode === 'signal' && selectedSignal && signalValue) {
      body.kind = 'signal_rating';
      body.signal_rating = { signal: selectedSignal, value: signalValue };
    } else if (mode === 'tip' && tipText.trim()) {
      body.kind = 'one_thing_tip';
      body.one_thing_tip = { text: tipText.trim() };
    } else return;

    try {
      const res = await fetch(`${API}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to submit');
      if (data.data?.summary) onSummaryUpdate(data.data.summary);
      setSuccess(true);
      setTimeout(() => {
        reset();
        setSuccess(false);
      }, 2000);
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (success) {
    return (
      <div style={{
        background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16,
        padding: 28, textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#16a34a', margin: 0 }}>Thanks for sharing!</p>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          The summary has been updated. Your contribution helps the next family headed here.
        </p>
      </div>
    );
  }

  // Idle state — show the two big buttons
  if (mode === 'idle') {
    return (
      <div ref={formRef}>
        <h3 style={{
          fontSize: 13, fontWeight: 600, color: '#9ca3af',
          textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
        }}>
          Share what you know
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setMode('tip')}
            style={{
              flex: 1, padding: '20px 16px', background: '#fff',
              border: '1px solid #e5e7eb', borderRadius: 14, cursor: 'pointer',
              textAlign: 'center', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Drop a tip</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>&ldquo;Park behind building 2&rdquo;</div>
          </button>
          <button
            onClick={() => setMode('signal')}
            style={{
              flex: 1, padding: '20px 16px', background: '#fff',
              border: '1px solid #e5e7eb', borderRadius: 14, cursor: 'pointer',
              textAlign: 'center', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>📊</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Rate a signal</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Parking, cold, food...</div>
          </button>
        </div>
      </div>
    );
  }

  // Active contribution form
  return (
    <div ref={formRef} style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24,
    }}>
      {/* Header with back */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
          {mode === 'signal' ? 'Rate a signal' : 'One thing to know'}
        </h3>
        <button
          onClick={reset}
          style={{
            fontSize: 12, color: '#9ca3af', background: 'none', border: 'none',
            cursor: 'pointer', padding: '4px 8px',
          }}
        >
          ← Back
        </button>
      </div>

      {/* Contributor type — optional, default visiting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          {contributorType === 'visiting_parent' ? "I'm visiting" : 'I play here regularly'}
        </span>
        <button
          onClick={() => setContributorType(contributorType === 'visiting_parent' ? 'local_parent' : 'visiting_parent')}
          style={{
            fontSize: 11, color: '#0ea5e9', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, textDecoration: 'underline',
          }}
        >
          Change
        </button>
      </div>

      {/* Signal mode */}
      {mode === 'signal' && (
        <>
          {/* Step 1: Pick signal */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              {selectedSignal ? '1. Signal' : '1. Pick a signal'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SIGNAL_OPTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => { setSelectedSignal(s.key); setSignalValue(null); }}
                  style={{
                    fontSize: 13, padding: '10px 16px', borderRadius: 12,
                    border: `1.5px solid ${selectedSignal === s.key ? '#0ea5e9' : '#e5e7eb'}`,
                    background: selectedSignal === s.key ? '#f0f9ff' : '#fff',
                    color: selectedSignal === s.key ? '#0ea5e9' : '#374151',
                    cursor: 'pointer', fontWeight: selectedSignal === s.key ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Rate 1-5 */}
          {selectedSignal && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                2. Rate it
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map((v) => {
                  const active = signalValue === v;
                  const hov = hoveredValue === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setSignalValue(v)}
                      onMouseEnter={() => setHoveredValue(v)}
                      onMouseLeave={() => setHoveredValue(null)}
                      style={{
                        width: 52, height: 52, borderRadius: 12,
                        border: `1.5px solid ${active ? '#0ea5e9' : hov ? '#93c5fd' : '#e5e7eb'}`,
                        background: active ? '#0ea5e9' : hov ? '#f0f9ff' : '#fff',
                        color: active ? '#fff' : '#374151',
                        fontSize: 18, fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingLeft: 4, paddingRight: 4 }}>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
                  ← {SIGNAL_META[selectedSignal]?.lowLabel || 'Low'}
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
                  {SIGNAL_META[selectedSignal]?.highLabel || 'High'} →
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tip mode */}
      {mode === 'tip' && (
        <div style={{ marginBottom: 20 }}>
          <textarea
            value={tipText}
            onChange={(e) => setTipText(e.target.value)}
            placeholder="One thing parents should know about this rink..."
            maxLength={140}
            rows={3}
            style={{
              width: '100%', fontSize: 14, border: '1px solid #e5e7eb',
              borderRadius: 12, padding: '14px 16px',
              outline: 'none', resize: 'none',
              fontFamily: 'inherit', color: '#111827',
              lineHeight: 1.5,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.1)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <span style={{
              fontSize: 11,
              color: tipText.length > 120 ? '#f59e0b' : '#9ca3af',
              fontWeight: tipText.length > 130 ? 600 : 400,
            }}>
              {tipText.length}/140
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          fontSize: 13, color: '#dc2626', background: '#fef2f2',
          padding: '8px 12px', borderRadius: 8, marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || (mode === 'signal' ? !(selectedSignal && signalValue) : !tipText.trim())}
        style={{
          width: '100%', padding: '14px 20px',
          fontSize: 14, fontWeight: 600,
          background: (mode === 'signal' ? (selectedSignal && signalValue) : tipText.trim()) ? '#111827' : '#e5e7eb',
          color: (mode === 'signal' ? (selectedSignal && signalValue) : tipText.trim()) ? '#fff' : '#9ca3af',
          border: 'none', borderRadius: 12, cursor: 'pointer',
          transition: 'all 0.2s',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
}

// ── Claim This Rink CTA ──
function ClaimRinkCTA({ rinkId, rinkName }: { rinkId: string; rinkName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    try {
      const claims = JSON.parse(localStorage.getItem('coldstart_claims') || '[]');
      claims.push({ rink_id: rinkId, rink_name: rinkName, name: name.trim(), email: email.trim(), role: role.trim(), timestamp: new Date().toISOString() });
      localStorage.setItem('coldstart_claims', JSON.stringify(claims));
      setSubmitted(true);
    } catch { setSubmitted(true); }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', border: '1px solid #bfdbfe', borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✉️</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#1e40af', margin: 0 }}>We&apos;ll be in touch!</p>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6, lineHeight: 1.5 }}>
          Verified rink profiles are launching soon. As an early claimer, you&apos;ll get priority access + a free month.
        </p>
      </div>
    );
  }

  if (!expanded) {
    return (
      <div onClick={() => setExpanded(true)} style={{
        background: '#fff', border: '1.5px dashed #93c5fd', borderRadius: 16, padding: '20px 24px',
        cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 16,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#f8faff'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.background = '#fff'; }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏟️</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1e40af', margin: 0 }}>Manage this rink?</p>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Claim your profile — respond to feedback, get featured, see analytics.</p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', whiteSpace: 'nowrap' }}>Claim →</span>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Claim {rinkName}</h3>
        <button onClick={() => setExpanded(false)} style={{ fontSize: 12, color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
      </div>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 }}>
        Verified rink profiles are coming soon. Leave your info and we&apos;ll reach out with early access. Free for the first 30 days.
      </p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" style={{ width: '100%', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', marginBottom: 10, outline: 'none', fontFamily: 'inherit', color: '#111827' }} onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" autoComplete="email" style={{ width: '100%', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', marginBottom: 10, outline: 'none', fontFamily: 'inherit', color: '#111827' }} onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
      <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Your role (e.g. Rink Manager, Owner)" autoComplete="organization-title" style={{ width: '100%', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', marginBottom: 16, outline: 'none', fontFamily: 'inherit', color: '#111827' }} onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
      <button onClick={handleSubmit} disabled={!name.trim() || !email.trim() || submitting} style={{ width: '100%', padding: '13px 20px', fontSize: 14, fontWeight: 600, background: (name.trim() && email.trim()) ? '#1e40af' : '#e5e7eb', color: (name.trim() && email.trim()) ? '#fff' : '#9ca3af', border: 'none', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', opacity: submitting ? 0.6 : 1 }}>
        {submitting ? 'Submitting...' : 'Request early access'}
      </button>
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>No charge until you activate. We&apos;ll email you when it&apos;s ready.</p>
    </div>
  );
}

// ── Rate & Contribute — separated Rate vs Tip flows, submit button, rate-once protection ──
function RateAndContribute({ rinkId, rinkName, onSummaryUpdate }: { rinkId: string; rinkName: string; onSummaryUpdate: (s: RinkSummary) => void }) {
  const [phase, setPhase] = useState<'button' | 'verify' | 'context' | 'rate' | 'tip' | 'done_rate' | 'done_tip'>('button');
  const [botAnswer, setBotAnswer] = useState('');
  const verifyNum = useRef(Math.floor(Math.random() * 5) + 2);
  const [ratingContext, setRatingContext] = useState<'tournament' | 'regular' | null>(null);
  const [pendingFlow, setPendingFlow] = useState<'rate' | 'tip'>('rate');
  const [hasRated, setHasRated] = useState(false);

  // Rate-once: check localStorage
  useEffect(() => {
    try {
      const rated = JSON.parse(localStorage.getItem('coldstart_rated_rinks') || '{}');
      if (rated[rinkId]) setHasRated(true);
    } catch {}
  }, [rinkId]);

  function markRated() {
    try {
      const rated = JSON.parse(localStorage.getItem('coldstart_rated_rinks') || '{}');
      rated[rinkId] = Date.now();
      localStorage.setItem('coldstart_rated_rinks', JSON.stringify(rated));
      setHasRated(true);
    } catch {}
  }

  function checkBot() {
    if (parseInt(botAnswer) === verifyNum.current + 3) setPhase('context');
  }

  function selectContext(ctx: 'tournament' | 'regular') {
    setRatingContext(ctx);
    localStorage.setItem('coldstart_rating_context', ctx);
    setPhase(pendingFlow);
  }

  function startFlow(flow: 'rate' | 'tip') {
    setPendingFlow(flow);
    if (hasRated && flow === 'rate') return; // already rated
    setPhase('verify');
  }

  // ── Button ──
  if (phase === 'button') {
    return (
      <section style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => startFlow('rate')} style={{
            flex: 1, padding: '16px 20px',
            background: hasRated ? '#f0fdf4' : '#fff',
            color: hasRated ? '#16a34a' : '#111827',
            border: hasRated ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
            borderRadius: 14, cursor: hasRated ? 'default' : 'pointer',
            fontSize: 15, fontWeight: 600, transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={(e) => { if (!hasRated) e.currentTarget.style.borderColor = '#0ea5e9'; }}
          onMouseLeave={(e) => { if (!hasRated) e.currentTarget.style.borderColor = '#e5e7eb'; }}
          >
            {hasRated ? <><span>✓</span> Rated</> : <><span>📊</span> Rate it</>}
          </button>
          <button onClick={() => startFlow('tip')} style={{
            flex: 1, padding: '16px 20px', background: '#fff', color: '#111827',
            border: '1px solid #e5e7eb', borderRadius: 14, cursor: 'pointer',
            fontSize: 15, fontWeight: 600, transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
          >
            <span>💬</span> Drop a tip
          </button>
        </div>
        {hasRated && (
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, textAlign: 'center' }}>
            You&apos;ve already rated this rink. You can still drop tips.
          </p>
        )}
      </section>
    );
  }

  // ── Verify ──
  if (phase === 'verify') {
    return (
      <section style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Quick check</p>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>What is {verifyNum.current} + 3?</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', maxWidth: 200, margin: '12px auto 0' }}>
          <input value={botAnswer} onChange={(e) => setBotAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') checkBot(); }} placeholder="?" autoFocus
            style={{ width: 60, fontSize: 18, fontWeight: 700, textAlign: 'center', padding: '8px', border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', fontFamily: 'inherit', color: '#111827' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
          />
          <button onClick={checkBot} style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: '#111827', border: 'none', borderRadius: 10, padding: '8px 20px', cursor: 'pointer' }}>Go</button>
        </div>
      </section>
    );
  }

  // ── Context ──
  if (phase === 'context') {
    return (
      <section style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>When were you here?</p>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Helps parents filter by context</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
          {([['tournament', '🏆', 'Tournament', 'Weekend event'], ['regular', '📅', 'Regular season', 'League or practice']] as const).map(([key, icon, title, sub]) => (
            <button key={key} onClick={() => selectContext(key as 'tournament' | 'regular')} style={{
              flex: 1, maxWidth: 180, padding: '14px 16px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = key === 'tournament' ? '#f59e0b' : '#0ea5e9'; e.currentTarget.style.background = key === 'tournament' ? '#fffbeb' : '#f0f9ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{title}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  // ── Rate phase — just signals + submit ──
  if (phase === 'rate') {
    return (
      <section style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '8px 24px', background: ratingContext === 'tournament' ? '#fffbeb' : '#f0f9ff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: ratingContext === 'tournament' ? '#92400e' : '#1e40af' }}>
            {ratingContext === 'tournament' ? '🏆 Tournament weekend' : '📅 Regular season'}
          </span>
          <VisitorToggle />
        </div>
        <div style={{ padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Rate the signals</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Tap one, then rate 1-5</span>
          </div>
          <QuickVoteRow rinkId={rinkId} context={ratingContext || ''} onSummaryUpdate={onSummaryUpdate} />
        </div>
        <div style={{ padding: '12px 24px 16px', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={() => { markRated(); setPhase('done_rate'); }} style={{
            width: '100%', padding: '13px 20px', fontSize: 14, fontWeight: 600, background: '#111827', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1f2937'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#111827'; }}
          >
            Submit rating
          </button>
        </div>
      </section>
    );
  }

  // ── Tip phase — just tip + cross-link ──
  if (phase === 'tip') {
    return (
      <section style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '8px 24px', background: ratingContext === 'tournament' ? '#fffbeb' : '#f0f9ff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: ratingContext === 'tournament' ? '#92400e' : '#1e40af' }}>
            {ratingContext === 'tournament' ? '🏆 Tournament weekend' : '📅 Regular season'}
          </span>
          <VisitorToggle />
        </div>
        <div style={{ padding: '18px 24px' }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Drop a tip</span>
            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>What should parents know?</span>
          </div>
          <QuickTipInput rinkId={rinkId} context={ratingContext || ''} onSummaryUpdate={onSummaryUpdate} />
        </div>
        <div style={{ padding: '12px 24px 16px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          {!hasRated ? (
            <button onClick={() => setPhase('rate')} style={{ fontSize: 13, fontWeight: 500, color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer' }}>
              📊 Rate the rink too →
            </button>
          ) : (
            <button onClick={() => setPhase('button')} style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>← Done</button>
          )}
        </div>
      </section>
    );
  }

  // ── Done rate — success + "drop a tip too" ──
  if (phase === 'done_rate') {
    return (
      <section style={{ marginTop: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#16a34a', margin: 0 }}>Rating submitted</p>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Thanks — this helps other hockey parents.</p>
        <button onClick={() => setPhase('tip')} style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: '#111827', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 24px', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
        >💬 Drop a tip?</button>
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setPhase('button')} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>Done</button>
        </div>
      </section>
    );
  }

  // ── Done tip — success + "rate the rink" ──
  if (phase === 'done_tip') {
    return (
      <section style={{ marginTop: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#16a34a', margin: 0 }}>Tip added</p>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Thanks for sharing what you know.</p>
        {!hasRated && (
          <button onClick={() => setPhase('rate')} style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: '#111827', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 24px', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
          >📊 Rate the rink too</button>
        )}
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setPhase('button')} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>Done</button>
        </div>
      </section>
    );
  }

  return null;
}

// ── Save Rink Button (My Rinks) — auth-aware ──
function SaveRinkButton({ rinkId, isLoggedIn, onAuthRequired }: { rinkId: string; isLoggedIn: boolean; onAuthRequired: () => void }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem('coldstart_my_rinks') || '[]');
      setSaved(list.includes(rinkId));
    } catch {}
  }, [rinkId]);

  function toggle() {
    if (!isLoggedIn) {
      onAuthRequired();
      return;
    }
    try {
      const list = JSON.parse(localStorage.getItem('coldstart_my_rinks') || '[]');
      let updated;
      if (list.includes(rinkId)) {
        updated = list.filter((id: string) => id !== rinkId);
        setSaved(false);
      } else {
        updated = [...list, rinkId];
        setSaved(true);
      }
      localStorage.setItem('coldstart_my_rinks', JSON.stringify(updated));
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      style={{
        fontSize: 12, fontWeight: 600,
        color: saved ? '#d97706' : '#6b7280',
        background: saved ? '#fffbeb' : '#f9fafb',
        border: `1px solid ${saved ? '#fde68a' : '#e5e7eb'}`,
        borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
        transition: 'all 0.15s', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      {saved ? '⭐ Saved' : '☆ Save rink'}
    </button>
  );
}

// ── Nearby Places Helper — generates placeholder data based on rink location ──
interface NearbyPlace {
  name: string;
  distance: string;
  url: string;
  isPartner?: boolean;
  partnerNote?: string;
  isFar?: boolean; // >3mi, flagged as limited options
}
interface NearbyCategory {
  label: string;
  icon: string;
  description: string;
  places: NearbyPlace[];
  partnerPlaces?: NearbyPlace[];
}

// Seeded nearby places per rink — up to 10 per category within 3mi
const SEEDED_NEARBY: Record<string, Record<string, NearbyPlace[]>> = {
  'bww': {
    quick_bite: [
      { name: "Tim Hortons", distance: "0.3 mi", url: "https://www.google.com/maps/search/Tim+Hortons+near+Troy+MI" },
      { name: "Panera Bread", distance: "0.5 mi", url: "https://www.google.com/maps/search/Panera+Bread+near+Troy+MI" },
      { name: "Bagel Fragel", distance: "0.8 mi", url: "https://www.google.com/maps/search/Bagel+Fragel+Troy+MI" },
      { name: "Jimmy John's", distance: "0.6 mi", url: "https://www.google.com/maps/search/Jimmy+Johns+Troy+MI" },
      { name: "Subway", distance: "0.4 mi", url: "https://www.google.com/maps/search/Subway+Troy+MI" },
      { name: "Potbelly Sandwich", distance: "1.1 mi", url: "https://www.google.com/maps/search/Potbelly+Troy+MI" },
      { name: "Tropical Smoothie", distance: "0.9 mi", url: "https://www.google.com/maps/search/Tropical+Smoothie+Troy+MI" },
      { name: "Coney Island", distance: "0.7 mi", url: "https://www.google.com/maps/search/coney+island+restaurant+Troy+MI" },
    ],
    coffee: [
      { name: "Starbucks", distance: "0.4 mi", url: "https://www.google.com/maps/search/Starbucks+near+Troy+MI" },
      { name: "Biggby Coffee", distance: "0.6 mi", url: "https://www.google.com/maps/search/Biggby+Coffee+Troy+MI" },
      { name: "Dunkin'", distance: "0.8 mi", url: "https://www.google.com/maps/search/Dunkin+Troy+MI" },
      { name: "Tim Hortons", distance: "0.3 mi", url: "https://www.google.com/maps/search/Tim+Hortons+Troy+MI" },
      { name: "Caribou Coffee", distance: "1.4 mi", url: "https://www.google.com/maps/search/Caribou+Coffee+Troy+MI" },
    ],
    team_lunch: [
      { name: "Buffalo Wild Wings", distance: "0.1 mi", url: "https://www.google.com/maps/search/Buffalo+Wild+Wings+Troy+MI" },
      { name: "Applebee's", distance: "0.7 mi", url: "https://www.google.com/maps/search/Applebees+Troy+MI" },
      { name: "Chili's", distance: "1.2 mi", url: "https://www.google.com/maps/search/Chilis+Troy+MI" },
      { name: "Red Robin", distance: "1.5 mi", url: "https://www.google.com/maps/search/Red+Robin+Troy+MI" },
      { name: "Olive Garden", distance: "1.8 mi", url: "https://www.google.com/maps/search/Olive+Garden+Troy+MI" },
      { name: "Bob Evans", distance: "1.3 mi", url: "https://www.google.com/maps/search/Bob+Evans+Troy+MI" },
      { name: "Cracker Barrel", distance: "2.4 mi", url: "https://www.google.com/maps/search/Cracker+Barrel+Troy+MI" },
      { name: "TGI Friday's", distance: "2.1 mi", url: "https://www.google.com/maps/search/TGI+Fridays+Troy+MI" },
    ],
    dinner: [
      { name: "Andiamo", distance: "1.1 mi", url: "https://www.google.com/maps/search/Andiamo+Troy+MI" },
      { name: "Red Olive", distance: "0.9 mi", url: "https://www.google.com/maps/search/Red+Olive+Troy+MI" },
      { name: "Kona Grill", distance: "1.4 mi", url: "https://www.google.com/maps/search/Kona+Grill+Troy+MI" },
      { name: "P.F. Chang's", distance: "1.6 mi", url: "https://www.google.com/maps/search/PF+Changs+Troy+MI" },
      { name: "Granite City", distance: "1.8 mi", url: "https://www.google.com/maps/search/Granite+City+Troy+MI" },
      { name: "Bonefish Grill", distance: "2.0 mi", url: "https://www.google.com/maps/search/Bonefish+Grill+Troy+MI" },
      { name: "Maggiano's", distance: "2.3 mi", url: "https://www.google.com/maps/search/Maggianos+Troy+MI" },
      { name: "Capital Grille", distance: "2.8 mi", url: "https://www.google.com/maps/search/Capital+Grille+Troy+MI" },
    ],
    bowling: [
      { name: "Troy Lanes", distance: "1.8 mi", url: "https://www.google.com/maps/search/bowling+Troy+MI" },
      { name: "Thunderbowl Lanes", distance: "2.9 mi", url: "https://www.google.com/maps/search/Thunderbowl+Lanes+Troy+MI" },
    ],
    arcade: [
      { name: "Dave & Buster's", distance: "2.1 mi", url: "https://www.google.com/maps/search/Dave+Busters+Troy+MI" },
    ],
    movies: [
      { name: "MJR Troy Grand Cinema", distance: "1.5 mi", url: "https://www.google.com/maps/search/movie+theater+Troy+MI" },
      { name: "AMC Forum 30", distance: "2.6 mi", url: "https://www.google.com/maps/search/AMC+Forum+Sterling+Heights+MI" },
    ],
    fun: [
      { name: "Sky Zone", distance: "3.2 mi", url: "https://www.google.com/maps/search/Sky+Zone+near+Troy+MI" },
      { name: "Zap Zone", distance: "2.8 mi", url: "https://www.google.com/maps/search/Zap+Zone+near+Troy+MI" },
    ],
    hotels: [
      { name: "Drury Inn & Suites", distance: "0.5 mi", url: "https://www.google.com/maps/search/Drury+Inn+Troy+MI" },
      { name: "Hilton Garden Inn", distance: "0.8 mi", url: "https://www.google.com/maps/search/Hilton+Garden+Inn+Troy+MI" },
      { name: "Embassy Suites", distance: "1.2 mi", url: "https://www.google.com/maps/search/Embassy+Suites+Troy+MI" },
      { name: "Marriott Troy", distance: "0.9 mi", url: "https://www.google.com/maps/search/Marriott+Troy+MI" },
      { name: "Hampton Inn Troy", distance: "1.0 mi", url: "https://www.google.com/maps/search/Hampton+Inn+Troy+MI" },
    ],
    gas: [
      { name: "Shell", distance: "0.3 mi", url: "https://www.google.com/maps/search/Shell+gas+Troy+MI" },
      { name: "Speedway", distance: "0.5 mi", url: "https://www.google.com/maps/search/Speedway+gas+Troy+MI" },
      { name: "Costco Gas", distance: "1.8 mi", url: "https://www.google.com/maps/search/Costco+gas+Troy+MI" },
    ],
  },
  'ice-line': {
    quick_bite: [
      { name: "Wawa", distance: "0.2 mi", url: "https://www.google.com/maps/search/Wawa+near+West+Chester+PA" },
      { name: "Kildare's", distance: "0.5 mi", url: "https://www.google.com/maps/search/Kildares+West+Chester+PA" },
      { name: "Jersey Mike's", distance: "0.8 mi", url: "https://www.google.com/maps/search/Jersey+Mikes+West+Chester+PA" },
      { name: "Chick-fil-A", distance: "1.1 mi", url: "https://www.google.com/maps/search/Chick+fil+A+West+Chester+PA" },
      { name: "Five Guys", distance: "0.9 mi", url: "https://www.google.com/maps/search/Five+Guys+West+Chester+PA" },
      { name: "Chipotle", distance: "1.0 mi", url: "https://www.google.com/maps/search/Chipotle+West+Chester+PA" },
    ],
    coffee: [
      { name: "La Colombe", distance: "0.7 mi", url: "https://www.google.com/maps/search/La+Colombe+West+Chester+PA" },
      { name: "Starbucks", distance: "0.4 mi", url: "https://www.google.com/maps/search/Starbucks+West+Chester+PA" },
      { name: "Dunkin'", distance: "0.6 mi", url: "https://www.google.com/maps/search/Dunkin+West+Chester+PA" },
      { name: "Boxcar Brewing", distance: "1.2 mi", url: "https://www.google.com/maps/search/Boxcar+Brewing+West+Chester+PA" },
    ],
    team_lunch: [
      { name: "Sal's Pizza", distance: "0.1 mi", url: "https://www.google.com/maps/search/pizza+West+Chester+PA", isPartner: true, partnerNote: "10% off on game days — show your team jersey" },
      { name: "TGI Friday's", distance: "1.0 mi", url: "https://www.google.com/maps/search/TGI+Fridays+West+Chester+PA" },
      { name: "Applebee's", distance: "1.3 mi", url: "https://www.google.com/maps/search/Applebees+near+West+Chester+PA" },
      { name: "Red Robin", distance: "1.5 mi", url: "https://www.google.com/maps/search/Red+Robin+West+Chester+PA" },
      { name: "Olive Garden", distance: "1.8 mi", url: "https://www.google.com/maps/search/Olive+Garden+Exton+PA" },
      { name: "Buffalo Wild Wings", distance: "2.0 mi", url: "https://www.google.com/maps/search/Buffalo+Wild+Wings+West+Chester+PA" },
      { name: "Chili's", distance: "2.2 mi", url: "https://www.google.com/maps/search/Chilis+Exton+PA" },
    ],
    dinner: [
      { name: "Iron Hill Brewery", distance: "0.6 mi", url: "https://www.google.com/maps/search/Iron+Hill+Brewery+West+Chester+PA" },
      { name: "Pietro's Prime", distance: "0.9 mi", url: "https://www.google.com/maps/search/Pietros+Prime+West+Chester+PA" },
      { name: "Limoncello", distance: "0.7 mi", url: "https://www.google.com/maps/search/Limoncello+West+Chester+PA" },
      { name: "Roots Café", distance: "0.8 mi", url: "https://www.google.com/maps/search/Roots+Cafe+West+Chester+PA" },
      { name: "Más Mexicali Cantina", distance: "0.5 mi", url: "https://www.google.com/maps/search/Mas+Mexicali+West+Chester+PA" },
      { name: "Torpedoes", distance: "1.1 mi", url: "https://www.google.com/maps/search/Torpedoes+West+Chester+PA" },
    ],
    bowling: [
      { name: "Palace Bowling", distance: "2.5 mi", url: "https://www.google.com/maps/search/bowling+near+West+Chester+PA" },
    ],
    arcade: [
      { name: "Round1", distance: "3.8 mi", url: "https://www.google.com/maps/search/Round1+near+West+Chester+PA" },
      { name: "Dave & Buster's", distance: "6.5 mi", url: "https://www.google.com/maps/search/Dave+Busters+near+West+Chester+PA", isFar: true },
    ],
    movies: [
      { name: "Regal Downingtown", distance: "2.2 mi", url: "https://www.google.com/maps/search/movie+theater+near+West+Chester+PA" },
      { name: "AMC Painters Crossing", distance: "2.8 mi", url: "https://www.google.com/maps/search/AMC+West+Chester+PA" },
    ],
    fun: [
      { name: "Urban Air", distance: "4.0 mi", url: "https://www.google.com/maps/search/Urban+Air+near+West+Chester+PA" },
      { name: "Laser Quest", distance: "5.2 mi", url: "https://www.google.com/maps/search/Laser+Quest+near+West+Chester+PA", isFar: true },
    ],
    hotels: [
      { name: "Hampton Inn Route 30", distance: "0.8 mi", url: "https://www.google.com/maps/search/Hampton+Inn+West+Chester+PA", isPartner: true, partnerNote: "Tournament group rate available — mention Ice Line" },
      { name: "Courtyard by Marriott", distance: "1.1 mi", url: "https://www.google.com/maps/search/Courtyard+Marriott+West+Chester+PA" },
      { name: "Holiday Inn Express", distance: "1.5 mi", url: "https://www.google.com/maps/search/Holiday+Inn+Express+Exton+PA" },
      { name: "Residence Inn", distance: "1.9 mi", url: "https://www.google.com/maps/search/Residence+Inn+Exton+PA" },
    ],
    gas: [
      { name: "Wawa (gas)", distance: "0.2 mi", url: "https://www.google.com/maps/search/Wawa+gas+West+Chester+PA" },
      { name: "Sunoco", distance: "0.6 mi", url: "https://www.google.com/maps/search/Sunoco+gas+West+Chester+PA" },
      { name: "Turkey Hill", distance: "1.1 mi", url: "https://www.google.com/maps/search/Turkey+Hill+gas+West+Chester+PA" },
    ],
  },
  'proskate': {
    quick_bite: [
      { name: "White Manna", distance: "0.4 mi", url: "https://www.google.com/maps/search/White+Manna+Hackensack+NJ" },
      { name: "Dunkin'", distance: "0.2 mi", url: "https://www.google.com/maps/search/Dunkin+Hackensack+NJ" },
      { name: "Chipotle", distance: "0.6 mi", url: "https://www.google.com/maps/search/Chipotle+Hackensack+NJ" },
      { name: "Wawa", distance: "0.5 mi", url: "https://www.google.com/maps/search/Wawa+Hackensack+NJ" },
      { name: "Five Guys", distance: "0.8 mi", url: "https://www.google.com/maps/search/Five+Guys+Hackensack+NJ" },
      { name: "Shake Shack", distance: "1.2 mi", url: "https://www.google.com/maps/search/Shake+Shack+Hackensack+NJ" },
      { name: "Smashburger", distance: "0.9 mi", url: "https://www.google.com/maps/search/Smashburger+Hackensack+NJ" },
    ],
    coffee: [
      { name: "Starbucks", distance: "0.3 mi", url: "https://www.google.com/maps/search/Starbucks+Hackensack+NJ" },
      { name: "Dunkin'", distance: "0.2 mi", url: "https://www.google.com/maps/search/Dunkin+Hackensack+NJ" },
      { name: "Bluestone Lane", distance: "1.4 mi", url: "https://www.google.com/maps/search/Bluestone+Lane+Hackensack+NJ" },
    ],
    team_lunch: [
      { name: "Olive Garden", distance: "0.9 mi", url: "https://www.google.com/maps/search/Olive+Garden+Hackensack+NJ" },
      { name: "Chili's", distance: "1.1 mi", url: "https://www.google.com/maps/search/Chilis+Hackensack+NJ" },
      { name: "Red Lobster", distance: "1.3 mi", url: "https://www.google.com/maps/search/Red+Lobster+Hackensack+NJ" },
      { name: "Applebee's", distance: "1.5 mi", url: "https://www.google.com/maps/search/Applebees+Hackensack+NJ" },
      { name: "TGI Friday's", distance: "1.8 mi", url: "https://www.google.com/maps/search/TGI+Fridays+Hackensack+NJ" },
      { name: "Red Robin", distance: "2.0 mi", url: "https://www.google.com/maps/search/Red+Robin+Hackensack+NJ" },
      { name: "Cheesecake Factory", distance: "2.5 mi", url: "https://www.google.com/maps/search/Cheesecake+Factory+Hackensack+NJ" },
    ],
    dinner: [
      { name: "Capital Grille", distance: "1.5 mi", url: "https://www.google.com/maps/search/Capital+Grille+Hackensack+NJ" },
      { name: "Bonefish Grill", distance: "1.2 mi", url: "https://www.google.com/maps/search/Bonefish+Grill+Hackensack+NJ" },
      { name: "Morton's Steakhouse", distance: "1.8 mi", url: "https://www.google.com/maps/search/Mortons+Steakhouse+Hackensack+NJ" },
      { name: "Nobi Sushi", distance: "0.7 mi", url: "https://www.google.com/maps/search/Nobi+Sushi+Hackensack+NJ" },
      { name: "Stony Hill Inn", distance: "1.0 mi", url: "https://www.google.com/maps/search/Stony+Hill+Inn+Hackensack+NJ" },
    ],
    bowling: [
      { name: "Bowler City", distance: "1.8 mi", url: "https://www.google.com/maps/search/bowling+Hackensack+NJ" },
      { name: "Lodi Lanes", distance: "2.5 mi", url: "https://www.google.com/maps/search/bowling+Lodi+NJ" },
    ],
    arcade: [
      { name: "Dave & Buster's", distance: "3.0 mi", url: "https://www.google.com/maps/search/Dave+Busters+near+Hackensack+NJ" },
      { name: "iPlay America", distance: "8.5 mi", url: "https://www.google.com/maps/search/iPlay+America+NJ", isFar: true },
    ],
    movies: [
      { name: "AMC Garden State", distance: "2.0 mi", url: "https://www.google.com/maps/search/AMC+Garden+State+NJ" },
      { name: "Regal Cinema Paramus", distance: "2.8 mi", url: "https://www.google.com/maps/search/Regal+Cinema+Paramus+NJ" },
    ],
    fun: [
      { name: "Sky Zone", distance: "3.5 mi", url: "https://www.google.com/maps/search/Sky+Zone+near+Hackensack+NJ" },
      { name: "Topgolf Edison", distance: "9.0 mi", url: "https://www.google.com/maps/search/Topgolf+Edison+NJ", isFar: true },
    ],
    hotels: [
      { name: "Hilton Hasbrouck Heights", distance: "1.5 mi", url: "https://www.google.com/maps/search/Hilton+Hasbrouck+Heights+NJ" },
      { name: "DoubleTree Mahwah", distance: "3.2 mi", url: "https://www.google.com/maps/search/DoubleTree+Mahwah+NJ" },
      { name: "Homewood Suites", distance: "2.0 mi", url: "https://www.google.com/maps/search/Homewood+Suites+Hackensack+NJ" },
      { name: "Courtyard by Marriott", distance: "1.8 mi", url: "https://www.google.com/maps/search/Courtyard+Marriott+Paramus+NJ" },
    ],
  },
};

function getRinkSlug(rink: Rink): string {
  const name = (rink.name || '').toLowerCase();
  if (name.includes('buffalo') || name.includes('bww')) return 'bww';
  if (name.includes('ice line')) return 'ice-line';
  if (name.includes('proskate') || name.includes('pro skate')) return 'proskate';
  return '';
}

function getNearbyPlaces(rink: Rink, category: string): NearbyPlace[] {
  const slug = getRinkSlug(rink);
  const seeded = slug && SEEDED_NEARBY[slug]?.[category];
  if (seeded && seeded.length > 0) return seeded;

  // Fallback: Google Maps search
  const loc = encodeURIComponent(`${rink.address}, ${rink.city}, ${rink.state}`);
  const queries: Record<string, string> = {
    quick_bite: 'diners+bagel+shops+fast+food',
    coffee: 'coffee+shops',
    team_lunch: 'restaurants+large+groups+casual+dining',
    dinner: 'restaurants+dinner+sit+down',
    bowling: 'bowling+alley',
    arcade: 'arcade+game+center',
    movies: 'movie+theater',
    fun: 'trampoline+park+laser+tag',
    hotels: 'hotels',
  };
  const q = queries[category] || category;
  return [{
    name: `Search near ${rink.name}`,
    distance: '',
    url: `https://www.google.com/maps/search/${q}+near+${loc}`,
  }];
}

// ── Nearby Section — expandable category cards ──
function NearbySection({ title, icon, categories, rinkSlug }: { title: string; icon: string; categories: NearbyCategory[]; rinkSlug: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tipOpen, setTipOpen] = useState<string | null>(null); // "catLabel::placeName"
  const [tipText, setTipText] = useState('');
  const [tipSaved, setTipSaved] = useState<string | null>(null);
  const [placeTips, setPlaceTips] = useState<Record<string, { text: string; author: string; date: string }[]>>({});

  // Load all place tips for this rink
  useEffect(() => {
    try {
      const allTips: Record<string, { text: string; author: string; date: string }[]> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`coldstart_place_tips_${rinkSlug}_`)) {
          const placeName = key.replace(`coldstart_place_tips_${rinkSlug}_`, '');
          allTips[placeName] = JSON.parse(localStorage.getItem(key) || '[]');
        }
      }
      setPlaceTips(allTips);
    } catch {}
  }, [rinkSlug, tipSaved]);

  function submitPlaceTip(placeName: string) {
    if (!tipText.trim()) return;
    const key = `coldstart_place_tips_${rinkSlug}_${placeName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    try {
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const user = JSON.parse(localStorage.getItem('coldstart_current_user') || '{}');
      existing.push({
        text: tipText.trim(),
        author: user.name || 'Hockey parent',
        date: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(existing));
      setTipText('');
      setTipOpen(null);
      setTipSaved(placeName + Date.now());
    } catch {}
  }

  function getPlaceTips(placeName: string): { text: string; author: string; date: string }[] {
    const cleanName = placeName.replace(/[^a-zA-Z0-9]/g, '_');
    return placeTips[cleanName] || [];
  }

  return (
    <section style={{ marginTop: 24 }}>
      <h3 style={{
        fontSize: 13, fontWeight: 600, color: '#9ca3af',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>{icon}</span> {title}
      </h3>
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 16, overflow: 'hidden',
      }}>
        {categories.map((cat, i) => (
          <div key={cat.label}>
            <div
              onClick={() => setExpanded(expanded === cat.label ? null : cat.label)}
              style={{
                padding: '14px 20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'background 0.1s',
                background: expanded === cat.label ? '#f8fafc' : '#fff',
              }}
              onMouseEnter={(e) => { if (expanded !== cat.label) e.currentTarget.style.background = '#fafbfc'; }}
              onMouseLeave={(e) => { if (expanded !== cat.label) e.currentTarget.style.background = '#fff'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    {cat.label}
                    <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>
                      {cat.places.length} spot{cat.places.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{cat.description}</div>
                </div>
              </div>
              <span style={{
                fontSize: 12, color: '#9ca3af',
                transform: expanded === cat.label ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s',
              }}>
                ▸
              </span>
            </div>
            {expanded === cat.label && (
              <div style={{ padding: '0 20px 16px', background: '#f8fafc' }}>
                {cat.places.every(p => p.isFar) && (
                  <div style={{
                    padding: '8px 12px', marginTop: 8, borderRadius: 8,
                    background: '#fef2f2', border: '1px solid #fecaca',
                    fontSize: 11, color: '#991b1b',
                  }}>
                    ⚠️ Limited options nearby — these are further from the rink
                  </div>
                )}
                {cat.places.map((place, j) => {
                  const placeKey = `${cat.label}::${place.name}`;
                  const tips = getPlaceTips(place.name);
                  return (
                  <div key={j} style={{ marginTop: 8 }}>
                    <a
                      href={place.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        padding: '10px 12px', borderRadius: 10,
                        background: place.isPartner ? '#fffbeb' : '#fff',
                        border: `1px solid ${place.isPartner ? '#fde68a' : '#e5e7eb'}`,
                        textDecoration: 'none',
                        transition: 'border-color 0.15s', cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#0ea5e9'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = place.isPartner ? '#fde68a' : '#e5e7eb'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{place.name}</div>
                          {place.isPartner && (
                            <span style={{
                              fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                              background: '#fef3c7', color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>
                              Rink pick
                            </span>
                          )}
                          {place.isFar && !place.isPartner && (
                            <span style={{
                              fontSize: 9, fontWeight: 500, padding: '2px 6px', borderRadius: 4,
                              background: '#fef2f2', color: '#991b1b',
                            }}>
                              drive
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {place.distance && <span style={{ fontSize: 11, color: place.isFar ? '#f59e0b' : '#9ca3af' }}>{place.distance}</span>}
                          <span style={{ fontSize: 11, color: '#0ea5e9', fontWeight: 500 }}>→</span>
                        </div>
                      </div>
                      {place.isPartner && place.partnerNote && (
                        <div style={{ fontSize: 11, color: '#92400e', marginTop: 4, fontStyle: 'italic' }}>
                          {place.partnerNote}
                        </div>
                      )}
                    </a>
                    {/* Parent tips for this place */}
                    {tips.length > 0 && (
                      <div style={{ marginTop: 4, marginLeft: 8 }}>
                        {tips.map((tip, ti) => (
                          <div key={ti} style={{
                            fontSize: 12, color: '#374151', padding: '6px 10px',
                            background: '#f0f9ff', borderRadius: 8, marginTop: 4,
                            borderLeft: '3px solid #0ea5e9',
                          }}>
                            <span style={{ fontStyle: 'italic' }}>&ldquo;{tip.text}&rdquo;</span>
                            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>— {tip.author}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Add a tip button */}
                    {tipOpen === placeKey ? (
                      <div style={{ marginTop: 6, marginLeft: 8, display: 'flex', gap: 6 }}>
                        <input
                          value={tipText}
                          onChange={(e) => setTipText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && submitPlaceTip(place.name)}
                          placeholder="E.g. &quot;Call ahead for 20+&quot;"
                          autoFocus
                          style={{
                            flex: 1, padding: '6px 10px', fontSize: 12,
                            border: '1px solid #d1d5db', borderRadius: 8, outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => submitPlaceTip(place.name)}
                          style={{
                            fontSize: 11, fontWeight: 600, color: '#fff',
                            background: tipText.trim() ? '#0ea5e9' : '#d1d5db',
                            border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                          }}
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setTipOpen(null); setTipText(''); }}
                          style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.preventDefault(); setTipOpen(placeKey); setTipText(''); }}
                        style={{
                          marginTop: 4, marginLeft: 8, fontSize: 11, fontWeight: 500,
                          color: '#0ea5e9', background: 'none', border: 'none',
                          cursor: 'pointer', padding: '2px 0',
                        }}
                      >
                        💬 Add a tip
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
            {i < categories.length - 1 && <div style={{ height: 1, background: '#f1f5f9' }} />}
          </div>
        ))}
      </div>
    </section>
  );
}

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

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/rinks/${rinkId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Failed to load');
        setDetail(data.data);
      } catch (e: any) {
        setError(e.message || 'Failed to load rink');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [rinkId]);

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
          <span
            onClick={() => router.push('/')}
            style={{ fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: -0.3, cursor: 'pointer' }}
          >
            cold<span style={{ color: '#0ea5e9' }}>start</span>
          </span>
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
          <span
            onClick={() => router.push('/')}
            style={{ fontSize: 36, fontWeight: 800, color: '#111827', letterSpacing: -0.5, cursor: 'pointer' }}
          >
            cold<span style={{ color: '#0ea5e9' }}>start</span>
          </span>
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
                navigator.share({ title: `${rink.name} — ColdStart`, text, url }).catch(() => {});
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
                  const allSigs = ensureAllSignals(summary.signals, getRinkSlug(rink));
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
        <RateAndContribute rinkId={rinkId} rinkName={rink.name} onSummaryUpdate={handleSummaryUpdate} />

        {/* ── Signals ── */}
        {summary.signals.length > 0 && (
          <section style={{
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
                const SIGNAL_ORDER = ['parking', 'cold', 'chaos', 'food_nearby', 'family_friendly', 'locker_rooms', 'pro_shop'];
                const allSignals = ensureAllSignals(summary.signals, getRinkSlug(rink));
                const sorted = [...allSignals].sort((a, b) => {
                  const ai = SIGNAL_ORDER.indexOf(a.signal);
                  const bi = SIGNAL_ORDER.indexOf(b.signal);
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
          <section style={{ marginTop: 24 }}>
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

        {/* ── Nearby Eats ── */}
        <NearbySection
          title="Places to eat"
          icon="🍽️"
          rinkSlug={getRinkSlug(rink)}
          categories={[
            { label: 'Quick bite', icon: '🥯', description: 'Diners, bagel shops, fast casual',
              places: getNearbyPlaces(rink, 'quick_bite') },
            { label: 'Good coffee', icon: '☕', description: 'Coffee shops nearby',
              places: getNearbyPlaces(rink, 'coffee') },
            { label: 'Team lunch', icon: '🍕', description: 'Casual chains and group-friendly spots',
              places: getNearbyPlaces(rink, 'team_lunch') },
            { label: 'Post-game dinner', icon: '🍝', description: 'Family sit-downs after the game',
              places: getNearbyPlaces(rink, 'dinner') },
          ]}
        />

        {/* ── Team Activities ── */}
        <NearbySection
          title="Team activities"
          icon="🎳"
          rinkSlug={getRinkSlug(rink)}
          categories={[
            { label: 'Bowling', icon: '🎳', description: 'Bowling alleys nearby',
              places: getNearbyPlaces(rink, 'bowling') },
            { label: 'Arcade', icon: '🕹️', description: 'Arcades and game centers',
              places: getNearbyPlaces(rink, 'arcade') },
            { label: 'Movies', icon: '🎬', description: 'Movie theaters nearby',
              places: getNearbyPlaces(rink, 'movies') },
            { label: 'Fun zone', icon: '🎢', description: 'Trampoline parks, laser tag, etc.',
              places: getNearbyPlaces(rink, 'fun') },
          ]}
        />

        {/* ── Where to Stay ── */}
        <NearbySection
          title="Where to stay"
          icon="🏨"
          rinkSlug={getRinkSlug(rink)}
          categories={[
            { label: 'Hotels nearby', icon: '🏨', description: 'Within 10 minutes of the rink',
              places: getNearbyPlaces(rink, 'hotels') },
          ]}
        />

        {/* ── Gas ── */}
        <NearbySection
          title="Gas stations"
          icon="⛽"
          rinkSlug={getRinkSlug(rink)}
          categories={[
            { label: 'Gas nearby', icon: '⛽', description: 'Fill up near the rink',
              places: getNearbyPlaces(rink, 'gas') },
          ]}
        />

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
                      <span style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>
                        cold<span style={{ color: '#0ea5e9' }}>start</span>
                      </span>
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
