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

  // Staleness check: >60 days since last update
  const isStale = (() => {
    if (!summary.last_updated_at) return hasData;
    const updated = new Date(summary.last_updated_at).getTime();
    const daysSince = (Date.now() - updated) / (1000 * 60 * 60 * 24);
    return daysSince > 60;
  })();

  const staleLabel = (() => {
    if (!summary.last_updated_at) return 'Last update date unknown — conditions may have changed.';
    const updated = new Date(summary.last_updated_at).getTime();
    const daysSince = (Date.now() - updated) / (1000 * 60 * 60 * 24);
    if (daysSince > 365) return `Last updated over a year ago — conditions may have changed.`;
    const months = Math.floor(daysSince / 30);
    return `Last updated over ${months} month${months !== 1 ? 's' : ''} ago — conditions may have changed.`;
  })();

  // Freshness tiers: fresh (<7d), moderate (7-60d), stale (>60d), unknown
  const freshnessTier = (() => {
    if (!summary.last_updated_at || !hasData) return 'unknown' as const;
    const updated = new Date(summary.last_updated_at).getTime();
    const daysSince = (Date.now() - updated) / (1000 * 60 * 60 * 24);
    if (daysSince <= 7) return 'fresh' as const;
    if (daysSince <= 60) return 'moderate' as const;
    return 'stale' as const;
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
                    background: colors.white, border: `1px solid ${colors.borderLight}`,
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
          <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 8 }}>
            From {summary.contribution_count} hockey parent{summary.contribution_count !== 1 ? 's' : ''} this season
          </p>
        )}
        {hasData && isStale && (
          <p style={{
            fontSize: 12, color: '#92400e', marginTop: 8, margin: '8px 0 0',
            padding: '6px 10px', borderRadius: 8,
            background: '#fffbeb', border: '1px solid #fde68a',
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
