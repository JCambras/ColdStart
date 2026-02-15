'use client';

import { useState, useEffect } from 'react';

export function SaveRinkButton({ rinkId, isLoggedIn, onAuthRequired }: { rinkId: string; isLoggedIn: boolean; onAuthRequired: () => void }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem('coldstart_my_rinks') || '[]');
      setSaved(list.includes(rinkId));
    } catch {}
  }, [rinkId]);

  function toggle() {
    if (!isLoggedIn) {
      onAuthRequired();
      return;
    }
    try {
      const list = JSON.parse(localStorage.getItem('coldstart_my_rinks') || '[]');
      let updated;
      if (list.includes(rinkId)) {
        updated = list.filter((id: string) => id !== rinkId);
        setSaved(false);
      } else {
        updated = [...list, rinkId];
        setSaved(true);
      }
      localStorage.setItem('coldstart_my_rinks', JSON.stringify(updated));
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      style={{
        fontSize: 12, fontWeight: 600,
        color: saved ? '#d97706' : '#6b7280',
        background: saved ? '#fffbeb' : '#f9fafb',
        border: `1px solid ${saved ? '#fde68a' : '#e5e7eb'}`,
        borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
        transition: 'all 0.15s', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      {saved ? '⭐ Saved' : '☆ Save rink'}
    </button>
  );
}
