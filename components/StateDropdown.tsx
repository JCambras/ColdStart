'use client';

import { useState, useRef } from 'react';
import { US_STATES, HOCKEY_STATES } from '../lib/constants';
import { colors, text } from '../lib/theme';

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

  return (
    <div
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ position: 'relative' }}
    >
      <span style={{ fontSize: text.md, color: colors.textTertiary, cursor: 'pointer', userSelect: 'none' }}>
        Browse by state ▾
      </span>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8,
          background: '#fff', border: `1px solid ${colors.borderDefault}`, borderRadius: 14,
          boxShadow: '0 20px 50px rgba(0,0,0,0.12)', padding: '12px 0',
          width: 280, maxHeight: 400, overflowY: 'auto', zIndex: 200,
        }}>
          <div style={{ padding: '0 16px 8px', fontSize: text['2xs'], fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
            Top hockey states
          </div>
          {HOCKEY_STATES.map(code => (
            <div
              key={code}
              onClick={() => { onSelect(code); setOpen(false); }}
              style={{
                padding: '8px 16px', cursor: 'pointer', fontSize: text.md, color: colors.textSecondary,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.bgInfo; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {US_STATES[code]} <span style={{ color: colors.textMuted, fontSize: text.xs }}>({code})</span>
            </div>
          ))}
          <div style={{ height: 1, background: colors.borderLight, margin: '8px 16px' }} />
          <div style={{ padding: '0 16px 8px', fontSize: text['2xs'], fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
            All states
          </div>
          {Object.entries(US_STATES)
            .filter(([code]) => !HOCKEY_STATES.includes(code))
            .sort((a, b) => a[1].localeCompare(b[1]))
            .map(([code, name]) => (
              <div
                key={code}
                onClick={() => { onSelect(code); setOpen(false); }}
                style={{
                  padding: '8px 16px', cursor: 'pointer', fontSize: text.md, color: colors.textSecondary,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = colors.bgInfo; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {name} <span style={{ color: colors.textMuted, fontSize: text.xs }}>({code})</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
