'use client';

import { SIGNAL_ICONS } from '../lib/constants';
import { colors } from '../lib/theme';

export function SignalBadge({ signal, value }: { signal: string; value: number }) {
  const color = value >= 3.5 ? colors.success : value >= 2.5 ? colors.warning : colors.error;
  const bgColor = value >= 3.5 ? colors.bgSuccess : value >= 2.5 ? colors.bgWarning : colors.bgError;
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
