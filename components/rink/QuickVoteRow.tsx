'use client';

import { useState } from 'react';
import { SIGNAL_META, SignalType } from '../../lib/constants';
import { RinkSummary } from '../../lib/rinkTypes';
import { apiPost } from '../../lib/api';
import { storage } from '../../lib/storage';
import { colors } from '../../lib/theme';

interface QuickVoteRowProps {
  rinkId: string;
  onSummaryUpdate: (s: RinkSummary) => void;
  onRatedCountChange?: (count: number) => void;
}

const signals: { key: SignalType; icon: string; label: string }[] = [
  { key: 'parking', icon: '🅿️', label: 'Parking' },
  { key: 'cold', icon: '❄️', label: 'Cold' },
  { key: 'food_nearby', icon: '🍔', label: 'Food' },
  { key: 'chaos', icon: '🌀', label: 'Chaos' },
  { key: 'family_friendly', icon: '👨‍👩‍👧', label: 'Family' },
  { key: 'locker_rooms', icon: '🚪', label: 'Lockers' },
  { key: 'pro_shop', icon: '🏒', label: 'Pro shop' },
];

export function QuickVoteRow({ rinkId, onSummaryUpdate, onRatedCountChange }: QuickVoteRowProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());

  async function submitRating(signal: SignalType, value: number) {
    // Update local selection immediately
    setRatings(prev => ({ ...prev, [signal]: value }));

    // If already submitted this signal, allow re-rating
    setSubmitting(signal);
    const contributorType = storage.getContributorType();
    const { data } = await apiPost<{ summary?: RinkSummary }>('/contributions', {
      rink_id: rinkId, kind: 'signal_rating', contributor_type: contributorType,
      signal_rating: { signal, value },
    });
    if (data?.summary) onSummaryUpdate(data.summary);
    setSubmitted(prev => {
      const next = new Set(prev).add(signal);
      onRatedCountChange?.(next.size);
      return next;
    });
    setSubmitting(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {signals.map(s => {
        const meta = SIGNAL_META[s.key];
        const selected = ratings[s.key];
        const done = submitted.has(s.key);
        const busy = submitting === s.key;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Label */}
            <div style={{
              width: 72, flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ fontSize: 15 }}>{s.icon}</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: done ? colors.success : colors.textSecondary,
              }}>
                {s.label}
              </span>
            </div>

            {/* 1-5 buttons */}
            <div style={{ display: 'flex', gap: 4, flex: 1 }} role="group" aria-label={`Rate ${s.label} from 1 to 5`}>
              {[1, 2, 3, 4, 5].map(v => {
                const isSelected = selected === v;
                return (
                  <button
                    key={v}
                    onClick={() => submitRating(s.key, v)}
                    disabled={busy}
                    aria-label={`Rate ${s.label} ${v} out of 5`}
                    style={{
                      flex: 1, height: 44, borderRadius: 8,
                      border: `1.5px solid ${isSelected ? colors.brand : colors.borderDefault}`,
                      background: isSelected ? colors.brand : colors.white,
                      color: isSelected ? colors.white : colors.textSecondary,
                      fontSize: 14, fontWeight: 700,
                      cursor: busy ? 'wait' : 'pointer',
                      transition: 'all 0.12s',
                      opacity: busy && !isSelected ? 0.5 : 1,
                    }}
                  >
                    {v}
                  </button>
                );
              })}
            </div>

            {/* Done check */}
            <div style={{ width: 18, flexShrink: 0, textAlign: 'center' }}>
              {done && <span style={{ fontSize: 13, color: colors.success }}>✓</span>}
            </div>
          </div>
        );
      })}

      {/* Low/high hint for context */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 82, paddingRight: 22 }}>
        <span style={{ fontSize: 10, color: colors.textMuted }}>← Low</span>
        <span style={{ fontSize: 10, color: colors.textMuted }}>High →</span>
      </div>
    </div>
  );
}
