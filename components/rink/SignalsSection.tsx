'use client';

import { useState, useEffect } from 'react';
import { SIGNAL_ORDER, SignalType } from '../../lib/constants';
import { ensureAllSignals, getRinkSlug } from '../../lib/rinkHelpers';
import { seedGet } from '../../lib/api';
import { SignalBar } from './SignalBar';
import { colors, spacing, pad } from '../../lib/theme';
import type { Signal, Rink, RinkSummary } from '../../lib/rinkTypes';

interface SignalsSectionProps {
  rink: Rink;
  summary: RinkSummary;
  loadedSignals: Record<string, { value: number; count: number; confidence: number }> | null;
  isFromSeed?: boolean;
}

export function SignalsSection({ rink, summary, loadedSignals, isFromSeed }: SignalsSectionProps) {
  const slug = getRinkSlug(rink);
  const allSignals = ensureAllSignals(summary.signals, slug, loadedSignals);
  const sorted = [...allSignals].sort((a, b) => {
    const ai = SIGNAL_ORDER.indexOf(a.signal as SignalType);
    const bi = SIGNAL_ORDER.indexOf(b.signal as SignalType);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const [stateAvg, setStateAvg] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    seedGet<Record<string, Record<string, number>>>('/data/signal-averages.json')
      .then(data => {
        if (!data) return;
        const avg = data[rink.state] || data['_overall'] || null;
        setStateAvg(avg);
      })
      .catch(() => {});
  }, [rink.state]);

  return (
    <section
      id="signals-section"
      aria-label="Rink ratings"
      style={{
        background: colors.surface, border: `1px solid ${colors.borderDefault}`,
        borderRadius: 16, marginTop: spacing[16], overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: pad(spacing[10], spacing[24]), background: colors.bgPage, borderBottom: `1px solid ${colors.borderLight}`,
        display: 'flex', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Ratings</span>
        {isFromSeed && (
          <span style={{
            fontSize: 10, fontWeight: 600, marginLeft: spacing[8],
            padding: pad(spacing[2], spacing[8]), borderRadius: 10,
            background: colors.bgWarning, color: colors.amber,
            border: `1px solid ${colors.warningBorder}`,
          }}>
            Estimated
          </span>
        )}
      </div>
      <div style={{ padding: pad(spacing[0], spacing[24]) }}>
        {sorted.map((s, i) => (
          <div key={s.signal}>
            <SignalBar signal={s} rinkSlug={slug} stateAverage={stateAvg?.[s.signal] ?? null} />
            {i < sorted.length - 1 && (
              <div style={{ height: 1, background: colors.borderLight }} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
