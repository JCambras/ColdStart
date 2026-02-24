'use client';

import { useState, useEffect } from 'react';
import { colors, layout, spacing, pad } from '../../lib/theme';

const STEPS = [
  { num: '01', title: 'Scout a rink', desc: 'Search by name or city before your next tournament weekend.' },
  { num: '02', title: 'See what to expect', desc: 'Parking, cold, food options — summarized from real parent reports.' },
  { num: '03', title: 'Share what you know', desc: 'Quick signal taps and one-sentence tips. Takes 10 seconds.' },
];

export function HowItWorks() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <section aria-label="How it works" style={{
      maxWidth: layout.maxWidth5xl, margin: '0 auto',
      padding: pad(spacing[0], spacing[24], 48),
    }}>
      <div style={{
        borderTop: `1px solid ${colors.stone200}`,
        paddingTop: spacing[40],
      }}>
        <h2 style={{
          fontSize: 12, fontWeight: 500, color: colors.stone500,
          textTransform: 'uppercase', letterSpacing: 1.5,
          marginBottom: spacing[28],
        }}>
          How it works
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: spacing[32],
        }}>
          {STEPS.map((step) => (
            <div key={step.num}>
              <span style={{
                fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                color: colors.stone300,
                display: 'block', marginBottom: spacing[8],
              }}>
                {step.num}
              </span>
              <h3 style={{
                fontSize: 14, fontWeight: 500, color: colors.stone700,
                margin: pad(spacing[0], spacing[0], spacing[6]),
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: 14, color: colors.stone400, lineHeight: 1.55, margin: spacing[0],
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
