'use client';

import { useRouter } from 'next/navigation';
import { SaveRinkButton } from './SaveRinkButton';
import { getVerdictColor, getRinkSlug } from '../../lib/rinkHelpers';
import { RINK_STREAMING, RINK_HOME_TEAMS } from '../../lib/seedData';
import { colors } from '../../lib/theme';
import type { Rink } from '../../lib/rinkTypes';

interface RinkHeaderProps {
  rink: Rink;
  rinkId: string;
  verdict: string;
}

export function RinkHeader({ rink, rinkId, verdict }: RinkHeaderProps) {
  const router = useRouter();
  const slug = getRinkSlug(rink);
  const streaming = RINK_STREAMING[slug];
  const teams = RINK_HOME_TEAMS[slug];

  return (
    <section style={{ paddingTop: 40, paddingBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{
            fontSize: 'clamp(24px, 5vw, 36px)',
            fontWeight: 700, color: colors.textPrimary,
            lineHeight: 1.15, letterSpacing: -0.5, margin: 0,
          }}>
            {rink.name}
          </h1>
          <p style={{ fontSize: 14, color: colors.textTertiary, marginTop: 6, lineHeight: 1.4 }}>
            {rink.address}, {rink.city}, {rink.state}
          </p>
          {/* Streaming badge */}
          {streaming && streaming.type !== 'none' && (() => {
            const isLiveBarn = streaming.type === 'livebarn';
            return (
              <a
                href={streaming.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Watch live at ${isLiveBarn ? 'LiveBarn' : 'BlackBear TV'}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  marginTop: 8, padding: '5px 12px', borderRadius: 8,
                  background: isLiveBarn ? '#fff7ed' : colors.bgInfo,
                  border: `1px solid ${isLiveBarn ? colors.amberBorder : colors.brandLight}`,
                  fontSize: 12, fontWeight: 600,
                  color: isLiveBarn ? '#c2410c' : colors.brandDark,
                  textDecoration: 'none', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {isLiveBarn ? '📹 LiveBarn' : '🐻 BlackBear TV'}
                <span style={{ fontSize: 10, opacity: 0.7 }}>Watch live →</span>
              </a>
            );
          })()}
          {/* Home teams */}
          {teams && teams.length > 0 && (
            <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 6 }}>
              🏠 Home of <span style={{ fontWeight: 600, color: colors.textSecondary }}>{teams.join(', ')}</span>
            </div>
          )}
          <span
            onClick={() => {
              const el = document.getElementById('claim-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const el = document.getElementById('claim-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } }}
            style={{ fontSize: 13, color: colors.brandAccent, cursor: 'pointer', marginTop: 4, display: 'inline-block' }}
          >
            Manage this rink? Claim your profile →
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <SaveRinkButton rinkId={rinkId} />
          <button
            onClick={() => router.push(`/compare?rinks=${rinkId}`)}
            aria-label="Compare this rink with others"
            style={{
              fontSize: 12, fontWeight: 600,
              color: colors.textTertiary, background: colors.bgSubtle,
              border: `1px solid ${colors.borderDefault}`,
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            ⚖️ Compare rinks
          </button>
          <button
            onClick={() => router.push(`/trip/new?rink=${rinkId}`)}
            aria-label="Plan a trip to this rink"
            style={{
              fontSize: 12, fontWeight: 600,
              color: colors.textTertiary, background: colors.bgSubtle,
              border: `1px solid ${colors.borderDefault}`,
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            📋 Plan a trip
          </button>
        </div>
      </div>
    </section>
  );
}
