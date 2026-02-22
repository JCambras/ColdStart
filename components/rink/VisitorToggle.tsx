'use client';

import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { colors } from '../../lib/theme';

export function VisitorToggle() {
  const [type, setType] = useState<'visiting_parent' | 'local_parent'>('visiting_parent');

  useEffect(() => {
    const saved = storage.getContributorType();
    if (saved === 'local_parent' || saved === 'visiting_parent') setType(saved);
  }, []);

  function toggle() {
    const next = type === 'visiting_parent' ? 'local_parent' : 'visiting_parent';
    setType(next);
    storage.setContributorType(next);
  }

  return (
    <div style={{ display: 'flex', gap: 6 }} role="group" aria-label="Visitor type">
      {([['visiting_parent', '✈️ Visiting'], ['local_parent', '🏠 Regular']] as const).map(([val, label]) => (
        <button
          key={val}
          onClick={toggle}
          aria-pressed={type === val}
          style={{
            fontSize: 12, fontWeight: type === val ? 600 : 400,
            padding: '5px 12px', borderRadius: 20,
            background: type === val ? (val === 'local_parent' ? colors.indigoBg : colors.purpleBg) : 'transparent',
            color: type === val ? (val === 'local_parent' ? colors.indigo : colors.purple) : colors.textMuted,
            border: `1px solid ${type === val ? (val === 'local_parent' ? colors.indigoBorder : colors.purpleBorder) : 'transparent'}`,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
