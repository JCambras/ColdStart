'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { colors, text } from '../../lib/theme';

interface Claim {
  id: number;
  rink_id: string;
  name: string;
  email: string;
  role: string | null;
  status: string;
  created_at: string;
  rink_name: string;
  city: string;
  state: string;
}

export default function AdminPage() {
  const { currentUser, isLoggedIn, openAuth } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    loadClaims();
  }, [isLoggedIn, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadClaims() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/claims?status=${filter}`);
      if (res.status === 403) {
        setError('Admin access required. Contact the ColdStart team.');
        return;
      }
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setClaims(data.claims || []);
    } catch {
      setError('Failed to load claims');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(claimId: number, action: 'approve' | 'reject') {
    setProcessing(claimId);
    try {
      const res = await fetch(`/api/v1/admin/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setClaims(prev => prev.filter(c => c.id !== claimId));
      }
    } catch {
      // Failed silently
    } finally {
      setProcessing(null);
    }
  }

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, marginBottom: 8 }}>
          Admin sign-in required
        </h1>
        <button
          onClick={openAuth}
          style={{
            fontSize: 14, fontWeight: 600, padding: '10px 24px',
            background: colors.brand, color: colors.textInverse,
            border: 'none', borderRadius: 8, cursor: 'pointer',
          }}
        >
          Sign in
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, marginBottom: 8 }}>
          Access denied
        </h1>
        <p style={{ fontSize: 14, color: colors.textMuted }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
          color: colors.brandAccent, marginBottom: 8,
        }}>
          Admin
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
          Rink Claims
        </h1>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['pending', 'approved', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              fontSize: 13, fontWeight: 600, padding: '8px 16px',
              borderRadius: 8, cursor: 'pointer',
              background: filter === s ? colors.textPrimary : colors.bgSubtle,
              color: filter === s ? colors.textInverse : colors.textMuted,
              border: `1px solid ${filter === s ? colors.textPrimary : colors.borderDefault}`,
              textTransform: 'capitalize',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && (
        <p style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', padding: 40 }}>
          Loading claims...
        </p>
      )}

      {!loading && claims.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary }}>
            No {filter} claims
          </p>
        </div>
      )}

      {!loading && claims.map(claim => (
        <div key={claim.id} style={{
          padding: '16px 20px', marginBottom: 10,
          background: colors.surface, border: `1px solid ${colors.borderDefault}`,
          borderRadius: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>
                {claim.rink_name}
              </div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                {claim.city}, {claim.state}
              </div>
            </div>
            <div style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 8,
              background: claim.status === 'pending' ? colors.bgWarning : claim.status === 'approved' ? colors.bgSuccess : colors.bgError,
              color: claim.status === 'pending' ? colors.amber : claim.status === 'approved' ? colors.success : colors.error,
              textTransform: 'uppercase',
            }}>
              {claim.status}
            </div>
          </div>

          <div style={{ marginTop: 12, padding: '10px 14px', background: colors.bgSubtle, borderRadius: 8 }}>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: colors.textSecondary }}>
              <div><strong>Name:</strong> {claim.name}</div>
              <div><strong>Email:</strong> {claim.email}</div>
              {claim.role && <div><strong>Role:</strong> {claim.role}</div>}
            </div>
            <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 6 }}>
              Submitted {new Date(claim.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {claim.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => handleAction(claim.id, 'approve')}
                disabled={processing === claim.id}
                style={{
                  flex: 1, fontSize: 13, fontWeight: 600, padding: '10px 16px',
                  background: colors.success, color: colors.textInverse,
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  opacity: processing === claim.id ? 0.6 : 1,
                }}
              >
                {processing === claim.id ? '...' : 'Approve'}
              </button>
              <button
                onClick={() => handleAction(claim.id, 'reject')}
                disabled={processing === claim.id}
                style={{
                  flex: 1, fontSize: 13, fontWeight: 600, padding: '10px 16px',
                  background: colors.bgError, color: colors.error,
                  border: `1px solid ${colors.error}`, borderRadius: 8, cursor: 'pointer',
                  opacity: processing === claim.id ? 0.6 : 1,
                }}
              >
                Reject
              </button>
              <a
                href={`/rinks/${claim.rink_id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 13, fontWeight: 500, padding: '10px 16px',
                  color: colors.brand, background: colors.bgInfo,
                  border: `1px solid ${colors.brandLight}`, borderRadius: 8,
                  textDecoration: 'none', display: 'flex', alignItems: 'center',
                }}
              >
                View rink
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
