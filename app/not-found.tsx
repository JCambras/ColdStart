'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '../components/Logo';
import { colors, text, radius } from '../lib/theme';

export default function NotFound() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSearch() {
    const q = query.trim();
    if (q) router.push(`/?q=${encodeURIComponent(q)}`);
    else router.push('/');
  }

  return (
    <div style={{
      minHeight: '100vh', background: colors.bgPage,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: 400, width: '100%', textAlign: 'center', padding: 32,
        background: colors.white, border: `1px solid ${colors.borderDefault}`, borderRadius: 20,
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{ marginBottom: 16 }}><Logo size={28} /></div>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🏒</div>
        <h2 style={{ fontSize: text.xl, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
          Rink not found
        </h2>
        <p style={{ fontSize: text.md, color: colors.textTertiary, marginTop: 8, lineHeight: 1.5 }}>
          We couldn&apos;t find that page. Try searching for a rink instead.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Search rinks..."
            style={{
              flex: 1, fontSize: text.base, padding: '10px 14px',
              border: `1px solid ${colors.borderDefault}`, borderRadius: radius.lg,
              outline: 'none', fontFamily: 'inherit', color: colors.textPrimary,
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              fontSize: text.base, fontWeight: 600, color: colors.white,
              background: colors.brand, border: 'none', borderRadius: radius.lg,
              padding: '10px 18px', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Search
          </button>
        </div>
        <a
          href="/"
          style={{
            display: 'inline-block', marginTop: 16,
            fontSize: text.md, color: colors.textTertiary, textDecoration: 'underline',
            textUnderlineOffset: 2,
          }}
        >
          Back to home
        </a>
      </div>
    </div>
  );
}
