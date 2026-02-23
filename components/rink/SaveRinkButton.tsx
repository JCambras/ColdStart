'use client';

import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import { colors, text, radius } from '../../lib/theme';

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
    // Sync watched rinks for push notifications
    import('../../lib/pushClient').then(({ syncPushWatchedRinks }) => {
      syncPushWatchedRinks(updated);
    }).catch(() => {});
  }

  return (
    <button
      onClick={toggle}
      style={{
        fontSize: text.sm, fontWeight: 600,
        color: saved ? colors.warning : colors.textTertiary,
        background: saved ? colors.bgWarning : colors.bgSubtle,
        border: `1px solid ${saved ? colors.warningBorder : colors.borderDefault}`,
        borderRadius: radius.md, padding: '6px 14px', cursor: 'pointer',
        transition: 'all 0.15s', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 4,
      }}
    >
      {saved ? '⭐ Saved' : '☆ Save rink'}
    </button>
  );
}
