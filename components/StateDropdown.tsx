'use client';

import { useState, useRef, useEffect } from 'react';
import { US_STATES, HOCKEY_STATES } from '../lib/constants';
import { colors, text, spacing, pad } from '../lib/theme';

export function StateDropdown({ onSelect }: { onSelect: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  function handleEnter() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  }
  function handleLeave() {
    timerRef.current = setTimeout(() => setOpen(false), 200);
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const allStates = Object.entries(US_STATES)
    .filter(([code]) => !HOCKEY_STATES.includes(code))
    .sort((a, b) => a[1].localeCompare(b[1]));

  function handleItemKeyDown(e: React.KeyboardEvent, code: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(code);
      setOpen(false);
    }
  }

  return (
    <div
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ position: 'relative' }}
    >
      <button
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); } }}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          fontSize: text.md, color: colors.textTertiary, cursor: 'pointer', userSelect: 'none',
          background: 'none', border: 'none', padding: spacing[0], font: 'inherit',
        }}
      >
        Browse by state ▾
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Select a state"
          style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: spacing[8],
            background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 14,
            boxShadow: '0 20px 50px rgba(0,0,0,0.12)', padding: pad(spacing[12], spacing[0]),
            width: 280, maxHeight: 400, overflowY: 'auto', zIndex: 200,
          }}
        >
          <div style={{ padding: pad(spacing[0], spacing[16], spacing[8]), fontSize: text['2xs'], fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
            Top hockey states
          </div>
          {HOCKEY_STATES.map(code => (
            <div
              key={code}
              role="option"
              tabIndex={0}
              onClick={() => { onSelect(code); setOpen(false); }}
              onKeyDown={(e) => handleItemKeyDown(e, code)}
              style={{
                padding: pad(spacing[8], spacing[16]), cursor: 'pointer', fontSize: text.md, color: colors.textSecondary,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.bgInfo; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              onFocus={(e) => { e.currentTarget.style.background = colors.bgInfo; }}
              onBlur={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {US_STATES[code]} <span style={{ color: colors.textMuted, fontSize: text.xs }}>({code})</span>
            </div>
          ))}
          <div style={{ height: 1, background: colors.borderLight, margin: pad(spacing[8], spacing[16]) }} />
          <div style={{ padding: pad(spacing[0], spacing[16], spacing[8]), fontSize: text['2xs'], fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
            All states
          </div>
          {allStates.map(([code, name]) => (
            <div
              key={code}
              role="option"
              tabIndex={0}
              onClick={() => { onSelect(code); setOpen(false); }}
              onKeyDown={(e) => handleItemKeyDown(e, code)}
              style={{
                padding: pad(spacing[8], spacing[16]), cursor: 'pointer', fontSize: text.md, color: colors.textSecondary,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.bgInfo; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              onFocus={(e) => { e.currentTarget.style.background = colors.bgInfo; }}
              onBlur={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {name} <span style={{ color: colors.textMuted, fontSize: text.xs }}>({code})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
