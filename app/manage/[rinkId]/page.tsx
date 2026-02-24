'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { colors, text, radius, spacing, pad } from '../../../lib/theme';

interface DashTip {
  id: number;
  text: string;
  contributor_type: string;
  created_at: string;
  flag_count: number;
  operator_response?: { text: string; name: string; role: string };
}

interface DashSignal {
  signal: string;
  value: number;
  count: number;
}

export default function OperatorDashboard() {
  const params = useParams();
  const rinkId = params.rinkId as string;
  const { currentUser, isLoggedIn, openAuth } = useAuth();

  const [rinkName, setRinkName] = useState('');
  const [signals, setSignals] = useState<DashSignal[]>([]);
  const [tips, setTips] = useState<DashTip[]>([]);
  const [stats, setStats] = useState<{
    ratings_total: number; ratings_7d: number; ratings_30d: number;
    tips_total: number; referrals_7d: number; referrals_30d: number;
    weekly_ratings: { week: string; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Response form state
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responderName, setResponderName] = useState('');
  const [responderRole, setResponderRole] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Auth gate: verify user has an approved claim for this rink
  useEffect(() => {
    if (!isLoggedIn) {
      setAuthChecked(true);
      return;
    }
    async function checkClaim() {
      try {
        const res = await fetch(`/api/v1/rinks/${rinkId}/claim/verify`);
        if (!res.ok) {
          setAccessDenied(true);
        }
      } catch {
        setAccessDenied(true);
      } finally {
        setAuthChecked(true);
      }
    }
    checkClaim();
  }, [isLoggedIn, rinkId]);

  useEffect(() => {
    if (!authChecked || !isLoggedIn || accessDenied) return;
    async function loadDashboard() {
      try {
        const [res, statsRes] = await Promise.all([
          fetch(`/api/v1/rinks/${rinkId}`),
          fetch(`/api/v1/rinks/${rinkId}/stats`).catch(() => null),
        ]);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();

        setRinkName(data.rink?.name || rinkId);

        // Signals
        const sigs = (data.summary?.signals || [])
          .filter((s: DashSignal) => s.count > 0)
          .sort((a: DashSignal, b: DashSignal) => b.count - a.count);
        setSignals(sigs);

        // Tips with flag counts
        const tipsWithFlags = (data.summary?.tips || []).map((t: DashTip) => ({
          ...t,
          flag_count: t.flag_count ?? 0,
        }));
        setTips(tipsWithFlags);

        // Stats
        if (statsRes?.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch {
        // Failed to load
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [rinkId, authChecked, isLoggedIn, accessDenied]);

  async function submitResponse(tipId: number) {
    if (!responseText.trim() || !responderName.trim()) return;
    setSubmittingResponse(true);
    try {
      const res = await fetch(`/api/v1/tips/${tipId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: responseText.trim(),
          responder_name: responderName.trim(),
          responder_role: responderRole.trim() || 'Rink Staff',
          rink_id: rinkId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTips(prev => prev.map(t =>
          t.id === tipId
            ? { ...t, operator_response: { text: data.response.text, name: data.response.responder_name, role: data.response.responder_role || 'Rink Staff' } }
            : t
        ));
        setRespondingTo(null);
        setResponseText('');
      }
    } catch {
      // Failed
    } finally {
      setSubmittingResponse(false);
    }
  }

  // Auth gate: require sign-in
  if (authChecked && !isLoggedIn) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', padding: pad(0, spacing[24]), textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: spacing[12] }}>🔒</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, marginBottom: spacing[8] }}>
          Sign in required
        </h1>
        <p style={{ fontSize: 14, color: colors.textMuted, lineHeight: 1.5, marginBottom: spacing[20] }}>
          The operator dashboard requires authentication. Please sign in with the account associated with your rink claim.
        </p>
        <button
          onClick={openAuth}
          style={{
            fontSize: 14, fontWeight: 600, padding: pad(spacing[10], spacing[24]),
            background: colors.brand, color: colors.textInverse,
            border: 'none', borderRadius: 8, cursor: 'pointer',
          }}
        >
          Sign in
        </button>
      </div>
    );
  }

  // Auth gate: verify operator has approved claim
  if (authChecked && accessDenied) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', padding: pad(0, spacing[24]), textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: spacing[12] }}>🚫</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, marginBottom: spacing[8] }}>
          Access denied
        </h1>
        <p style={{ fontSize: 14, color: colors.textMuted, lineHeight: 1.5, marginBottom: spacing[20] }}>
          You don&apos;t have an approved operator claim for this rink. If you manage this facility, please submit a claim from the rink&apos;s public page.
        </p>
        <a href={`/rinks/${rinkId}`} style={{ fontSize: 14, color: colors.brand, fontWeight: 500 }}>
          &#8592; Go to rink page
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: colors.textMuted }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: pad(spacing[40], spacing[24]) }}>
      {/* Header */}
      <div style={{ marginBottom: spacing[32] }}>
        <div style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
          color: colors.brandAccent, marginBottom: spacing[8],
        }}>
          Operator Dashboard
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
          {rinkName}
        </h1>
      </div>

      {/* Analytics cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing[12], marginBottom: spacing[32] }}>
        <div style={{
          padding: pad(spacing[16], spacing[20]), borderRadius: 12,
          background: colors.bgSubtle, border: `1px solid ${colors.borderLight}`,
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary }}>
            {stats?.ratings_total ?? signals.reduce((sum, s) => sum + s.count, 0)}
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Total Ratings</div>
          {stats && stats.ratings_7d > 0 && (
            <div style={{ fontSize: 11, color: colors.success, marginTop: 4, fontWeight: 600 }}>
              +{stats.ratings_7d} this week
            </div>
          )}
        </div>
        <div style={{
          padding: pad(spacing[16], spacing[20]), borderRadius: 12,
          background: colors.bgSubtle, border: `1px solid ${colors.borderLight}`,
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary }}>
            {stats?.tips_total ?? tips.length}
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Total Tips</div>
        </div>
        <div style={{
          padding: pad(spacing[16], spacing[20]), borderRadius: 12,
          background: colors.bgSubtle, border: `1px solid ${colors.borderLight}`,
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary }}>
            {stats?.referrals_30d ?? 0}
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Referrals (30d)</div>
          {stats && stats.referrals_7d > 0 && (
            <div style={{ fontSize: 11, color: colors.success, marginTop: 4, fontWeight: 600 }}>
              +{stats.referrals_7d} this week
            </div>
          )}
        </div>
      </div>

      {/* Ratings Over Time */}
      {stats && stats.weekly_ratings.length > 0 && (
        <section style={{ marginBottom: spacing[32] }}>
          <h2 style={{
            fontSize: 13, fontWeight: 600, color: colors.textMuted,
            textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing[12],
          }}>
            Ratings Over Time
          </h2>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: spacing[8], height: 100,
            padding: pad(spacing[12], spacing[16]), background: colors.surface,
            border: `1px solid ${colors.borderLight}`, borderRadius: 12,
          }}>
            {stats.weekly_ratings.map((w) => {
              const max = Math.max(...stats.weekly_ratings.map(r => r.count), 1);
              const height = Math.max((w.count / max) * 72, 4);
              return (
                <div key={w.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[4] }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: colors.textSecondary }}>{w.count}</span>
                  <div style={{
                    width: '100%', maxWidth: 40, height,
                    background: colors.brand, borderRadius: 4,
                  }} />
                  <span style={{ fontSize: 9, color: colors.textMuted }}>
                    {new Date(w.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Referral Traffic */}
      {stats && (stats.referrals_7d > 0 || stats.referrals_30d > 0) && (
        <section style={{ marginBottom: spacing[32] }}>
          <h2 style={{
            fontSize: 13, fontWeight: 600, color: colors.textMuted,
            textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing[12],
          }}>
            Referral Traffic
          </h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing[12],
          }}>
            <div style={{
              padding: pad(spacing[12], spacing[16]), borderRadius: 10,
              background: colors.surface, border: `1px solid ${colors.borderLight}`,
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>{stats.referrals_7d}</div>
              <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Last 7 days</div>
            </div>
            <div style={{
              padding: pad(spacing[12], spacing[16]), borderRadius: 10,
              background: colors.surface, border: `1px solid ${colors.borderLight}`,
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>{stats.referrals_30d}</div>
              <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Last 30 days</div>
            </div>
          </div>
        </section>
      )}

      {/* Signal ratings summary */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{
          fontSize: 13, fontWeight: 600, color: colors.textMuted,
          textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
        }}>
          Signal Ratings
        </h2>
        {signals.map(s => (
          <div key={s.signal} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: pad(spacing[10], spacing[14]), marginBottom: spacing[6],
            background: colors.surface, border: `1px solid ${colors.borderLight}`, borderRadius: 10,
          }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: colors.textPrimary, textTransform: 'capitalize' }}>
              {s.signal.replace(/_/g, ' ')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[12] }}>
              <span style={{ fontSize: 13, color: colors.textMuted }}>{s.count} ratings</span>
              <span style={{
                fontSize: 16, fontWeight: 700,
                color: s.value >= 3.5 ? colors.success : s.value >= 2.5 ? colors.warning : colors.error,
              }}>
                {s.value.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Tips with response form */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{
          fontSize: 13, fontWeight: 600, color: colors.textMuted,
          textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
        }}>
          Tips ({tips.length})
        </h2>
        {tips.map(tip => (
          <div key={tip.id} style={{
            padding: pad(spacing[14], spacing[16]), marginBottom: spacing[8],
            background: colors.surface, border: `1px solid ${colors.borderLight}`, borderRadius: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p style={{ fontSize: 14, color: colors.textSecondary, margin: 0, flex: 1, lineHeight: 1.5 }}>
                &ldquo;{tip.text}&rdquo;
              </p>
              {tip.flag_count > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600, color: colors.error,
                  background: colors.bgError, padding: '2px 8px', borderRadius: 6,
                  flexShrink: 0, marginLeft: 8,
                }}>
                  {tip.flag_count} flag{tip.flag_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
              {tip.contributor_type === 'local_parent' ? 'Local' : 'Visitor'} &middot; {new Date(tip.created_at).toLocaleDateString()}
            </div>

            {/* Operator response */}
            {tip.operator_response ? (
              <div style={{
                marginTop: 10, padding: '8px 12px',
                background: colors.indigoBg, border: `1px solid ${colors.indigoBorder}`,
                borderRadius: radius.md, borderLeft: `3px solid ${colors.brandAccent}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing[6], marginBottom: spacing[3] }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                    background: colors.brandAccent, color: colors.textInverse, textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    Verified
                  </span>
                  <span style={{ fontSize: text['2xs'], fontWeight: 600, color: colors.indigo }}>{tip.operator_response.name}</span>
                  <span style={{ fontSize: text['2xs'], color: colors.textTertiary }}>&middot; {tip.operator_response.role}</span>
                </div>
                <p style={{ fontSize: text.sm, color: colors.indigo, lineHeight: 1.45, margin: 0 }}>
                  {tip.operator_response.text}
                </p>
              </div>
            ) : respondingTo === tip.id ? (
              <div style={{ marginTop: spacing[10], display: 'flex', flexDirection: 'column', gap: spacing[8] }}>
                <div style={{ display: 'flex', gap: spacing[8] }}>
                  <input
                    value={responderName}
                    onChange={(e) => setResponderName(e.target.value)}
                    placeholder="Your name"
                    style={{
                      flex: 1, fontSize: 13, padding: '8px 12px',
                      border: `1px solid ${colors.borderDefault}`, borderRadius: 8,
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  <input
                    value={responderRole}
                    onChange={(e) => setResponderRole(e.target.value)}
                    placeholder="Role (e.g. Manager)"
                    style={{
                      flex: 1, fontSize: 13, padding: '8px 12px',
                      border: `1px solid ${colors.borderDefault}`, borderRadius: 8,
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: spacing[8] }}>
                  <input
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write a response..."
                    onKeyDown={(e) => { if (e.key === 'Enter') submitResponse(tip.id); }}
                    autoFocus
                    style={{
                      flex: 1, fontSize: 13, padding: '8px 12px',
                      border: `1px solid ${colors.borderDefault}`, borderRadius: 8,
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={() => submitResponse(tip.id)}
                    disabled={!responseText.trim() || !responderName.trim() || submittingResponse}
                    style={{
                      fontSize: 13, fontWeight: 600, padding: pad(spacing[8], spacing[16]),
                      background: responseText.trim() && responderName.trim() ? colors.indigo : colors.borderDefault,
                      color: responseText.trim() && responderName.trim() ? colors.textInverse : colors.textMuted,
                      border: 'none', borderRadius: 8, cursor: 'pointer',
                    }}
                  >
                    {submittingResponse ? '...' : 'Send'}
                  </button>
                  <button
                    onClick={() => { setRespondingTo(null); setResponseText(''); }}
                    style={{ fontSize: 12, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setRespondingTo(tip.id)}
                style={{
                  marginTop: 8, fontSize: 12, fontWeight: 500,
                  color: colors.brandAccent, background: 'none',
                  border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                Respond to this tip
              </button>
            )}
          </div>
        ))}
      </section>

      {/* Back link */}
      <div style={{ textAlign: 'center', marginTop: spacing[32] }}>
        <a href={`/rinks/${rinkId}`} style={{ fontSize: 14, color: colors.brand, fontWeight: 500 }}>
          &#8592; View public rink page
        </a>
      </div>
    </div>
  );
}
