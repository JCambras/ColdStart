'use client';

import { useRouter } from 'next/navigation';

export function Logo({ size = 36 }: { size?: number }) {
  const router = useRouter();
  return (
    <span
      onClick={() => router.push('/')}
      style={{
        fontSize: size,
        fontWeight: 800,
        color: '#111827',
        letterSpacing: size >= 48 ? -1 : -0.5,
        cursor: 'pointer',
      }}
    >
      cold<span style={{ color: '#0ea5e9' }}>start</span>{' '}
      <span style={{ fontSize: '0.5em', fontWeight: 500, color: '#6b7280', letterSpacing: 1 }}>
        hockey
      </span>
    </span>
  );
}
