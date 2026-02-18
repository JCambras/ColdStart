'use client';

import { RefObject } from 'react';
import { colors, text } from '../../lib/theme';

interface HeroSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  searchFocused: boolean;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
  totalRinks: number;
  stateCount: number;
  onClearSearch: () => void;
}

export function HeroSearch({
  query, onQueryChange, searchFocused, onSearchFocus, onSearchBlur,
  searchRef, totalRinks, stateCount, onClearSearch,
}: HeroSearchProps) {
  return (
    <section style={{
      maxWidth: 700, margin: '0 auto',
      padding: 'clamp(40px, 8vw, 80px) 24px 24px', textAlign: 'center',
    }}>
      <h1 style={{
        fontSize: 'clamp(38px, 9vw, 40px)',
        fontWeight: 700, color: colors.textPrimary,
        lineHeight: 1.08, letterSpacing: -1,
      }}>
        Scout the rink before you go.
      </h1>
      <p style={{
        fontSize: 17, color: colors.textTertiary, lineHeight: 1.5,
        marginTop: 16, marginLeft: 'auto', marginRight: 'auto',
      }}>
        Parking, temp, food, and tips — from parents who were just there.
      </p>

      <div style={{ position: 'relative', maxWidth: 560, margin: '32px auto 0' }}>
        <svg
          aria-hidden="true"
          style={{
            position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
            width: 20, height: 20, color: searchFocused ? colors.brand : colors.textMuted,
            transition: 'color 0.2s',
          }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by rink name, city, or state..."
          aria-label="Search rinks"
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
          style={{
            width: '100%', padding: '16px 20px 16px 52px', fontSize: 17,
            border: `2px solid ${searchFocused ? colors.brand : colors.borderDefault}`,
            borderRadius: 16, outline: 'none', background: colors.white,
            color: colors.textPrimary, transition: 'all 0.25s ease',
            boxShadow: searchFocused
              ? '0 0 0 4px rgba(14,165,233,0.1), 0 8px 24px rgba(0,0,0,0.06)'
              : '0 2px 8px rgba(0,0,0,0.04)',
            fontFamily: 'inherit',
          }}
        />
        {query && (
          <button
            onClick={onClearSearch}
            aria-label="Clear search"
            style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 16, color: colors.textMuted, padding: 4,
            }}
          >
            ✕
          </button>
        )}
      </div>
      <p style={{ fontSize: text.sm, color: '#b0b7c3', marginTop: 10 }}>
        {totalRinks > 0 ? `${totalRinks} rinks across ${stateCount} states` : ''}
      </p>
    </section>
  );
}
