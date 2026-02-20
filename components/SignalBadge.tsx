'use client';

import { SIGNAL_ICONS, SIGNAL_LABELS } from '../lib/constants';
import { getBadgeTextColor, getBarBg } from '../lib/rinkHelpers';

export function SignalBadge({ signal, value, count }: { signal: string; value: number; count?: number }) {
  const color = getBadgeTextColor(value, count);
  const bgColor = getBarBg(value, count);
  const label = SIGNAL_LABELS[signal] || signal;
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 8px', borderRadius: 6,
        background: bgColor, fontSize: 11, fontWeight: 600, color,
      }}
      aria-label={`${label}: ${value.toFixed(1)} out of 5`}
    >
      <span aria-hidden="true">{SIGNAL_ICONS[signal] || '📊'}</span>
      <span>{value.toFixed(1)}</span>
    </div>
  );
}
