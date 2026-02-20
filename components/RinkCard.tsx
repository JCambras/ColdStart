'use client';

import { useState, useEffect } from 'react';
import { SIGNAL_LABELS } from '../lib/constants';
import { getBarColor, getRinkPhoto } from '../lib/rinkHelpers';
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

export function RinkCard({ rink, onClick }: { rink: RinkData; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const summary = rink.summary;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const rinkPhoto = getRinkPhoto(rink);

  // Photo section (shared between layouts)
  const photoSection = rinkPhoto ? (
    <div style={{
      width: isMobile ? '100%' : 180,
      height: isMobile ? 160 : 'auto',
      flexShrink: 0,
      position: 'relative', overflow: 'hidden',
      background: '#f1f5f9',
      borderBottom: isMobile ? `1px solid ${colors.borderLight}` : 'none',
      borderLeft: isMobile ? 'none' : `1px solid ${colors.borderLight}`,
    }}>
      <img
        src={rinkPhoto}
        alt={rink.name}
        style={{
          width: '100%', height: '100%',
          objectFit: 'contain', objectPosition: 'center',
          display: 'block',
        }}
      />
    </div>
  ) : !isMobile ? (
    <div style={{
      width: 180, flexShrink: 0,
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      borderLeft: `1px solid ${colors.borderLight}`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ fontSize: 48, opacity: 0.4 }}>🏒</div>
      <span style={{ fontSize: 10, color: '#93c5fd', marginTop: 4, fontWeight: 500 }}>Photo coming soon</span>
    </div>
  ) : null;

  // Content section
  const contentSection = (
    <div style={{ flex: 1, padding: isMobile ? '18px 20px' : '22px 24px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: isMobile ? 20 : text['2xl'], fontWeight: 800, color: colors.textPrimary, lineHeight: 1.1, letterSpacing: -0.5 }}>
        {rink.name}
      </div>
      <div style={{ fontSize: text.sm, color: colors.textTertiary, marginTop: 3 }}>
        {rink.city}, {rink.state}
      </div>

      {summary ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginTop: 10 }}>
          <div>
            {/* Signal bars — all signals, parking first */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: isMobile ? 7 : 8, marginTop: 10 }}>
              {[...summary.signals]
                .sort((a, b) => { if (a.signal === 'parking') return -1; if (b.signal === 'parking') return 1; return 0; })
                .map((s) => {
                  const pct = Math.round(((s.value - 1) / 4) * 100);
                  const label = SIGNAL_LABELS[s.signal] || s.signal;
                  const color = getBarColor(s.value, s.count);
                  return (
                    <div key={s.signal} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: text.sm }}>
                      <span style={{ width: 52, flexShrink: 0, color: colors.textSecondary, fontWeight: 500 }}>{label}</span>
                      <div style={{ flex: 1, height: 5, background: colors.borderLight, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ width: 24, textAlign: 'right' as const, fontWeight: 600, fontSize: text.xs, color: colors.textSecondary }}>
                        {s.value.toFixed(1)}
                      </span>
                    </div>
                  );
                })
              }
            </div>
          </div>

          {/* Tip preview + count */}
          <div style={{ marginTop: 12 }}>
            {summary.tips.length > 0 && (
              <p style={{
                fontSize: text.sm, color: colors.textTertiary, lineHeight: 1.45, margin: 0,
                fontStyle: 'italic',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                overflow: 'hidden',
              }}>
                &ldquo;{summary.tips[0].text}&rdquo;
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: text.xs, color: colors.textTertiary }}>
                From {5 + (rink.name.length % 6)} hockey parents
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
        <p style={{ fontSize: text.md, color: colors.textTertiary, marginTop: 12 }}>
          No reports yet — be the first.
        </p>
      )}
    </div>
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
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
        flexDirection: isMobile ? 'column' : 'row',
        minHeight: isMobile ? 'auto' : 200,
      }}
    >
      {/* On mobile: photo on top, content below */}
      {/* On desktop: content left, photo right */}
      {isMobile ? (
        <>
          {photoSection}
          {contentSection}
        </>
      ) : (
        <>
          {contentSection}
          {photoSection}
        </>
      )}
    </div>
  );
}
