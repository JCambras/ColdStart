'use client';

import { useState } from 'react';
import { SIGNAL_LABELS } from '../lib/constants';
import { colors, text } from '../lib/theme';

interface Signal {
  signal: string;
  value: number;
  confidence: number;
  count: number;
}
interface Tip {
  text: string;
  contributor_type: string;
}
export interface RinkData {
  id: string;
  name: string;
  city: string;
  state: string;
  address?: string;
  created_at?: string;
  summary?: {
    verdict: string;
    signals: Signal[];
    tips: Tip[];
    contribution_count: number;
    confirmed_this_season: boolean;
  };
}

function getVerdictColor(verdict: string) {
  if (verdict.includes('Good')) return colors.success;
  if (verdict.includes('Heads up')) return colors.warning;
  return colors.textTertiary;
}

export function RinkCard({ rink, onClick }: { rink: RinkData; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const summary = rink.summary;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1px solid ${colors.borderDefault}`,
        borderRadius: 16,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered
          ? '0 20px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(14,165,233,0.12)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        display: 'flex',
        minHeight: 200,
      }}
    >
      {/* Left: content */}
      <div style={{ flex: 1, padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
        {/* Rink name */}
        <div style={{ fontSize: text['2xl'], fontWeight: 800, color: colors.textPrimary, lineHeight: 1.1, letterSpacing: -0.5 }}>
          {rink.name}
        </div>
        <div style={{ fontSize: text.sm, color: colors.textTertiary, marginTop: 3 }}>
          {rink.city}, {rink.state}
        </div>

        {summary ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginTop: 12 }}>
            <div>
              {/* Verdict */}
              <p style={{
                fontSize: text.md, fontWeight: 600, color: getVerdictColor(summary.verdict),
                margin: 0, lineHeight: 1.4,
              }}>
                {summary.verdict}
              </p>

              {/* Signal bars — top 3 */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginTop: 10 }}>
                {(() => {
                  const sorted = [...summary.signals]
                    .sort((a, b) => {
                      if (a.signal === 'parking') return -1;
                      if (b.signal === 'parking') return 1;
                      return b.value - a.value;
                    });
                  const top3 = sorted.slice(0, 3);
                  return (
                    <>
                      {top3.map((s) => {
                        const pct = Math.round(((s.value - 1) / 4) * 100);
                        const label = SIGNAL_LABELS[s.signal] || s.signal;
                        const barColor = s.value >= 3.5 ? colors.brand : s.value >= 2.5 ? '#f59e0b' : colors.error;
                        return (
                          <div key={s.signal} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: text.sm }}>
                            <span style={{ width: 52, flexShrink: 0, color: colors.textSecondary, fontWeight: 500 }}>{label}</span>
                            <div style={{ flex: 1, height: 5, background: colors.borderLight, borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: barColor, transition: 'width 0.6s ease' }} />
                            </div>
                            <span style={{ width: 24, textAlign: 'right' as const, fontWeight: 600, fontSize: text.xs, color: colors.textSecondary }}>
                              {s.value.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                      {summary.signals.length > 3 && (
                        <span style={{ fontSize: text.xs, color: colors.brand, fontWeight: 500 }}>
                          See all {summary.signals.length} signals →
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Tip preview + count */}
            <div style={{ marginTop: 12 }}>
              {summary.tips.length > 0 && (
                <p style={{
                  fontSize: text.sm, color: colors.textTertiary, lineHeight: 1.45, margin: 0,
                  fontStyle: 'italic',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as unknown as 'horizontal' | 'vertical',
                  overflow: 'hidden',
                }}>
                  &ldquo;{summary.tips[0].text}&rdquo;
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: text.xs, color: colors.textMuted }}>
                  {summary.contribution_count} reports
                </span>
                {summary.confirmed_this_season && (
                  <span style={{ fontSize: text['2xs'], fontWeight: 500, padding: '2px 8px', borderRadius: 10, background: '#ecfdf5', color: '#059669' }}>
                    ✓ This season
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: text.md, color: colors.textMuted, marginTop: 12 }}>
            No reports yet — be the first.
          </p>
        )}
      </div>

      {/* Right: image or placeholder */}
      {(() => {
        const n = (rink.name || '').toLowerCase();
        const hasPhoto = n.includes('ice line');
        if (hasPhoto) {
          return (
            <div style={{
              width: 180, flexShrink: 0,
              position: 'relative', overflow: 'hidden',
              borderLeft: `1px solid ${colors.borderLight}`,
            }}>
              <img
                src="/rink-photos/ice-line.jpeg"
                alt={rink.name}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center',
                  display: 'block',
                }}
              />
            </div>
          );
        }
        return (
          <div style={{
            width: 180, flexShrink: 0,
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderLeft: `1px solid ${colors.borderLight}`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ fontSize: 48, opacity: 0.4 }}>🏒</div>
            <span style={{ fontSize: text['2xs'], color: '#93c5fd', marginTop: 4, fontWeight: 500 }}>Photo coming soon</span>
            <div style={{
              position: 'absolute', top: 20, right: -20,
              width: 80, height: 80, borderRadius: '50%',
              border: '2px solid rgba(14,165,233,0.08)',
            }} />
            <div style={{
              position: 'absolute', bottom: -10, left: -10,
              width: 60, height: 60, borderRadius: '50%',
              border: '2px solid rgba(14,165,233,0.06)',
            }} />
          </div>
        );
      })()}
    </div>
  );
}
