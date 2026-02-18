'use client';

import { useRouter } from 'next/navigation';
import { colors } from '../lib/theme';

export function Logo({ size = 36, stacked = false }: { size?: number; stacked?: boolean }) {
  const router = useRouter();

  if (stacked) {
    return (
      <span
        onClick={() => router.push('/')}
        style={{
          fontSize: size, fontWeight: 800,
          color: colors.textPrimary,
          letterSpacing: -1,
          cursor: 'pointer',
        }}
      >
        cold<span style={{ color: colors.brand }}>start</span>{' '}
        <span style={{ fontSize: '0.45em', fontWeight: 500, color: colors.textTertiary, letterSpacing: 1 }}>
          hockey
        </span>
      </span>
    );
  }

  return (
    <span
      onClick={() => router.push('/')}
      style={{
        fontSize: size,
        fontWeight: 800,
        color: colors.textPrimary,
        letterSpacing: size >= 48 ? -1 : -0.5,
        cursor: 'pointer',
      }}
    >
      cold<span style={{ color: colors.brand }}>start</span>{' '}
      <span style={{ fontSize: '0.5em', fontWeight: 500, color: colors.textTertiary, letterSpacing: 1 }}>
        hockey
      </span>
    </span>
  );
}
