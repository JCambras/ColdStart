'use client';

import { useState, useEffect } from 'react';
import { isPushSupported, isPushSubscribed, subscribeToPush, unsubscribeFromPush } from '../lib/pushClient';
import { storage } from '../lib/storage';
import { colors, radius, spacing, pad } from '../lib/theme';

export function PushPreferences() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    setSubscribed(isPushSubscribed());
  }, []);

  if (!supported) return null;

  async function handleToggle() {
    setLoading(true);
    if (subscribed) {
      const ok = await unsubscribeFromPush();
      if (ok) setSubscribed(false);
    } else {
      const savedRinks = storage.getSavedRinks();
      const ok = await subscribeToPush(savedRinks);
      if (ok) setSubscribed(true);
    }
    setLoading(false);
  }

  return (
    <div style={{
      padding: pad(spacing[16], spacing[20]), borderRadius: radius.xl,
      background: colors.bgSubtle, border: `1px solid ${colors.borderLight}`,
      marginBottom: spacing[24],
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
            Push notifications
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: spacing[2] }}>
            {subscribed
              ? 'Get notified when someone adds intel to your saved rinks'
              : 'Enable to get updates about your saved rinks'}
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          style={{
            fontSize: 12, fontWeight: 600,
            color: subscribed ? colors.textTertiary : colors.textInverse,
            background: subscribed ? colors.bgSubtle : colors.brand,
            border: `1px solid ${subscribed ? colors.borderDefault : colors.brand}`,
            borderRadius: radius.md, padding: pad(spacing[8], spacing[16]),
            cursor: 'pointer', whiteSpace: 'nowrap',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '...' : subscribed ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  );
}
