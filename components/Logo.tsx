'use client';

import { useRouter } from 'next/navigation';
import { colors } from '../lib/theme';

export function Logo({ size = 36, stacked = false, light = false }: { size?: number; stacked?: boolean; light?: boolean }) {
  const router = useRouter();

  if (stacked) {
    return (
      <span
        onClick={() => router.push('/')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1.1,
          cursor: 'pointer',
        }}
      >
        <span style={{
          fontSize: size, fontWeight: 800,
          color: light ? 'rgba(255,255,255,0.95)' : colors.navy900,
          letterSpacing: -1,
          whiteSpace: 'nowrap',
        }}>
          Cold<span style={{ color: light ? 'rgba(255,255,255,0.95)' : colors.brand }}>Start</span>
        </span>
        <span style={{
          fontSize: size * 0.45, fontWeight: 500,
          color: light ? 'rgba(255,255,255,0.45)' : colors.textTertiary, letterSpacing: 1,
        }}>
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
        color: light ? 'rgba(255,255,255,0.95)' : colors.navy900,
        letterSpacing: size >= 48 ? -1 : -0.5,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      Cold<span style={{ color: light ? 'rgba(255,255,255,0.95)' : colors.brand }}>Start</span>{' '}
      <span style={{ fontSize: '0.5em', fontWeight: 500, color: light ? 'rgba(255,255,255,0.45)' : colors.textTertiary, letterSpacing: 1 }}>
        hockey
      </span>
    </span>
  );
}
