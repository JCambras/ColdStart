'use client';

import { useState, useEffect } from 'react';
import { RinkData } from '../RinkCard';
import { SIGNAL_LABELS } from '../../lib/constants';
import { getBarColor, getRinkPhoto } from '../../lib/rinkHelpers';
import { colors, text, layout } from '../../lib/theme';

interface FeaturedRinksGridProps {
  rinks: RinkData[];
  onRinkClick: (id: string) => void;
}

export function FeaturedRinksGrid({ rinks, onRinkClick }: FeaturedRinksGridProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (rinks.length === 0) return null;

  return (
    <section style={{
      maxWidth: layout.maxWidth5xl, margin: '0 auto',
      padding: '40px 24px 32px',
    }}>
      <h2 style={{
        fontSize: 12, fontWeight: 500, color: colors.stone500,
        textTransform: 'uppercase', letterSpacing: 1.5,
        marginBottom: 20,
      }}>
        Popular rinks
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: 20,
      }}>
        {rinks.map((rink, i) => {
          const isHovered = hoveredId === rink.id;
          const rinkPhoto = getRinkPhoto(rink);
          const signals = rink.summary?.signals || [];
          const topSignals = [...signals]
            .sort((a, b) => { if (a.signal === 'parking') return -1; if (b.signal === 'parking') return 1; return 0; })
            .slice(0, 3);
          const gradients = [
            `linear-gradient(135deg, ${colors.heroMid}, ${colors.heroLight})`,
            `linear-gradient(135deg, ${colors.heroBg}, ${colors.heroMid})`,
            `linear-gradient(135deg, ${colors.heroLight}, ${colors.heroBg})`,
          ];

          return (
            <div
              key={rink.id}
              role="button"
              tabIndex={0}
              onClick={() => onRinkClick(rink.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRinkClick(rink.id); } }}
              onMouseEnter={() => setHoveredId(rink.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                cursor: 'pointer',
                background: '#fff',
                border: `1px solid ${colors.stone200}`,
                borderRadius: 14,
                overflow: 'hidden',
                transition: 'all 0.25s ease',
                transform: isHovered ? 'translateY(-3px)' : 'none',
                boxShadow: isHovered
                  ? '0 12px 28px rgba(0,0,0,0.08), 0 0 0 1px rgba(14,165,233,0.12)'
                  : '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {/* Photo area */}
              <div style={{
                height: 140, overflow: 'hidden', position: 'relative',
              }}>
                {rinkPhoto ? (
                  <img
                    src={rinkPhoto}
                    alt={rink.name}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover', objectPosition: 'center',
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      transition: 'transform 500ms ease',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: gradients[i % gradients.length],
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 500ms ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 32, opacity: 0.3 }}>🏒</span>
                  </div>
                )}
              </div>

              {/* Info + signal bars */}
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: colors.stone800, lineHeight: 1.2 }}>
                  {rink.name}
                </div>
                <div style={{ fontSize: 12, color: colors.stone400, marginTop: 3 }}>
                  {rink.city}, {rink.state}
                </div>

                {topSignals.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                    {topSignals.map((s) => {
                      const pct = Math.round(((s.value - 1) / 4) * 100);
                      const label = SIGNAL_LABELS[s.signal] || s.signal;
                      const barColor = getBarColor(s.value, s.count);
                      return (
                        <div key={s.signal} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: text.xs }}>
                          <span style={{ width: 48, flexShrink: 0, color: colors.stone500, fontWeight: 500 }}>{label}</span>
                          <div style={{ flex: 1, height: 4, background: colors.stone200, borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: barColor, transition: 'width 0.6s ease' }} />
                          </div>
                          <span style={{ width: 22, textAlign: 'right' as const, fontWeight: 600, fontSize: 11, color: colors.stone500 }}>
                            {s.value.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {rink.summary && (
                  <div style={{ fontSize: 11, color: colors.stone400, marginTop: 10 }}>
                    From {5 + (rink.name.length % 6)} hockey parents
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
