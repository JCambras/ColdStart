'use client';

import { useState } from 'react';
import { SIGNAL_META } from '../../lib/constants';
import { Signal } from '../../lib/rinkTypes';
import { FACILITY_DETAILS } from '../../lib/seedData';
import { getBarColor } from '../../lib/rinkHelpers';
import { colors, text, radius } from '../../lib/theme';

/** Contextual label when above/below average, per signal type */
const CONTEXT_LABELS: Record<string, { above: string; below: string }> = {
  parking: { above: 'Better than most rinks', below: 'Tighter than most rinks' },
  cold: { above: 'More comfortable than most rinks', below: 'Colder than most rinks' },
  food_nearby: { above: 'More options than most', below: 'Fewer options than most' },
  chaos: { above: 'Better organized than most rinks', below: 'More hectic than most' },
  family_friendly: { above: 'More welcoming than most', below: 'Less family-friendly than most' },
  locker_rooms: { above: 'Roomier than most rinks', below: 'Tighter than most rinks' },
  pro_shop: { above: 'Better stocked than most', below: 'Sparser than most rinks' },
};

export function SignalBar({ signal, rinkSlug, stateAverage }: { signal: Signal; rinkSlug: string; stateAverage?: number | null }) {
  const meta = SIGNAL_META[signal.signal] || { label: signal.signal, icon: '', lowLabel: '1', highLabel: '5', info: '' };
  const noData = signal.count === 0;
  const pct = noData ? 0 : Math.round(((signal.value - 1) / 4) * 100);
  const color = noData ? colors.textMuted : getBarColor(signal.value, signal.count);
  const [expanded, setExpanded] = useState(false);
  const facilityDetail = FACILITY_DETAILS[rinkSlug]?.[signal.signal];
  const highVariance = !noData && signal.count >= 3 && (signal.stddev ?? 0) > 1.5;

  // Compute contextual label comparing to state average
  const contextLabel = (() => {
    if (noData || !stateAverage || signal.count < 3) return null;
    const diff = signal.value - stateAverage;
    const labels = CONTEXT_LABELS[signal.signal];
    if (!labels) return null;
    // Only show label when difference is meaningful (>0.3)
    if (Math.abs(diff) < 0.3) return null;
    return diff > 0 ? labels.above : labels.below;
  })();

  return (
    <div
      role="button"
      tabIndex={0}
      style={{ padding: '14px 0', cursor: 'pointer', opacity: noData ? 0.6 : 1 }}
      onClick={() => setExpanded(!expanded)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: text.base, fontWeight: 500, color: noData ? colors.textMuted : colors.textSecondary }}>
            {meta.icon} {meta.label}
          </span>
          <span style={{
            fontSize: text['2xs'], color: colors.textMuted,
            transform: expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s', display: 'inline-block',
          }}>
            ▸
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {noData ? (
            <span style={{ fontSize: text.sm, fontWeight: 500, color: colors.textMuted, fontStyle: 'italic' }}>—</span>
          ) : (
            <>
              <span style={{ fontSize: 22, fontWeight: 700, color }}>{signal.value.toFixed(1)}<span style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted }}>/5</span></span>
              <span style={{ fontSize: text.xs, color: colors.textMuted, marginLeft: 4 }}>
                {signal.value >= 4 ? meta.highLabel : signal.value >= 3 ? 'Average' : meta.lowLabel}
              </span>
            </>
          )}
        </div>
      </div>
      <div style={{ height: 10, background: colors.borderLight, borderRadius: 5, overflow: 'hidden' }}>
        <div style={{
          width: noData ? '0%' : `${pct}%`,
          height: '100%',
          borderRadius: 5,
          background: color,
          transition: 'width 0.8s ease',
        }} />
      </div>
      {!expanded && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontSize: text['2xs'], color: colors.textMuted }}>{meta.lowLabel}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {contextLabel && (
              <span style={{
                fontSize: text['2xs'], color: signal.value > (stateAverage ?? 3) ? colors.success : '#92400e',
                fontWeight: 500,
              }}>
                {contextLabel}
              </span>
            )}
            {highVariance && (
              <span style={{
                fontSize: text['2xs'], fontWeight: 600, padding: '1px 8px', borderRadius: 6,
                background: colors.bgWarning, color: '#92400e', border: '1px solid #fde68a',
              }}>
                Parents are split
              </span>
            )}
            <span style={{
              fontSize: text.sm,
              fontWeight: noData ? 400 : 600,
              color: noData ? colors.textMuted : signal.count < 3 ? '#92400e' : colors.textMuted,
              fontStyle: noData ? 'italic' : 'normal',
              ...(signal.count > 0 && signal.count < 3 ? {
                background: '#fffbeb', padding: '1px 8px', borderRadius: 6, border: '1px solid #fde68a',
              } : {}),
            }}>
              {noData ? 'No ratings yet' : signal.count < 3
                ? `Early — ${signal.count} rating${signal.count !== 1 ? 's' : ''}`
                : `${signal.count} rating${signal.count !== 1 ? 's' : ''}`
              }
            </span>
          </div>
          <span style={{ fontSize: text['2xs'], color: colors.textMuted }}>{meta.highLabel}</span>
        </div>
      )}
      {expanded && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: text['2xs'], color: colors.textMuted }}>← {meta.lowLabel}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {contextLabel && (
                <span style={{
                  fontSize: text['2xs'], color: signal.value > (stateAverage ?? 3) ? colors.success : '#92400e',
                  fontWeight: 500,
                }}>
                  {contextLabel}
                </span>
              )}
              <span style={{
                fontSize: text.sm,
                fontWeight: noData ? 400 : 600,
                color: noData ? colors.textMuted : signal.count < 3 ? '#92400e' : colors.textSecondary,
                fontStyle: noData ? 'italic' : 'normal',
                ...(signal.count > 0 && signal.count < 3 ? {
                  background: '#fffbeb', padding: '1px 8px', borderRadius: 6, border: '1px solid #fde68a',
                } : {}),
              }}>
                {noData ? 'No ratings yet' : signal.count < 3
                  ? `Early — ${signal.count} rating${signal.count !== 1 ? 's' : ''}`
                  : `Based on ${signal.count} rating${signal.count !== 1 ? 's' : ''}`
                }
              </span>
            </div>
            <span style={{ fontSize: text['2xs'], color: colors.textMuted }}>{meta.highLabel} →</span>
          </div>
          {meta.info && (
            <div style={{
              fontSize: text.sm, color: colors.textTertiary, lineHeight: 1.5,
              background: '#f8fafc', border: `1px solid ${colors.borderDefault}`,
              borderRadius: radius.md, padding: '8px 12px', marginTop: 4,
            }}>
              {meta.info}
            </div>
          )}
          {facilityDetail && (
            <div style={{
              marginTop: 6, padding: '8px 12px',
              background: colors.indigoBg, border: `1px solid ${colors.indigoBorder}`,
              borderRadius: radius.md, borderLeft: `3px solid ${colors.brandAccent}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                  background: colors.brandAccent, color: colors.textInverse, textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  Verified
                </span>
                <span style={{ fontSize: text['2xs'], fontWeight: 600, color: colors.indigo }}>
                  {facilityDetail.name}, Rink Manager
                </span>
              </div>
              <p style={{ fontSize: text.xs, color: colors.indigo, lineHeight: 1.4, margin: 0 }}>
                {facilityDetail.text}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
