'use client';

import { getVerdictColor, getVerdictBg, timeAgo, ensureAllSignals, getRinkSlug } from '../../lib/rinkHelpers';
import { colors } from '../../lib/theme';
import type { Signal, Rink, RinkSummary } from '../../lib/rinkTypes';

interface VerdictCardProps {
  rink: Rink;
  summary: RinkSummary;
  loadedSignals: Record<string, { value: number; count: number; confidence: number }> | null;
}

export function VerdictCard({ rink, summary, loadedSignals }: VerdictCardProps) {
  const hasData = summary.contribution_count > 0;

  // Staleness check: >60 days since last update
  const isStale = (() => {
    if (!summary.last_updated_at) return hasData; // No date but has data = stale
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
        <p style={{
          fontSize: 18, fontWeight: 700,
          color: getVerdictColor(summary.verdict),
          margin: '2px 0 0', lineHeight: 1.3,
        }}>
          {summary.verdict}
        </p>
        {hasData && (
          <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }}>
            {(() => {
              const allSigs = ensureAllSignals(summary.signals, getRinkSlug(rink), loadedSignals);
              const aboveAvg = allSigs.filter(s => s.value >= 3.0).length;
              const total = allSigs.length;
              return `${aboveAvg} of ${total} parent ratings above average · `;
            })()}
            From {summary.contribution_count} hockey parent{summary.contribution_count !== 1 ? 's' : ''} this season
            {summary.last_updated_at && ` · Updated ${timeAgo(summary.last_updated_at)}`}
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
