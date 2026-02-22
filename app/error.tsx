'use client';

import { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { colors, text, radius } from '../lib/theme';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh', background: colors.bgPage,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: 400, width: '100%', textAlign: 'center', padding: 32,
        background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 20,
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{ marginBottom: 16 }}><Logo size={28} /></div>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🏒</div>
        <h2 style={{ fontSize: text.xl, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: text.md, color: colors.textTertiary, marginTop: 8, lineHeight: 1.5 }}>
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <button
            onClick={reset}
            style={{
              fontSize: text.base, fontWeight: 600, color: colors.textInverse,
              background: colors.brand, border: 'none', borderRadius: radius.lg,
              padding: '10px 24px', cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              fontSize: text.base, fontWeight: 600, color: colors.textTertiary,
              background: colors.bgSubtle, border: `1px solid ${colors.borderDefault}`, borderRadius: radius.lg,
              padding: '10px 24px', cursor: 'pointer', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center',
            }}
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
