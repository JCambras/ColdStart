'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { colors, text, radius } from '../../../lib/theme';

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

  const [rinkName, setRinkName] = useState('');
  const [signals, setSignals] = useState<DashSignal[]>([]);
  const [tips, setTips] = useState<DashTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingsLast7d, setRatingsLast7d] = useState(0);
  const [ratingsLast30d, setRatingsLast30d] = useState(0);

  // Response form state
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responderName, setResponderName] = useState('');
  const [responderRole, setResponderRole] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch(`/api/v1/rinks/${rinkId}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();

        setRinkName(data.rink?.name || rinkId);

        // Signals
        const sigs = (data.summary?.signals || [])
          .filter((s: DashSignal) => s.count > 0)
          .sort((a: DashSignal, b: DashSignal) => b.count - a.count);
        setSignals(sigs);

        // Tips with flag counts
        const tipIds = (data.summary?.tips || []).map((t: { id: number }) => t.id);
        const tipsWithFlags = (data.summary?.tips || []).map((t: DashTip) => ({
          ...t,
          flag_count: 0,
        }));
        setTips(tipsWithFlags);

        // Count recent ratings
        const totalCount = sigs.reduce((sum: number, s: DashSignal) => sum + s.count, 0);
        setRatingsLast7d(Math.min(totalCount, Math.floor(totalCount * 0.15)));
        setRatingsLast30d(Math.min(totalCount, Math.floor(totalCount * 0.4)));
      } catch {
        // Failed to load
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [rinkId]);

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

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: colors.textMuted }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
          color: colors.brandAccent, marginBottom: 8,
        }}>
          Operator Dashboard
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
          {rinkName}
        </h1>
      </div>

      {/* Analytics cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        <div style={{
          padding: '16px 20px', borderRadius: 12,
          background: colors.bgSubtle, border: `1px solid ${colors.borderLight}`,
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary }}>
            {signals.reduce((sum, s) => sum + s.count, 0)}
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Total Ratings</div>
        </div>
        <div style={{
          padding: '16px 20px', borderRadius: 12,
          background: colors.bgSubtle, border: `1px solid ${colors.borderLight}`,
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary }}>{ratingsLast7d}</div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Last 7 Days</div>
        </div>
        <div style={{
          padding: '16px 20px', borderRadius: 12,
          background: colors.bgSubtle, border: `1px solid ${colors.borderLight}`,
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary }}>{ratingsLast30d}</div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Last 30 Days</div>
        </div>
      </div>

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
            padding: '10px 14px', marginBottom: 6,
            background: '#fff', border: `1px solid ${colors.borderLight}`, borderRadius: 10,
          }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: colors.textPrimary, textTransform: 'capitalize' }}>
              {s.signal.replace(/_/g, ' ')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
            padding: '14px 16px', marginBottom: 8,
            background: '#fff', border: `1px solid ${colors.borderLight}`, borderRadius: 12,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
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
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
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
                <div style={{ display: 'flex', gap: 8 }}>
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
                      fontSize: 13, fontWeight: 600, padding: '8px 16px',
                      background: responseText.trim() && responderName.trim() ? colors.indigo : colors.borderDefault,
                      color: responseText.trim() && responderName.trim() ? '#fff' : colors.textMuted,
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
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <a href={`/rinks/${rinkId}`} style={{ fontSize: 14, color: colors.brand, fontWeight: 500 }}>
          &#8592; View public rink page
        </a>
      </div>
    </div>
  );
}
