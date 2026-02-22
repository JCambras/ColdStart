'use client';

import { getVerdictColor, getVerdictBg, timeAgo, ensureAllSignals, getRinkSlug, getBarColor } from '../../lib/rinkHelpers';
import { SIGNAL_META, SIGNAL_ORDER, SignalType } from '../../lib/constants';
import { colors } from '../../lib/theme';
import type { Signal, Rink, RinkSummary } from '../../lib/rinkTypes';

interface VerdictCardProps {
  rink: Rink;
  summary: RinkSummary;
  loadedSignals: Record<string, { value: number; count: number; confidence: number }> | null;
}

export function VerdictCard({ rink, summary, loadedSignals }: VerdictCardProps) {
  const hasData = summary.contribution_count > 0;
  const slug = getRinkSlug(rink);
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
        borderRadius: 16, padding: '20px 24px', marginTop: 20,
      }}
    >
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: colors.textTertiary, margin: 0, letterSpacing: 0.3, textTransform: 'uppercase' }}>
          Parents report:
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <p style={{
            fontSize: 18, fontWeight: 700,
            color: getVerdictColor(summary.verdict),
            margin: 0, lineHeight: 1.3,
          }}>
            {summary.verdict}
          </p>
          {freshnessTier === 'fresh' && summary.last_updated_at && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px',
              borderRadius: 10, whiteSpace: 'nowrap',
              background: colors.bgSuccess, color: colors.success,
              border: `1px solid ${colors.successBorder}`,
            }}>
              Updated {timeAgo(summary.last_updated_at)}
            </span>
          )}
          {freshnessTier === 'moderate' && summary.last_updated_at && (
            <span style={{
              fontSize: 10, fontWeight: 500, padding: '2px 8px',
              borderRadius: 10, whiteSpace: 'nowrap',
              color: colors.textMuted,
            }}>
              Updated {timeAgo(summary.last_updated_at)}
            </span>
          )}
        </div>

        {/* Compact signal summary — visible in screenshots */}
        {hasData && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10,
          }}>
            {sortedSignals.map(s => {
              const meta = SIGNAL_META[s.signal];
              if (!meta || s.count === 0) return null;
              const barColor = getBarColor(s.value, s.count);
              return (
                <span
                  key={s.signal}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    fontSize: 11, fontWeight: 600,
                    padding: '2px 7px', borderRadius: 8,
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

        {hasData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <p style={{ fontSize: 12, color: colors.textTertiary, margin: 0 }}>
              From {summary.contribution_count} hockey parent{summary.contribution_count !== 1 ? 's' : ''}
            </p>
            {seasonLabel && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px',
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
        {hasData && isStale && (
          <p style={{
            fontSize: 12, color: colors.amberDark, marginTop: 8, margin: '8px 0 0',
            padding: '6px 10px', borderRadius: 8,
            background: colors.bgWarning, border: `1px solid ${colors.amberBorder}`,
            lineHeight: 1.4,
          }}>
            ⚠️ {staleLabel}
          </p>
        )}
      </div>
      <p style={{ fontSize: 10, color: colors.textMuted, margin: '12px 0 0', lineHeight: 1.4 }}>
        Ratings and tips reflect personal experiences of visiting hockey parents, not the views of ColdStart. coldstarthockey.com
      </p>
    </section>
  );
}
