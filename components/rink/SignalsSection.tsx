'use client';

import { SIGNAL_ORDER, SignalType } from '../../lib/constants';
import { ensureAllSignals, getRinkSlug } from '../../lib/rinkHelpers';
import { SignalBar } from './SignalBar';
import { colors } from '../../lib/theme';
import type { Signal, Rink, RinkSummary } from '../../lib/rinkTypes';

interface SignalsSectionProps {
  rink: Rink;
  summary: RinkSummary;
  loadedSignals: Record<string, { value: number; count: number; confidence: number }> | null;
  signalFilter: 'all' | 'tournament' | 'regular';
  onFilterChange: (filter: 'all' | 'tournament' | 'regular') => void;
}

export function SignalsSection({ rink, summary, loadedSignals, signalFilter, onFilterChange }: SignalsSectionProps) {
  const slug = getRinkSlug(rink);
  const allSignals = ensureAllSignals(summary.signals, slug, loadedSignals);
  const sorted = [...allSignals].sort((a, b) => {
    const ai = SIGNAL_ORDER.indexOf(a.signal as SignalType);
    const bi = SIGNAL_ORDER.indexOf(b.signal as SignalType);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <section
      id="signals-section"
      aria-label="Rink signals"
      style={{
        background: colors.white, border: `1px solid ${colors.borderDefault}`,
        borderRadius: 16, marginTop: 16, overflow: 'hidden',
      }}
    >
      {/* Filter toggle */}
      <div style={{
        padding: '10px 24px', background: colors.bgPage, borderBottom: `1px solid ${colors.borderLight}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary }}>Signals</span>
        <div role="group" aria-label="Signal filter">
          {([['all', 'All'], ['tournament', '🏆 Tournament'], ['regular', '📅 Regular']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              aria-pressed={signalFilter === key}
              style={{
                fontSize: 11, fontWeight: signalFilter === key ? 600 : 400,
                padding: '4px 10px', borderRadius: 6,
                background: signalFilter === key ? colors.textPrimary : 'transparent',
                color: signalFilter === key ? colors.white : colors.textMuted,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '0 24px' }}>
        {sorted.map((s, i) => (
          <div key={s.signal}>
            <SignalBar signal={s} rinkSlug={slug} />
            {i < sorted.length - 1 && (
              <div style={{ height: 1, background: colors.borderLight }} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
