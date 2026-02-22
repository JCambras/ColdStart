'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { US_STATES, SIGNAL_ICONS } from '../../../lib/constants';
import { seedGet } from '../../../lib/api';
import { PageShell } from '../../../components/PageShell';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { colors, text, radius } from '../../../lib/theme';

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
  const stateName = US_STATES[code];

  if (!stateName) {
    return (
      <PageShell>
        <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🗺️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, marginBottom: 8 }}>State not found</h1>
          <p style={{ fontSize: 14, color: colors.textMuted, lineHeight: 1.5 }}>&ldquo;{code}&rdquo; is not a valid US state code.</p>
          <a href="/" style={{ fontSize: 14, color: colors.brand, fontWeight: 500, marginTop: 16, display: 'inline-block' }}>&#8592; Back to home</a>
        </div>
      </PageShell>
    );
  }

  const [rinks, setRinks] = useState<SeedRink[]>([]);
  const [signals, setSignals] = useState<Record<string, Record<string, SignalData>>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [allRinks, allSignals] = await Promise.all([
          seedGet<SeedRink[]>('/data/rinks.json').then(d => d ?? []),
          seedGet<Record<string, Record<string, SignalData>>>('/data/signals.json').then(d => d ?? {}),
        ]);
        const stateRinks = allRinks
          .filter((r: SeedRink) => r.state === code)
          .sort((a: SeedRink, b: SeedRink) => a.name.localeCompare(b.name));
        setRinks(stateRinks);
        setSignals(allSignals);
      } catch {}
      setLoading(false);
    }
    loadData();
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
    <PageShell back="/">
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
          {stateName}
        </h1>
        <p style={{ fontSize: 14, color: colors.textTertiary, marginTop: 6 }}>
          {loading ? '' : `${rinks.length} rink${rinks.length !== 1 ? 's' : ''}`}
        </p>

        {rinks.length > 10 && (
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Filter rinks"
            placeholder="Filter by name or city..."
            style={{
              width: '100%', padding: '10px 14px', fontSize: 14,
              border: `1px solid ${colors.borderDefault}`, borderRadius: 10, outline: 'none',
              boxSizing: 'border-box', marginTop: 16, background: colors.surface,
            }}
          />
        )}

        {loading && <LoadingSkeleton variant="list" />}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            {filtered.map(rink => {
              const top = getTopSignals(rink.id);
              const avg = getAvgScore(rink.id);
              const avgColor = avg >= 3.5 ? colors.success : avg >= 2.5 ? colors.warning : colors.error;
              return (
                <div
                  key={rink.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/rinks/${rink.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/rinks/${rink.id}`); } }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', background: colors.surface, border: `1px solid ${colors.borderDefault}`,
                    borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.brandLight;
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.borderDefault;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rink.name}
                    </div>
                    <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      {rink.city}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                    {top.map(s => (
                      <span key={s.signal} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: s.value >= 3.5 ? colors.bgSuccess : s.value >= 2.5 ? colors.bgWarning : colors.bgError,
                        color: s.value >= 3.5 ? colors.success : s.value >= 2.5 ? colors.warning : colors.error,
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
                    <span style={{ fontSize: 14, color: colors.textDisabled }}>›</span>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '32px 24px', color: colors.textMuted, fontSize: 14 }}>
                {search ? `No rinks matching "${search}"` : `No rinks found for ${stateName}`}
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
