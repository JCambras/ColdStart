'use client';

import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { colors } from '../../lib/theme';

export function ContextToggle() {
  const [context, setContext] = useState<'tournament' | null>(null);

  useEffect(() => {
    const saved = storage.getRatingContext();
    if (saved === 'tournament') setContext('tournament');
  }, []);

  function toggle(val: 'tournament' | null) {
    setContext(val);
    storage.setRatingContext(val as string);
  }

  return (
    <div style={{ display: 'flex', gap: 6 }} role="group" aria-label="Rating context">
      {([['tournament', '\u{1F3C6} Tournament'], [null, '\u{1F4C5} Regular']] as const).map(([val, label]) => (
        <button
          key={String(val)}
          onClick={() => toggle(val as 'tournament' | null)}
          aria-pressed={context === val}
          style={{
            fontSize: 12, fontWeight: context === val ? 600 : 400,
            padding: '5px 12px', borderRadius: 20,
            background: context === val ? (val === 'tournament' ? colors.bgWarning : 'transparent') : 'transparent',
            color: context === val ? (val === 'tournament' ? colors.amber : colors.textMuted) : colors.textMuted,
            border: `1px solid ${context === val ? (val === 'tournament' ? colors.amberBorder : 'transparent') : 'transparent'}`,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
