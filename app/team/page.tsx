'use client';

import { useRouter } from 'next/navigation';
import { PageShell } from '../../components/PageShell';
import { colors, text, radius } from '../../lib/theme';

export default function TeamDashboardPage() {
  const router = useRouter();

  return (
    <PageShell back="/" backLabel="← Home">
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px 80px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🏒</div>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: colors.textPrimary,
          margin: 0, lineHeight: 1.3,
        }}>
          Your team dashboard
        </h1>
        <p style={{
          fontSize: 15, color: colors.textTertiary, marginTop: 10,
          lineHeight: 1.5,
        }}>
          Add your team to see your schedule with rink intel for every away game &mdash; parking, food, drive times, and flags.
        </p>

        <button
          disabled
          style={{
            marginTop: 28, fontSize: 15, fontWeight: 600,
            color: colors.white, background: colors.textPrimary,
            border: 'none', borderRadius: radius.lg,
            padding: '14px 32px', cursor: 'default',
            opacity: 0.5,
          }}
        >
          Add your team
        </button>
        <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 10 }}>
          Coming soon
        </p>

        <div style={{
          marginTop: 48, padding: '20px 24px',
          background: colors.white, border: `1px solid ${colors.borderDefault}`,
          borderRadius: radius.xl, textAlign: 'left',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary, margin: 0 }}>
            What you&apos;ll get
          </p>
          <ul style={{
            margin: '12px 0 0', paddingLeft: 18,
            fontSize: 13, color: colors.textTertiary, lineHeight: 1.8,
            listStyleType: 'disc',
          }}>
            <li>Full season schedule with rink signals for every game</li>
            <li>Flagged rinks with low parking or family-friendliness</li>
            <li>Drive time and distance for every away game</li>
            <li>Share prep links with your team parents</li>
          </ul>
        </div>

        <div style={{ marginTop: 32 }}>
          <button
            onClick={() => router.push('/')}
            style={{
              fontSize: 13, fontWeight: 500, color: colors.brand,
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            Explore rinks instead →
          </button>
        </div>
      </div>
    </PageShell>
  );
}
