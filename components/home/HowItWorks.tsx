'use client';

import { colors, text } from '../../lib/theme';

const STEPS = [
  { num: '01', title: 'Search for a rink', desc: 'By name, city, or state. New rinks added weekly.' },
  { num: '02', title: 'Get the parent verdict', desc: 'Parking, cold, food, chaos — rated and summarized by parents who were just there.' },
  { num: '03', title: 'Drop a tip or rate a signal', desc: 'Takes 10 seconds. Your info updates the summary instantly for the next family.' },
  { num: '04', title: 'Share with the team', desc: 'Send the link to your group chat. Better info = fewer surprises on game day.' },
];

export function HowItWorks() {
  return (
    <section aria-label="How it works" style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px 40px' }}>
      <h2 style={{
        fontSize: 28, fontWeight: 700, color: colors.textPrimary,
        textAlign: 'center', marginBottom: 28, letterSpacing: -0.5,
      }}>
        How it works
      </h2>

      {STEPS.map((step, i) => (
        <div key={step.num} style={{
          display: 'flex', gap: 20, alignItems: 'flex-start',
          padding: '16px 0',
          borderBottom: i < STEPS.length - 1 ? `1px solid ${colors.borderLight}` : 'none',
        }}>
          <span style={{
            fontSize: 32, fontWeight: 700, color: colors.borderDefault, lineHeight: 1,
            flexShrink: 0, width: 40,
          }}>
            {step.num}
          </span>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
              {step.title}
            </h3>
            <p style={{ fontSize: text.base, color: colors.textTertiary, lineHeight: 1.55, marginTop: 4 }}>
              {step.desc}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
