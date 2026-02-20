'use client';

import { SIGNAL_ICONS } from '../lib/constants';
import { getBarColor, getBarBg } from '../lib/rinkHelpers';

export function SignalBadge({ signal, value }: { signal: string; value: number }) {
  const color = getBarColor(value);
  const bgColor = getBarBg(value);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 6,
      background: bgColor, fontSize: 11, fontWeight: 600, color,
    }}>
      <span>{SIGNAL_ICONS[signal] || '📊'}</span>
      <span>{value.toFixed(1)}</span>
    </div>
  );
}
