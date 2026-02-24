'use client';

import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { colors, spacing, pad } from '../../lib/theme';

function getCurrentSeason(): { id: string; startTs: number } {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed: 0=Jan, 8=Sep
  const year = now.getFullYear();
  const startYear = month >= 8 ? year : year - 1;
  const id = `${startYear}-${startYear + 1}`;
  const startTs = new Date(startYear, 8, 1).getTime(); // Sep 1
  return { id, startTs };
}

export function SeasonWelcome() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const rated = storage.getRatedRinks();
    const timestamps = Object.values(rated);
    if (timestamps.length === 0) return;

    const mostRecent = Math.max(...timestamps);
    const { id, startTs } = getCurrentSeason();

    if (mostRecent < startTs && storage.getSeasonWelcomeDismissed() !== id) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    const { id } = getCurrentSeason();
    storage.setSeasonWelcomeDismissed(id);
    setShow(false);
  }

  return (
    <section style={{
      background: colors.bgInfo,
      border: `1px solid ${colors.brandLight}`,
      borderRadius: 14,
      padding: pad(spacing[14], spacing[18]),
      display: 'flex',
      alignItems: 'flex-start',
      gap: spacing[12],
    }}>
      <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>🏒</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.brandDark }}>
          Welcome back for the new season
        </div>
        <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: spacing[4], lineHeight: 1.5, margin: pad(spacing[4], spacing[0], spacing[0]) }}>
          Your ratings from last year helped families find their way. Rinks may have changed — re-rate after your first visit.
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss welcome banner"
        style={{
          fontSize: 11, color: colors.textMuted, background: 'none',
          border: 'none', cursor: 'pointer', padding: pad(spacing[2], spacing[4]), flexShrink: 0,
        }}
      >
        ✕
      </button>
    </section>
  );
}
