'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '../../components/PageShell';
import { colors, text, radius } from '../../lib/theme';

export default function TeamDashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      const existing = JSON.parse(localStorage.getItem('coldstart_team_notify') || '[]');
      existing.push({ email: email.trim(), date: new Date().toISOString() });
      localStorage.setItem('coldstart_team_notify', JSON.stringify(existing));
    } catch {}
    setSubmitted(true);
  }

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

        {submitted ? (
          <div style={{
            marginTop: 28, padding: '16px 24px',
            background: colors.bgSuccess, border: `1px solid ${colors.successBorder}`,
            borderRadius: radius.lg,
          }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: colors.success, margin: 0 }}>
              You&apos;re on the list.
            </p>
            <p style={{ fontSize: 13, color: colors.textTertiary, marginTop: 6, margin: '6px 0 0' }}>
              We&apos;ll email you when Team Dashboard is ready.
            </p>
          </div>
        ) : (
          <form onSubmit={handleNotify} style={{ marginTop: 28 }}>
            <div style={{
              display: 'flex', gap: 8,
              maxWidth: 360, margin: '0 auto',
            }}>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  flex: 1, fontSize: 15, padding: '12px 16px',
                  border: `1px solid ${colors.borderDefault}`,
                  borderRadius: radius.lg, outline: 'none',
                  color: colors.textPrimary,
                  background: colors.white,
                }}
              />
              <button
                type="submit"
                style={{
                  fontSize: 14, fontWeight: 600,
                  color: colors.white, background: colors.textPrimary,
                  border: 'none', borderRadius: radius.lg,
                  padding: '12px 20px', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Notify me
              </button>
            </div>
            <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 10 }}>
              Get notified when Team Dashboard launches
            </p>
          </form>
        )}

        <div style={{
          marginTop: 28, padding: '20px 24px',
          background: colors.bgInfo, border: `1px solid ${colors.brandLight}`,
          borderRadius: radius.xl, textAlign: 'left',
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
            Need to share game day info now?
          </p>
          <p style={{ fontSize: 13, color: colors.textTertiary, marginTop: 6, lineHeight: 1.5, margin: '6px 0 0' }}>
            Create a trip page with parking intel, game schedule, food spots, and costs &mdash; then share one link with your team.
          </p>
          <button
            onClick={() => router.push('/trip/new')}
            style={{
              marginTop: 12, fontSize: 14, fontWeight: 600,
              color: colors.white, background: colors.brand,
              border: 'none', borderRadius: radius.lg,
              padding: '14px 24px', cursor: 'pointer',
              width: '100%',
            }}
          >
            Create a game day page →
          </button>
        </div>

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
