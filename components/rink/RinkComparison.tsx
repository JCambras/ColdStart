'use client';

import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import { apiGet } from '../../lib/api';
import { colors, spacing, pad } from '../../lib/theme';

interface Signal {
  signal: string;
  value: number;
  count: number;
}

interface RinkComparisonProps {
  currentRinkId: string;
  currentRinkName: string;
  currentSignals: Signal[];
}

export function RinkComparison({ currentRinkId, currentRinkName, currentSignals }: RinkComparisonProps) {
  const [comparisonText, setComparisonText] = useState<string | null>(null);

  useEffect(() => {
    const rated = storage.getRatedRinks();
    const entries = Object.entries(rated)
      .filter(([id]) => id !== currentRinkId)
      .sort(([, a], [, b]) => b - a);

    if (entries.length === 0) return;

    const currentParking = currentSignals.find(s => s.signal === 'parking');
    if (!currentParking || currentParking.count === 0) return;

    const [otherId] = entries[0];

    apiGet<{ rink?: { name: string }; summary?: { signals: Signal[] } }>(`/rinks/${otherId}`)
      .then(({ data }) => {
        if (!data?.summary?.signals) return;
        const otherParking = data.summary.signals.find((s: Signal) => s.signal === 'parking');
        if (!otherParking || otherParking.count === 0) return;

        const otherName = data.rink?.name || 'the other rink';
        const diff = currentParking.value - otherParking.value;
        let comparison: string;
        if (diff > 0.3) {
          comparison = 'rated higher';
        } else if (diff < -0.3) {
          comparison = 'rated lower';
        } else {
          comparison = 'rated similarly';
        }

        setComparisonText(
          `Parking is ${comparison} than ${otherName} (${currentParking.value.toFixed(1)} vs ${otherParking.value.toFixed(1)})`
        );
      });
  }, [currentRinkId, currentSignals]);

  if (!comparisonText) return null;

  return (
    <div style={{
      marginTop: spacing[12],
      padding: pad(spacing[10], spacing[14]),
      background: colors.bgInfo,
      border: `1px solid ${colors.brandLight}`,
      borderRadius: 10,
      fontSize: 12,
      color: colors.brandDark,
      display: 'flex',
      alignItems: 'center',
      gap: spacing[8],
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>🅿️</span>
      <span>{comparisonText}</span>
    </div>
  );
}
