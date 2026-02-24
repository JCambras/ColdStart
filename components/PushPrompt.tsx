'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../lib/storage';
import { isPushSupported, isPushSubscribed, subscribeToPush } from '../lib/pushClient';
import { colors, radius, spacing, pad } from '../lib/theme';

export function PushPrompt() {
  const { isLoggedIn } = useAuth();
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (!isLoggedIn) return;
    if (isPushSubscribed()) return;

    const savedRinks = storage.getSavedRinks();
    if (savedRinks.length === 0) return;

    const dismissedAt = storage.getPushDismissedAt();
    if (dismissedAt) {
      const daysSince = (Date.now() - new Date(dismissedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }

    setVisible(true);
  }, [isLoggedIn]);

  if (!visible) return null;

  async function handleEnable() {
    setSubscribing(true);
    const savedRinks = storage.getSavedRinks();
    const ok = await subscribeToPush(savedRinks);
    if (ok) {
      setVisible(false);
    }
    setSubscribing(false);
  }

  function handleDismiss() {
    storage.setPushDismissedAt(new Date().toISOString());
    setVisible(false);
  }

  return (
    <div style={{
      maxWidth: 600, margin: '0 auto', padding: pad(spacing[0], spacing[24]),
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: spacing[12],
        padding: pad(spacing[12], spacing[16]),
        background: colors.bgInfo, border: `1px solid ${colors.brandLight}`,
        borderRadius: radius.xl,
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>&#128276;</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, margin: spacing[0] }}>
            Get notified when someone adds intel to your saved rinks
          </p>
        </div>
        <button
          onClick={handleEnable}
          disabled={subscribing}
          style={{
            fontSize: 12, fontWeight: 600,
            color: colors.textInverse, background: colors.brand,
            border: 'none', borderRadius: radius.md,
            padding: pad(spacing[8], spacing[14]), cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
            opacity: subscribing ? 0.6 : 1,
          }}
        >
          {subscribing ? 'Enabling...' : 'Enable'}
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            fontSize: 16, color: colors.textMuted,
            background: 'none', border: 'none',
            cursor: 'pointer', padding: pad(spacing[4], spacing[8]),
            flexShrink: 0, lineHeight: 1,
          }}
        >
          &#10005;
        </button>
      </div>
    </div>
  );
}
