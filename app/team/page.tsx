'use client';

import { useState, useMemo } from 'react';
import { PageShell } from '../../components/PageShell';
import { colors, text, radius, shadow } from '../../lib/theme';

// ── Types ──

interface GameSignals {
  parking: number; cold: number; chaos: number;
  food_nearby: number; family_friendly: number;
}

interface Game {
  id: string; date: string; time: string; opponent: string;
  rinkName: string; rinkId: string; city: string; state: string;
  isHome: boolean; distanceMi: number; driveMins: number;
  signals: GameSignals; ratingCount: number; flagged: boolean;
}

interface ScoreGrade { label: string; color: string; bg: string; border: string; }

// ── Demo data ──

const TEAM_NAME = 'Chester County Blades';
const TEAM_LEVEL = 'Squirt A';
const SEASON = '2025–26';

const SCHEDULE: Game[] = [
  {
    id: '1', date: '2026-02-21', time: '6:30 PM', opponent: 'Lehigh Valley Phantoms',
    rinkName: 'Steel Ice Center', rinkId: 'r-steel-ice', city: 'Bethlehem', state: 'PA',
    isHome: false, distanceMi: 72, driveMins: 78,
    signals: { parking: 2.1, cold: 4.2, chaos: 3.8, food_nearby: 3.5, family_friendly: 2.4 },
    ratingCount: 34, flagged: true,
  },
  {
    id: '2', date: '2026-02-22', time: '8:00 AM', opponent: 'Tri-County Eagles',
    rinkName: 'Ice Line Quad Rinks', rinkId: 'r-ice-line', city: 'West Chester', state: 'PA',
    isHome: true, distanceMi: 0, driveMins: 0,
    signals: { parking: 3.6, cold: 3.0, chaos: 2.5, food_nearby: 4.1, family_friendly: 4.3 },
    ratingCount: 87, flagged: false,
  },
  {
    id: '3', date: '2026-02-28', time: '5:15 PM', opponent: 'Jersey Shore Wildcats',
    rinkName: 'ProSkate Ice Arena', rinkId: 'r-proskate', city: 'Hackensack', state: 'NJ',
    isHome: false, distanceMi: 118, driveMins: 135,
    signals: { parking: 1.8, cold: 3.9, chaos: 4.5, food_nearby: 4.0, family_friendly: 2.0 },
    ratingCount: 22, flagged: true,
  },
  {
    id: '4', date: '2026-03-07', time: '3:00 PM', opponent: 'Hatfield Ice Hawks',
    rinkName: 'Hatfield Ice', rinkId: 'r-hatfield', city: 'Hatfield', state: 'PA',
    isHome: false, distanceMi: 45, driveMins: 52,
    signals: { parking: 4.0, cold: 2.8, chaos: 2.2, food_nearby: 3.2, family_friendly: 4.1 },
    ratingCount: 56, flagged: false,
  },
  {
    id: '5', date: '2026-03-08', time: '10:30 AM', opponent: 'Delaware Thunder',
    rinkName: 'Ice Line Quad Rinks', rinkId: 'r-ice-line', city: 'West Chester', state: 'PA',
    isHome: true, distanceMi: 0, driveMins: 0,
    signals: { parking: 3.6, cold: 3.0, chaos: 2.5, food_nearby: 4.1, family_friendly: 4.3 },
    ratingCount: 87, flagged: false,
  },
  {
    id: '6', date: '2026-03-14', time: '7:00 PM', opponent: 'Bucks County Bruins',
    rinkName: 'Grundy Arena', rinkId: 'r-grundy', city: 'Bristol', state: 'PA',
    isHome: false, distanceMi: 62, driveMins: 70,
    signals: { parking: 2.5, cold: 4.6, chaos: 3.2, food_nearby: 2.0, family_friendly: 2.8 },
    ratingCount: 41, flagged: true,
  },
  {
    id: '7', date: '2026-03-21', time: '4:00 PM', opponent: 'Main Line Monarchs',
    rinkName: 'Radnor Ice Rink', rinkId: 'r-radnor', city: 'Wayne', state: 'PA',
    isHome: false, distanceMi: 18, driveMins: 25,
    signals: { parking: 3.8, cold: 2.5, chaos: 2.0, food_nearby: 4.5, family_friendly: 4.6 },
    ratingCount: 93, flagged: false,
  },
  {
    id: '8', date: '2026-03-28', time: '9:00 AM', opponent: 'Reading Royals Jr.',
    rinkName: 'Body Zone Sports Complex', rinkId: 'r-bodyzone', city: 'Reading', state: 'PA',
    isHome: false, distanceMi: 55, driveMins: 60,
    signals: { parking: 4.2, cold: 2.2, chaos: 1.8, food_nearby: 3.8, family_friendly: 4.5 },
    ratingCount: 68, flagged: false,
  },
];

// ── Helpers ──

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function signalLabel(key: string): string {
  const map: Record<string, string> = {
    parking: 'Parking', cold: 'Cold Level', chaos: 'Chaos',
    food_nearby: 'Nearby Food', family_friendly: 'Family Friendly',
  };
  return map[key] || key;
}

function isInverted(key: string): boolean {
  return key === 'cold' || key === 'chaos';
}

function overallScore(signals: GameSignals): number {
  const weights: Record<string, number> = {
    parking: 1, cold: -1, chaos: -1, food_nearby: 1, family_friendly: 1,
  };
  let sum = 0;
  let count = 0;
  for (const [k, v] of Object.entries(signals)) {
    const w = weights[k] || 1;
    sum += w > 0 ? v : (5 - v);
    count++;
  }
  return sum / count;
}

function scoreGrade(score: number): ScoreGrade {
  if (score >= 3.8) return { label: 'Great', color: colors.success, bg: colors.bgSuccess, border: colors.successBorder };
  if (score >= 3.0) return { label: 'OK', color: colors.warning, bg: colors.bgWarning, border: colors.warningBorder };
  return { label: 'Heads Up', color: colors.error, bg: colors.bgError, border: colors.error };
}

function barColor(value: number, inverted: boolean): string {
  if (inverted) {
    if (value <= 2.5) return colors.success;
    if (value <= 3.5) return colors.warning;
    return colors.error;
  }
  if (value >= 3.5) return colors.success;
  if (value >= 2.5) return colors.warning;
  return colors.error;
}

// ── Components ──

function SignalBar({ label, value, inverted }: { label: string; value: number; inverted: boolean }) {
  const pct = (value / 5) * 100;
  const color = barColor(value, inverted);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 80, fontSize: text.xs, color: colors.textTertiary, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: colors.borderLight, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, background: color, width: `${pct}%` }} />
      </div>
      <span style={{ width: 28, fontSize: text.xs, fontWeight: 500, textAlign: 'right', color }}>{value.toFixed(1)}</span>
    </div>
  );
}

function GameCard({ game, expanded, onToggle }: { game: Game; expanded: boolean; onToggle: () => void }) {
  const score = overallScore(game.signals);
  const grade = scoreGrade(score);
  const dateParts = formatDate(game.date).split(' ');
  const weekday = dateParts[0];
  const monthDay = dateParts.slice(1).join(' ');

  return (
    <div style={{
      background: colors.white,
      borderRadius: radius.xl,
      border: `1px solid ${game.flagged ? colors.error : colors.borderDefault}`,
    }}>
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '12px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {/* Date column */}
        <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: text['2xs'], color: colors.textMuted, fontWeight: 500 }}>{weekday}</div>
          <div style={{ fontSize: text.sm, fontWeight: 600, color: colors.textPrimary, lineHeight: 1.2 }}>{monthDay}</div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 36, background: colors.borderDefault, flexShrink: 0 }} />

        {/* Game info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{
              fontSize: text.xs, fontWeight: 500,
              padding: '2px 6px', borderRadius: radius.sm,
              background: game.isHome ? colors.borderLight : colors.bgInfo,
              color: game.isHome ? colors.textTertiary : colors.brand,
              flexShrink: 0,
            }}>
              {game.isHome ? 'HOME' : 'AWAY'}
            </span>
            <span style={{
              fontSize: text.sm, fontWeight: 500, color: colors.textPrimary,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              vs {game.opponent}
            </span>
          </div>
          <div style={{ fontSize: text.xs, color: colors.textMuted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{game.time}</span>
            <span>·</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.rinkName}</span>
            {!game.isHome && <><span>·</span><span>{game.distanceMi} mi</span></>}
          </div>
        </div>

        {/* Grade badge */}
        <div style={{
          flexShrink: 0,
          padding: '4px 8px',
          borderRadius: radius.lg,
          border: `1px solid ${grade.border}`,
          background: grade.bg,
          fontSize: text.xs,
          fontWeight: 500,
          color: grade.color,
        }}>
          {grade.label}
        </div>

        {/* Flag icon */}
        {game.flagged && (
          <svg width={16} height={16} viewBox="0 0 20 20" fill={colors.error} style={{ flexShrink: 0 }}>
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        )}

        {/* Chevron */}
        <svg
          width={16} height={16} viewBox="0 0 24 24" fill="none"
          stroke={colors.textDisabled} strokeWidth={1.5}
          style={{ flexShrink: 0, transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'none' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '4px 16px 16px', borderTop: `1px solid ${colors.borderLight}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Signals */}
            <div>
              <h4 style={{ fontSize: text.xs, fontWeight: 500, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Rink Signals <span style={{ color: colors.textDisabled, fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', marginLeft: 4 }}>({game.ratingCount} ratings)</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(game.signals).map(([key, value]) => (
                  <SignalBar key={key} label={signalLabel(key)} value={value} inverted={isInverted(key)} />
                ))}
              </div>
            </div>

            {/* Travel + actions */}
            <div>
              {!game.isHome && (
                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ fontSize: text.xs, fontWeight: 500, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Travel</h4>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, background: colors.bgPage, borderRadius: radius.lg, padding: '8px 12px' }}>
                      <div style={{ fontSize: text.base, fontWeight: 600, color: colors.textPrimary }}>{game.distanceMi} mi</div>
                      <div style={{ fontSize: text.xs, color: colors.textMuted }}>distance</div>
                    </div>
                    <div style={{ flex: 1, background: colors.bgPage, borderRadius: radius.lg, padding: '8px 12px' }}>
                      <div style={{ fontSize: text.base, fontWeight: 600, color: colors.textPrimary }}>
                        {game.driveMins >= 60 ? `${Math.floor(game.driveMins / 60)}h ${game.driveMins % 60}m` : `${game.driveMins}m`}
                      </div>
                      <div style={{ fontSize: text.xs, color: colors.textMuted }}>drive time</div>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={{
                  flex: 1, fontSize: text.xs, fontWeight: 500, padding: '10px 12px',
                  background: colors.textPrimary, color: colors.white,
                  border: 'none', borderRadius: radius.lg, cursor: 'pointer',
                }}>
                  Share prep link
                </button>
                <button style={{
                  flex: 1, fontSize: text.xs, fontWeight: 500, padding: '10px 12px',
                  background: colors.white, color: colors.textSecondary,
                  border: `1px solid ${colors.borderDefault}`, borderRadius: radius.lg, cursor: 'pointer',
                }}>
                  View full report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──

export default function TeamDashboardPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'away') return SCHEDULE.filter((g) => !g.isHome);
    if (filter === 'flagged') return SCHEDULE.filter((g) => g.flagged);
    return SCHEDULE;
  }, [filter]);

  const awayGames = SCHEDULE.filter((g) => !g.isHome);
  const totalMiles = awayGames.reduce((sum, g) => sum + g.distanceMi * 2, 0);
  const totalDriveHours = awayGames.reduce((sum, g) => sum + g.driveMins * 2, 0) / 60;
  const flaggedCount = SCHEDULE.filter((g) => g.flagged).length;
  const avgDistance = awayGames.length > 0 ? Math.round(awayGames.reduce((s, g) => s + g.distanceMi, 0) / awayGames.length) : 0;

  const filterTabs = [
    { key: 'all', label: 'All games' },
    { key: 'away', label: 'Away only' },
    { key: 'flagged', label: `Flagged (${flaggedCount})` },
  ];

  return (
    <PageShell back="/" backLabel="← Home">
      {/* Header */}
      <div style={{ background: colors.white, borderBottom: `1px solid ${colors.borderDefault}` }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: text.lg, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>{TEAM_NAME}</h1>
              <p style={{ fontSize: text.sm, color: colors.textMuted, marginTop: 2 }}>{TEAM_LEVEL} · {SEASON} Season</p>
            </div>
            <button
              onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              style={{
                flexShrink: 0, fontSize: text.xs, fontWeight: 500,
                padding: '8px 12px', borderRadius: radius.lg,
                background: colors.bgPage, color: colors.textTertiary,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {copied ? 'Copied!' : 'Copy schedule'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ background: colors.white, borderBottom: `1px solid ${colors.borderLight}` }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '14px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 12px' }}>
            {[
              { label: 'Games left', value: String(SCHEDULE.length) },
              { label: 'Road miles', value: totalMiles.toLocaleString() },
              { label: 'Drive hours', value: `${totalDriveHours.toFixed(1)}h` },
              { label: 'Avg distance', value: `${avgDistance} mi` },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: text.xs, color: colors.textMuted }}>{stat.label}</div>
                <div style={{ fontSize: text.base, fontWeight: 600, color: colors.textPrimary }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flagged alert */}
      {flaggedCount > 0 && (
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 20px 0' }}>
          <div style={{
            background: colors.bgError,
            border: `1px solid ${colors.error}`,
            borderRadius: radius.xl,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <svg width={16} height={16} viewBox="0 0 20 20" fill={colors.error} style={{ flexShrink: 0, marginTop: 2 }}>
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div>
              <p style={{ fontSize: text.sm, fontWeight: 500, color: '#991b1b', margin: 0 }}>{flaggedCount} upcoming rinks flagged</p>
              <p style={{ fontSize: text.xs, color: '#dc2626', marginTop: 2 }}>Low scores on parking, family-friendliness, or both. Tap to review.</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', gap: 4, background: colors.borderLight, borderRadius: radius.lg, padding: 4, width: 'fit-content' }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                fontSize: text.xs, fontWeight: 500,
                padding: '6px 12px', borderRadius: radius.md,
                border: 'none', cursor: 'pointer',
                transition: 'all 0.15s',
                background: filter === tab.key ? colors.white : 'transparent',
                color: filter === tab.key ? colors.textPrimary : colors.textTertiary,
                boxShadow: filter === tab.key ? shadow.sm : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 20px 60px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              expanded={expandedId === game.id}
              onToggle={() => setExpandedId(expandedId === game.id ? null : game.id)}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: text.sm, color: colors.textMuted }}>No games match this filter.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${colors.borderDefault}`, background: colors.bgPage }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: text.xs, color: colors.textMuted }}>ColdStart — built by hockey parents, for hockey parents.</span>
          <span style={{ fontSize: text.xs, color: colors.textDisabled }}>v0.3</span>
        </div>
      </div>
    </PageShell>
  );
}
