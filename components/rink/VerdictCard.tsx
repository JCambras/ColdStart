'use client';

import { useState } from 'react';
import { getVerdictColor, getVerdictBg, timeAgo, ensureAllSignals, getRinkSlug, getBarColor } from '../../lib/rinkHelpers';
import { SIGNAL_META, SIGNAL_ORDER, SignalType } from '../../lib/constants';
import { colors, text, spacing, pad } from '../../lib/theme';
import { generateSummary } from '../../lib/sentences';
import type { Signal, Rink, RinkSummary } from '../../lib/rinkTypes';

interface VerdictCardProps {
  rink: Rink;
  summary: RinkSummary;
  loadedSignals: Record<string, { value: number; count: number; confidence: number }> | null;
  isFromSeed?: boolean;
}

export function VerdictCard({ rink, summary, loadedSignals, isFromSeed }: VerdictCardProps) {
  const hasData = summary.contribution_count > 0;
  const slug = getRinkSlug(rink);
  const [showNumeric, setShowNumeric] = useState(false);

  const summaryText = hasData ? generateSummary({
    signals: summary.signals,
    tips: summary.tips,
    contributionCount: summary.contribution_count,
    rinkName: rink.name,
    verdict: summary.verdict,
    lastUpdatedAt: summary.last_updated_at,
    confirmedThisSeason: summary.confirmed_this_season,
  }) : '';
  const allSignals = ensureAllSignals(summary.signals, slug, loadedSignals);
  const sortedSignals = [...allSignals].sort((a, b) => {
    const ai = SIGNAL_ORDER.indexOf(a.signal as SignalType);
    const bi = SIGNAL_ORDER.indexOf(b.signal as SignalType);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Staleness check: >30 days in-season (Oct–Apr), >60 days off-season
  const isStale = (() => {
    if (!summary.last_updated_at) return hasData;
    const updated = new Date(summary.last_updated_at).getTime();
    const daysSince = (Date.now() - updated) / (1000 * 60 * 60 * 24);
    const month = new Date().getMonth(); // 0-indexed
    const inSeason = month >= 9 || month <= 3; // Oct(9)–Apr(3)
    return daysSince > (inSeason ? 30 : 60);
  })();

  const staleLabel = (() => {
    if (!summary.last_updated_at) return 'Last update date unknown — conditions may have changed.';
    const updated = new Date(summary.last_updated_at).getTime();
    const daysSince = (Date.now() - updated) / (1000 * 60 * 60 * 24);
    if (daysSince > 365) return `Last updated over a year ago — conditions may have changed.`;
    const months = Math.floor(daysSince / 30);
    return `Last updated over ${months} month${months !== 1 ? 's' : ''} ago — conditions may have changed.`;
  })();

  // Freshness tiers: fresh (<7d), moderate (7-30/60d), stale (>30/60d), unknown
  const freshnessTier = (() => {
    if (!summary.last_updated_at || !hasData) return 'unknown' as const;
    const updated = new Date(summary.last_updated_at).getTime();
    const daysSince = (Date.now() - updated) / (1000 * 60 * 60 * 24);
    const month = new Date().getMonth();
    const inSeason = month >= 9 || month <= 3;
    const staleThreshold = inSeason ? 30 : 60;
    if (daysSince <= 7) return 'fresh' as const;
    if (daysSince <= staleThreshold) return 'moderate' as const;
    return 'stale' as const;
  })();

  // Season label (MED-4): hockey season runs roughly Oct–Apr
  const seasonLabel = (() => {
    if (!hasData) return null;
    if (summary.confirmed_this_season) return 'This season' as const;
    if (summary.last_updated_at) return 'Last season' as const;
    return null;
  })();

  return (
    <section
      aria-label="Rink verdict"
      style={{
        background: getVerdictBg(summary.verdict),
        border: `1px solid ${getVerdictColor(summary.verdict)}22`,
        borderLeft: `3px solid ${getVerdictColor(summary.verdict)}`,
        borderRadius: 16, padding: pad(spacing[20], spacing[24]), marginTop: spacing[20],
      }}
    >
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: isFromSeed ? colors.amber : colors.textTertiary, margin: 0, letterSpacing: 0.3, textTransform: 'uppercase' }}>
          {isFromSeed ? 'Estimated:' : 'Parents report:'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[8], marginTop: spacing[2], flexWrap: 'wrap' }}>
          <p style={{
            fontSize: `clamp(${text.xl}px, 3vw, ${text['3xl']}px)`, fontWeight: 700,
            color: getVerdictColor(summary.verdict),
            margin: 0, lineHeight: 1.2, letterSpacing: -0.3,
          }}>
            {summary.verdict}
          </p>
          {freshnessTier !== 'unknown' && summary.last_updated_at && (
            <span style={{
              fontSize: 10,
              fontWeight: freshnessTier === 'fresh' ? 600 : 500,
              padding: pad(spacing[2], spacing[8]),
              borderRadius: 10, whiteSpace: 'nowrap',
              ...(freshnessTier === 'fresh'
                ? { background: colors.bgSuccess, color: colors.success, border: `1px solid ${colors.successBorder}` }
                : { color: colors.textMuted }),
            }}>
              Updated {timeAgo(summary.last_updated_at)}
            </span>
          )}
        </div>

        {/* Natural language summary */}
        {hasData && summaryText && (
          <p style={{
            fontSize: 13, color: colors.textSecondary, lineHeight: 1.5,
            margin: pad(spacing[10], spacing[0], spacing[0]),
          }}>
            {summaryText}
          </p>
        )}

        {/* Always-visible signal chips */}
        {hasData && sortedSignals.some(s => s.count > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[4], marginTop: spacing[8] }}>
            {sortedSignals.map(s => {
              const meta = SIGNAL_META[s.signal];
              if (!meta || s.count === 0) return null;
              const barColor = getBarColor(s.value, s.count);
              return (
                <span
                  key={s.signal}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: spacing[2],
                    fontSize: 11, fontWeight: 600,
                    padding: pad(spacing[1], spacing[6]), borderRadius: 6,
                    background: `${barColor}11`, color: barColor,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ fontSize: 10 }}>{meta.icon}</span>
                  {s.value.toFixed(1)}
                </span>
              );
            })}
          </div>
        )}

        {/* Compact signal summary — expandable numeric backup */}
        {hasData && (
          <>
            <button
              onClick={() => setShowNumeric(!showNumeric)}
              style={{
                fontSize: 11, fontWeight: 500, color: colors.textMuted,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: pad(spacing[6], spacing[0], spacing[0]), margin: 0,
              }}
            >
              {showNumeric ? 'Hide numbers' : 'Show numbers'} {showNumeric ? '▴' : '▾'}
            </button>
            {showNumeric && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: spacing[6], marginTop: spacing[6],
              }}>
                {sortedSignals.map(s => {
                  const meta = SIGNAL_META[s.signal];
                  if (!meta || s.count === 0) return null;
                  const barColor = getBarColor(s.value, s.count);
                  return (
                    <span
                      key={s.signal}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: spacing[3],
                        fontSize: 11, fontWeight: 600,
                        padding: pad(spacing[2], spacing[7]), borderRadius: 8,
                        background: colors.surface, border: `1px solid ${colors.borderLight}`,
                        color: barColor, whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ fontSize: 10 }}>{meta.icon}</span>
                      {s.value.toFixed(1)}
                    </span>
                  );
                })}
              </div>
            )}
          </>
        )}

        {hasData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[6], marginTop: spacing[8] }}>
            <p style={{ fontSize: 12, color: isFromSeed ? colors.amber : colors.textTertiary, margin: 0 }}>
              {isFromSeed
                ? 'Estimated from limited data'
                : `From ${summary.contribution_count} hockey parent${summary.contribution_count !== 1 ? 's' : ''}`}
            </p>
            {seasonLabel && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: pad(spacing[2], spacing[8]),
                borderRadius: 10, whiteSpace: 'nowrap',
                background: seasonLabel === 'This season' ? colors.bgSuccess : colors.bgWarning,
                color: seasonLabel === 'This season' ? colors.success : colors.amber,
                border: `1px solid ${seasonLabel === 'This season' ? colors.successBorder : colors.warningBorder}`,
              }}>
                {seasonLabel}
              </span>
            )}
          </div>
        )}
        {hasData && isStale && !isFromSeed && (
          <p style={{
            fontSize: 12, color: colors.amberDark, marginTop: spacing[8], margin: pad(spacing[8], spacing[0], spacing[0]),
            padding: pad(spacing[6], spacing[10]), borderRadius: 8,
            background: colors.bgWarning, border: `1px solid ${colors.amberBorder}`,
            lineHeight: 1.4,
          }}>
            ⚠️ {staleLabel}
          </p>
        )}
      </div>
      <p style={{ fontSize: 10, color: colors.textMuted, margin: pad(spacing[12], spacing[0], spacing[0]), lineHeight: 1.4 }}>
        Ratings and tips reflect personal experiences of visiting hockey parents, not the views of ColdStart. coldstarthockey.com
      </p>
    </section>
  );
}
