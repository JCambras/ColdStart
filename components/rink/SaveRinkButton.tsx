'use client';

import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';

export function SaveRinkButton({ rinkId }: { rinkId: string }) {
  const { isLoggedIn, openAuth } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const list = storage.getSavedRinks();
    setSaved(list.includes(rinkId));
  }, [rinkId]);

  function toggle() {
    if (!isLoggedIn) {
      openAuth();
      return;
    }
    const list = storage.getSavedRinks();
    let updated;
    if (list.includes(rinkId)) {
      updated = list.filter((id: string) => id !== rinkId);
      setSaved(false);
    } else {
      updated = [...list, rinkId];
      setSaved(true);
    }
    storage.setSavedRinks(updated);
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
