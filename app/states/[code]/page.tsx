'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { US_STATES, SIGNAL_ICONS } from '../../../lib/constants';
import { Logo } from '../../../components/Logo';

interface SeedRink {
  id: string;
  name: string;
  city: string;
  state: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface SignalData {
  value: number;
  count: number;
  confidence: number;
}

export default function StatePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const stateName = US_STATES[code] || code;

  const [rinks, setRinks] = useState<SeedRink[]>([]);
  const [signals, setSignals] = useState<Record<string, Record<string, SignalData>>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/data/rinks.json').then(r => r.ok ? r.json() : []),
      fetch('/data/signals.json').then(r => r.ok ? r.json() : {}),
    ]).then(([allRinks, allSignals]) => {
      const stateRinks = allRinks
        .filter((r: SeedRink) => r.state === code)
        .sort((a: SeedRink, b: SeedRink) => a.name.localeCompare(b.name));
      setRinks(stateRinks);
      setSignals(allSignals);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [code]);

  const filtered = search.length >= 2
    ? rinks.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.city.toLowerCase().includes(search.toLowerCase())
      )
    : rinks;

  function getTopSignals(rinkId: string) {
    const s = signals[rinkId];
    if (!s) return [];
    return Object.entries(s)
      .map(([key, val]) => ({ signal: key, ...val }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  }

  function getAvgScore(rinkId: string) {
    const s = signals[rinkId];
    if (!s) return 0;
    const vals = Object.values(s).map(v => v.value);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafbfc', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <nav style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px',
        background: 'rgba(250,251,252,0.85)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #f1f5f9',
      }}>
        <button onClick={() => router.push('/')} style={{
          fontSize: 13, fontWeight: 500, color: '#374151', background: '#fff',
          border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
        }}>
          ← Back
        </button>
        <Logo size={36} />
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: 0 }}>
          {stateName}
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>
          {loading ? 'Loading...' : `${rinks.length} rink${rinks.length !== 1 ? 's' : ''}`}
        </p>

        {rinks.length > 10 && (
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name or city..."
            style={{
              width: '100%', padding: '10px 14px', fontSize: 14,
              border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none',
              boxSizing: 'border-box', marginTop: 16, background: '#fff',
            }}
          />
        )}

        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            {filtered.map(rink => {
              const top = getTopSignals(rink.id);
              const avg = getAvgScore(rink.id);
              const avgColor = avg >= 3.5 ? '#16a34a' : avg >= 2.5 ? '#d97706' : '#ef4444';
              return (
                <div
                  key={rink.id}
                  onClick={() => router.push(`/rinks/${rink.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', background: '#fff', border: '1px solid #e5e7eb',
                    borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#bae6fd';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rink.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      {rink.city}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                    {top.map(s => (
                      <span key={s.signal} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: s.value >= 3.5 ? '#f0fdf4' : s.value >= 2.5 ? '#fffbeb' : '#fef2f2',
                        color: s.value >= 3.5 ? '#16a34a' : s.value >= 2.5 ? '#d97706' : '#ef4444',
                      }}>
                        {SIGNAL_ICONS[s.signal] || '📊'} {s.value.toFixed(1)}
                      </span>
                    ))}
                    {avg > 0 && (
                      <span style={{
                        fontSize: 13, fontWeight: 700, color: avgColor,
                        marginLeft: 4, minWidth: 32, textAlign: 'right',
                      }}>
                        {avg.toFixed(1)}
                      </span>
                    )}
                    <span style={{ fontSize: 14, color: '#d1d5db' }}>›</span>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '32px 24px', color: '#9ca3af', fontSize: 14 }}>
                {search ? `No rinks matching "${search}"` : `No rinks found for ${stateName}`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
