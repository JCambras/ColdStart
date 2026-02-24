'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { colors, text, radius, spacing, pad } from '../lib/theme';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{
        minHeight: '100vh', background: colors.bgPage,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: 0,
      }}>
        <div style={{ maxWidth: 400, textAlign: 'center', padding: spacing[32] }}>
          <div style={{ fontSize: 36, marginBottom: spacing[12] }}>🏒</div>
          <h2 style={{ fontSize: text.xl, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: text.md, color: colors.textTertiary, marginTop: 8 }}>
            {process.env.NODE_ENV === 'development'
              ? error.message
              : 'An unexpected error occurred. Please try again.'}
          </p>
          <div style={{ display: 'flex', gap: spacing[10], justifyContent: 'center', marginTop: spacing[20] }}>
            <button
              onClick={reset}
              style={{
                fontSize: text.base, fontWeight: 600, color: colors.textInverse,
                background: colors.brand, border: 'none', borderRadius: radius.lg,
                padding: pad(spacing[10], spacing[24]), cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                fontSize: text.base, fontWeight: 600, color: colors.textTertiary,
                background: colors.bgSubtle, border: `1px solid ${colors.borderDefault}`, borderRadius: radius.lg,
                padding: pad(spacing[10], spacing[24]), textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center',
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
