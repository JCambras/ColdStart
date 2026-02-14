'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface Trip {
  id: string; teamName: string; dates: string;
  rink: { id: string; name: string; city: string; state: string };
  createdAt: string; games?: any[]; costItems?: any[];
}

export default function MyTripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('coldstart_trips') || '{}');
      const list = Object.values(stored) as Trip[];
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTrips(list);
    } catch {}
  }, []);

  const filtered = useMemo(() => {
    if (!filter.trim()) return trips;
    const q = filter.toLowerCase();
    return trips.filter(t =>
      t.teamName.toLowerCase().includes(q) ||
      t.rink.name.toLowerCase().includes(q) ||
      t.rink.city.toLowerCase().includes(q) ||
      (t.dates || '').toLowerCase().includes(q)
    );
  }, [trips, filter]);

  return (
    <div style={{ minHeight: '100vh', background: '#fafbfc', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', background: 'rgba(250,251,252,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #f1f5f9' }}>
        <button onClick={() => router.push('/')} style={{ fontSize: 13, fontWeight: 500, color: '#374151', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>← Home</button>
        <span onClick={() => router.push('/')} style={{ fontSize: 36, fontWeight: 800, color: '#111827', letterSpacing: -0.5, cursor: 'pointer' }}>cold<span style={{ color: '#0ea5e9' }}>start</span></span>
      </nav>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 24px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>📁 My Trips</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{trips.length} trip{trips.length !== 1 ? 's' : ''} created</p>
          </div>
          <button onClick={() => router.push('/trip/new')} style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#0ea5e9', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(14,165,233,0.25)' }}>+ New trip</button>
        </div>

        {/* Search filter */}
        {trips.length > 2 && (
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search trips..."
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14,
                border: '1px solid #e5e7eb', borderRadius: 10,
                background: '#fff', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
            />
          </div>
        )}

        {trips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>No trips yet</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>Create a trip page to share game day info with your team.</p>
            <button onClick={() => router.push('/trip/new')} style={{ marginTop: 16, fontSize: 14, fontWeight: 600, color: '#0ea5e9', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 24px', cursor: 'pointer' }}>
              Create your first trip →
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
            <p style={{ fontSize: 14, margin: 0 }}>No trips matching &ldquo;{filter}&rdquo;</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(trip => {
              const gameCount = trip.games?.length || 0;
              const hasCosts = trip.costItems && trip.costItems.length > 0;
              const created = new Date(trip.createdAt);
              const dateStr = created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div key={trip.id} onClick={() => router.push(`/trip/${trip.id}`)} style={{
                  padding: '16px 18px', background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(14,165,233,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>🏒 {trip.teamName}</div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>at {trip.rink.name} · {trip.rink.city}, {trip.rink.state}</div>
                    </div>
                    <span style={{ fontSize: 16, color: '#d1d5db' }}>›</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {trip.dates && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: '#f0f9ff', color: '#0369a1' }}>📅 {trip.dates}</span>
                    )}
                    {gameCount > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: '#f5f3ff', color: '#7c3aed' }}>{gameCount} game{gameCount !== 1 ? 's' : ''}</span>
                    )}
                    {hasCosts && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: '#f0fdf4', color: '#16a34a' }}>💰 Budget</span>
                    )}
                    <span style={{ fontSize: 11, color: '#9ca3af', padding: '3px 0' }}>Created {dateStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
