'use client';

import { useState } from 'react';
import { TipCard } from './TipCard';
import { colors } from '../../lib/theme';
import type { Tip } from '../../lib/rinkTypes';

interface TipsSectionProps {
  tips: Tip[];
  rinkSlug: string;
}

export function TipsSection({ tips, rinkSlug }: TipsSectionProps) {
  const [showAll, setShowAll] = useState(false);

  if (tips.length === 0) return null;

  const displayTips = showAll ? tips : tips.slice(0, 3);

  return (
    <section id="tips-section" aria-label="Tips from parents" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{
          fontSize: 13, fontWeight: 600, color: colors.textMuted,
          textTransform: 'uppercase', letterSpacing: 1.5, margin: 0,
        }}>
          Things to know ({tips.length})
        </h3>
        <span style={{ fontSize: 11, color: colors.textMuted }}>Sorted by most helpful</span>
      </div>
      {displayTips.map((tip, i) => (
        <TipCard key={i} tip={tip} tipIndex={i} rinkSlug={rinkSlug} />
      ))}
      {tips.length > 3 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            fontSize: 13, color: colors.brand, background: 'none',
            border: 'none', cursor: 'pointer', padding: '8px 0',
            fontWeight: 500,
          }}
        >
          Show {tips.length - 3} more tips →
        </button>
      )}
    </section>
  );
}
