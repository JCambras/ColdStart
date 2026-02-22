'use client';

import { colors, text, radius } from '../lib/theme';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{
        minHeight: '100vh', background: colors.bgPage,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: 0,
      }}>
        <div style={{ maxWidth: 400, textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏒</div>
          <h2 style={{ fontSize: text.xl, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: text.md, color: colors.textTertiary, marginTop: 8 }}>
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
                padding: '10px 24px', textDecoration: 'none',
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
