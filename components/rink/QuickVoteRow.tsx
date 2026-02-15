'use client';

import { useState, useEffect, useRef } from 'react';
import { SIGNAL_META, SignalType } from '../../lib/constants';
import { RinkSummary } from '../../lib/rinkTypes';
import { apiPost } from '../../lib/api';
import { storage } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../lib/theme';

interface QuickVoteRowProps {
  rinkId: string;
  context: string;
  onSummaryUpdate: (s: RinkSummary) => void;
}

export function QuickVoteRow({ rinkId, context, onSummaryUpdate }: QuickVoteRowProps) {
  const { isLoggedIn, openAuth } = useAuth();
  const [activeSignal, setActiveSignal] = useState<SignalType | null>(null);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justRated, setJustRated] = useState<string | null>(null);
  const pendingSubmitRef = useRef<{ signal: SignalType; value: number } | null>(null);

  useEffect(() => {
    if (isLoggedIn && pendingSubmitRef.current) {
      const { signal, value } = pendingSubmitRef.current;
      pendingSubmitRef.current = null;
      setActiveSignal(signal);
      submitRating(value);
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const signals: { key: SignalType; icon: string; label: string }[] = [
    { key: 'parking', icon: '🅿️', label: 'Parking' },
    { key: 'cold', icon: '❄️', label: 'Cold' },
    { key: 'food_nearby', icon: '🍔', label: 'Food' },
    { key: 'chaos', icon: '🌀', label: 'Chaos' },
    { key: 'family_friendly', icon: '👨‍👩‍👧', label: 'Family' },
    { key: 'locker_rooms', icon: '🚪', label: 'Lockers' },
    { key: 'pro_shop', icon: '🏒', label: 'Pro shop' },
  ];

  async function submitRating(value: number) {
    if (!activeSignal || submitting) return;
    if (!isLoggedIn) {
      pendingSubmitRef.current = { signal: activeSignal, value };
      openAuth();
      return;
    }
    setSubmitting(true);
    const contributorType = storage.getContributorType();
    const { data } = await apiPost<{ summary?: RinkSummary }>('/contributions', {
      rink_id: rinkId, kind: 'signal_rating', contributor_type: contributorType,
      context, signal_rating: { signal: activeSignal, value },
    });
    if (data?.summary) onSummaryUpdate(data.summary);
    setJustRated(activeSignal);
    setActiveSignal(null);
    setTimeout(() => setJustRated(null), 2000);
    setSubmitting(false);
  }

  return (
    <div>
      {!activeSignal && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} role="group" aria-label="Select a signal to rate">
          {signals.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSignal(s.key)}
              aria-label={`Rate ${s.label}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 14px', borderRadius: 12,
                background: justRated === s.key ? colors.bgSuccess : colors.bgPage,
                border: `1px solid ${justRated === s.key ? colors.successBorder : colors.borderDefault}`,
                cursor: 'pointer', transition: 'all 0.15s', minWidth: 64,
              }}
              onMouseEnter={(e) => { if (justRated !== s.key) { e.currentTarget.style.borderColor = colors.brand; e.currentTarget.style.background = colors.bgInfo; } }}
              onMouseLeave={(e) => { if (justRated !== s.key) { e.currentTarget.style.borderColor = colors.borderDefault; e.currentTarget.style.background = colors.bgPage; } }}
            >
              <span style={{ fontSize: 22 }}>{justRated === s.key ? '✓' : s.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: justRated === s.key ? colors.success : colors.textTertiary }}>{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {activeSignal && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{SIGNAL_META[activeSignal]?.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>{SIGNAL_META[activeSignal]?.label}</span>
            <button onClick={() => setActiveSignal(null)} aria-label="Cancel rating" style={{ fontSize: 11, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} role="group" aria-label={`Rate ${SIGNAL_META[activeSignal]?.label} from 1 to 5`}>
            {[1, 2, 3, 4, 5].map(v => (
              <button
                key={v}
                onClick={() => submitRating(v)}
                onMouseEnter={() => setHoveredValue(v)}
                onMouseLeave={() => setHoveredValue(null)}
                aria-label={`Rate ${v} out of 5`}
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  border: `1.5px solid ${hoveredValue === v ? colors.brand : colors.borderDefault}`,
                  background: hoveredValue === v ? colors.bgInfo : colors.white,
                  color: colors.textSecondary, fontSize: 18, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 280, margin: '6px auto 0', padding: '0 4px' }}>
            <span style={{ fontSize: 10, color: colors.textMuted }}>← {SIGNAL_META[activeSignal]?.lowLabel}</span>
            <span style={{ fontSize: 10, color: colors.textMuted }}>{SIGNAL_META[activeSignal]?.highLabel} →</span>
          </div>
        </div>
      )}
    </div>
  );
}
