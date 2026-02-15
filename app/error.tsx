'use client';

import { useEffect } from 'react';
import { Logo } from '../components/Logo';

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
      minHeight: '100vh', background: '#fafbfc',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: 400, width: '100%', textAlign: 'center', padding: 32,
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20,
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{ marginBottom: 16 }}><Logo size={28} /></div>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🏒</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8, lineHeight: 1.5 }}>
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <button
            onClick={reset}
            style={{
              fontSize: 14, fontWeight: 600, color: '#fff',
              background: '#0ea5e9', border: 'none', borderRadius: 10,
              padding: '10px 24px', cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              fontSize: 14, fontWeight: 600, color: '#6b7280',
              background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
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
