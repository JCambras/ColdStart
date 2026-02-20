'use client';

import { useState } from 'react';
import { colors, layout } from '../../lib/theme';

export function TeamManagerCTA() {
  const [hovered, setHovered] = useState(false);

  return (
    <section style={{
      maxWidth: layout.maxWidth5xl, margin: '0 auto',
      padding: '0 24px 64px',
    }}>
      <a
        href="/team"
        style={{ textDecoration: 'none', display: 'block' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{
          background: hovered ? colors.stone700 : colors.stone800,
          borderRadius: 12, padding: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'background 0.2s ease',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: '#ffffff' }}>
              Team Manager?
            </div>
            <div style={{ fontSize: 14, color: colors.stone400, marginTop: 4 }}>
              Share rink info with your whole team before game day.
            </div>
          </div>
          <svg
            width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke={hovered ? colors.stone300 : colors.stone500}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{
              flexShrink: 0, marginLeft: 16,
              transform: hovered ? 'translateX(2px)' : 'translateX(0)',
              transition: 'transform 0.2s ease, stroke 0.2s ease',
            }}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </a>
    </section>
  );
}
