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

  return (
    <section
      aria-label="Rink verdict"
      style={{
        background: getVerdictBg(summary.verdict),
        border: `1px solid ${getVerdictColor(summary.verdict)}22`,
        borderRadius: 16, padding: '20px 24px', marginTop: 20,
      }}
    >
      <div>
        <p style={{
          fontSize: 18, fontWeight: 700,
          color: getVerdictColor(summary.verdict),
          margin: 0, lineHeight: 1.3,
        }}>
          {summary.verdict}
        </p>
        {hasData && (
          <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }}>
            {(() => {
              const allSigs = ensureAllSignals(summary.signals, getRinkSlug(rink), loadedSignals);
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
  );
}
