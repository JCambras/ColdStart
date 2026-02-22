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
  const [filterTournament, setFilterTournament] = useState(false);

  const tournamentCount = tips.filter(t => t.context === 'tournament').length;
  const filteredTips = filterTournament ? tips.filter(t => t.context === 'tournament') : tips;
  const displayTips = showAll ? filteredTips : filteredTips.slice(0, 3);

  return (
    <section id="tips-section" aria-label="Tips from parents" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{
          fontSize: 13, fontWeight: 600, color: colors.textMuted,
          textTransform: 'uppercase', letterSpacing: 1.5, margin: 0,
        }}>
          Things to know{tips.length > 0 ? ` (${tips.length})` : ''}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {tournamentCount > 0 && (
            <button
              onClick={() => setFilterTournament(!filterTournament)}
              aria-pressed={filterTournament}
              style={{
                fontSize: 11, fontWeight: filterTournament ? 600 : 400,
                padding: '3px 10px', borderRadius: 12,
                background: filterTournament ? colors.bgWarning : 'transparent',
                color: filterTournament ? colors.amber : colors.textMuted,
                border: `1px solid ${filterTournament ? colors.amberBorder : colors.borderDefault}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {'\u{1F3C6}'} Tournament ({tournamentCount})
            </button>
          )}
          {tips.length > 0 && (
            <span style={{ fontSize: 11, color: colors.textMuted }}>Sorted by most helpful</span>
          )}
        </div>
      </div>
      {tips.length === 0 ? (
        <div style={{
          background: colors.white, border: `1px solid ${colors.borderDefault}`,
          borderRadius: 12, padding: '28px 20px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: colors.textTertiary, margin: 0, lineHeight: 1.5 }}>
            No tips yet — be the first to share what parents should know about this rink.
          </p>
        </div>
      ) : (
        <>
          {displayTips.map((tip, i) => (
            <TipCard key={i} tip={tip} tipIndex={i} rinkSlug={rinkSlug} />
          ))}
          {filteredTips.length > 3 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              style={{
                fontSize: 13, color: colors.brand, background: 'none',
                border: 'none', cursor: 'pointer', padding: '8px 0',
                fontWeight: 500,
              }}
            >
              Show {filteredTips.length - 3} more tips →
            </button>
          )}
        </>
      )}
    </section>
  );
}
