'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { getVibe as _getVibe } from '../../app/vibe';
const getVibe = () => {
  if (typeof window === 'undefined') return { log: () => {} };
  try { return _getVibe(); } catch { return { log: () => {} }; }
};

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface Game { id: string; day: string; time: string; opponent: string; sheet: string; note: string; }
interface CostItem { id: string; label: string; amount: string; splitType: 'per-family' | 'per-player' | 'total'; }

function TripBuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRinkId = searchParams.get('rink') || '';

  const [teamName, setTeamName] = useState('');
  const [dates, setDates] = useState('');
  const [rinkQuery, setRinkQuery] = useState('');
  const [rinkResults, setRinkResults] = useState<any[]>([]);
  const [selectedRink, setSelectedRink] = useState<{ id: string; name: string; city: string; state: string } | null>(null);
  const [hotel, setHotel] = useState('');
  const [hotelCost, setHotelCost] = useState('');
  const [lunch, setLunch] = useState('');
  const [lunchCost, setLunchCost] = useState('');
  const [dinner, setDinner] = useState('');
  const [dinnerCost, setDinnerCost] = useState('');
  const [games, setGames] = useState<Game[]>([{ id: 'g1', day: '', time: '', opponent: '', sheet: '', note: '' }]);
  const [notes, setNotes] = useState('');
  const [collaborative, setCollaborative] = useState(true);
  // Cost breakdown
  const [familyCount, setFamilyCount] = useState('16');
  const [costItems, setCostItems] = useState<CostItem[]>([
    { id: 'c1', label: '', amount: '', splitType: 'total' },
  ]);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    if (preselectedRinkId && !selectedRink) {
      fetch(`${API}/rinks/${preselectedRinkId}`)
        .then(r => r.json())
        .then(d => {
          if (d.data) {
            setSelectedRink({ id: d.data.id, name: d.data.name, city: d.data.city, state: d.data.state });
          }
        })
        .catch(() => {});
    }
  }, [preselectedRinkId, selectedRink]);

  function searchRinks(q: string) {
    setRinkQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setRinkResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/rinks?query=${encodeURIComponent(q)}&limit=5`);
        const data = await res.json();
        setRinkResults(data.data?.rinks || data.data || []);
      } catch {}
    }, 300);
  }

  function addGame() {
    setGames([...games, { id: 'g' + Date.now(), day: '', time: '', opponent: '', sheet: '', note: '' }]);
  }
  function updateGame(id: string, field: keyof Game, value: string) {
    setGames(games.map(g => g.id === id ? { ...g, [field]: value } : g));
  }
  function removeGame(id: string) {
    if (games.length <= 1) return;
    setGames(games.filter(g => g.id !== id));
  }

  function addCostItem() {
    setCostItems([...costItems, { id: 'c' + Date.now(), label: '', amount: '', splitType: 'total' }]);
  }
  function updateCostItem(id: string, field: keyof CostItem, value: string) {
    setCostItems(costItems.map(c => c.id === id ? { ...c, [field]: value } : c));
  }
  function removeCostItem(id: string) {
    if (costItems.length <= 1) return;
    setCostItems(costItems.filter(c => c.id !== id));
  }

  function createTrip() {
    if (!selectedRink || !teamName.trim()) return;
    const trip = {
      id: 'trip_' + Math.random().toString(36).slice(2, 10),
      teamName: teamName.trim(),
      dates: dates.trim(),
      rink: selectedRink,
      hotel: hotel.trim(), hotelCost: hotelCost.trim(),
      lunch: lunch.trim(), lunchCost: lunchCost.trim(),
      dinner: dinner.trim(), dinnerCost: dinnerCost.trim(),
      games: games.filter(g => g.opponent.trim() || g.time.trim()),
      notes: notes.trim(),
      collaborative,
      familyCount: parseInt(familyCount) || 16,
      costItems: costItems.filter(c => c.label.trim() && c.amount.trim()),
      additions: [] as any[],
      createdAt: new Date().toISOString(),
    };
    const trips = JSON.parse(localStorage.getItem('coldstart_trips') || '{}');
    trips[trip.id] = trip;
    localStorage.setItem('coldstart_trips', JSON.stringify(trips));
    try { getVibe().log('trip_create', { tripId: trip.id, rinkId: selectedRink.id, fieldCount: Object.values(trip).filter(v => v && v !== '').length }); } catch {}
    router.push(`/trip/${trip.id}`);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 14,
    border: '1px solid #d1d5db', borderRadius: 10,
    outline: 'none', boxSizing: 'border-box',
  };
  const smallInputStyle: React.CSSProperties = { ...inputStyle, padding: '8px 10px', fontSize: 13 };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };

  return (
    <div style={{ minHeight: '100vh', background: '#fafbfc', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', background: 'rgba(250,251,252,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid #f1f5f9' }}>
        <button onClick={() => router.back()} style={{ fontSize: 13, fontWeight: 500, color: '#374151', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>← Back</button>
        <span onClick={() => router.push('/')} style={{ fontSize: 36, fontWeight: 800, color: '#111827', letterSpacing: -0.5, cursor: 'pointer' }}>cold<span style={{ color: '#0ea5e9' }}>start</span></span>
      </nav>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px 60px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>📋 Plan a trip</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>Create a game day page to share with your team.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
          {/* Team name */}
          <div>
            <label style={labelStyle}>Team name *</label>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. South Jersey Bandits 12U AA" style={inputStyle} />
          </div>
          {/* Dates */}
          <div>
            <label style={labelStyle}>Dates</label>
            <input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="e.g. Feb 14-17, 2026" style={inputStyle} />
          </div>
          {/* Rink search */}
          <div>
            <label style={labelStyle}>Rink *</label>
            {selectedRink ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0c4a6e' }}>{selectedRink.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{selectedRink.city}, {selectedRink.state}</div>
                </div>
                <button onClick={() => setSelectedRink(null)} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Change</button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input value={rinkQuery} onChange={(e) => searchRinks(e.target.value)} placeholder="Search for the rink..." style={inputStyle} />
                {rinkResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', marginTop: 4, overflow: 'hidden' }}>
                    {rinkResults.map((r: any) => (
                      <div key={r.id} onClick={() => { setSelectedRink({ id: r.id, name: r.name, city: r.city, state: r.state }); setRinkQuery(''); setRinkResults([]); }} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.city}, {r.state}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Game Schedule ── */}
          <div>
            <label style={labelStyle}>Game schedule</label>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {games.map((game, idx) => (
                <div key={game.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: idx > 0 ? '10px 0 0' : 0, borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>GAME {idx + 1}</span>
                    {games.length > 1 && <button onClick={() => removeGame(game.id)} style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Remove</button>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={game.day} onChange={(e) => updateGame(game.id, 'day', e.target.value)} placeholder="Day (e.g. Sat)" style={{ ...smallInputStyle, flex: 1 }} />
                    <input value={game.time} onChange={(e) => updateGame(game.id, 'time', e.target.value)} placeholder="Time (e.g. 8:00 AM)" style={{ ...smallInputStyle, flex: 1 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={game.opponent} onChange={(e) => updateGame(game.id, 'opponent', e.target.value)} placeholder="vs. Opponent" style={{ ...smallInputStyle, flex: 2 }} />
                    <input value={game.sheet} onChange={(e) => updateGame(game.id, 'sheet', e.target.value)} placeholder="Sheet (e.g. Rink 3)" style={{ ...smallInputStyle, flex: 1 }} />
                  </div>
                  <input value={game.note} onChange={(e) => updateGame(game.id, 'note', e.target.value)} placeholder="Note (e.g. use back entrance for Rink 3)" style={smallInputStyle} />
                </div>
              ))}
              <button onClick={addGame} style={{ fontSize: 12, fontWeight: 600, color: '#0ea5e9', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '8px 0', cursor: 'pointer', width: '100%' }}>+ Add another game</button>
            </div>
          </div>

          {/* Hotel */}
          <div>
            <label style={labelStyle}>Hotel</label>
            <input value={hotel} onChange={(e) => setHotel(e.target.value)} placeholder="e.g. Hampton Inn — has a pool for siblings" style={inputStyle} />
            <input value={hotelCost} onChange={(e) => setHotelCost(e.target.value)} placeholder="💲 e.g. $119/night, team rate $109" style={{ ...inputStyle, marginTop: 6, fontSize: 13 }} />
          </div>
          {/* Meals */}
          <div>
            <label style={labelStyle}>Lunch spot</label>
            <input value={lunch} onChange={(e) => setLunch(e.target.value)} placeholder="e.g. Panera Bread, 0.5 mi from rink" style={inputStyle} />
            <input value={lunchCost} onChange={(e) => setLunchCost(e.target.value)} placeholder="💲 Budget (e.g. ~$12/person)" style={{ ...inputStyle, marginTop: 6, fontSize: 13 }} />
          </div>
          <div>
            <label style={labelStyle}>Dinner spot</label>
            <input value={dinner} onChange={(e) => setDinner(e.target.value)} placeholder="e.g. Applebees — call ahead for 20+" style={inputStyle} />
            <input value={dinnerCost} onChange={(e) => setDinnerCost(e.target.value)} placeholder="💲 Budget (e.g. ~$18/person)" style={{ ...inputStyle, marginTop: 6, fontSize: 13 }} />
          </div>

          {/* ── Cost Breakdown (Danielle's feature) ── */}
          <div>
            <label style={labelStyle}>💰 Cost breakdown</label>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Families on the team:</span>
                <input value={familyCount} onChange={(e) => setFamilyCount(e.target.value.replace(/\D/g, ''))}
                  style={{ width: 50, padding: '4px 8px', fontSize: 14, fontWeight: 700, border: '1px solid #d1d5db', borderRadius: 6, textAlign: 'center', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {costItems.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input value={item.label} onChange={(e) => updateCostItem(item.id, 'label', e.target.value)}
                      placeholder={idx === 0 ? 'e.g. Tournament registration' : 'e.g. Extra ice time'}
                      style={{ ...smallInputStyle, flex: 2 }} />
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9ca3af' }}>$</span>
                      <input value={item.amount} onChange={(e) => updateCostItem(item.id, 'amount', e.target.value.replace(/[^\d.]/g, ''))}
                        placeholder="0" style={{ ...smallInputStyle, paddingLeft: 20 }} />
                    </div>
                    <select value={item.splitType} onChange={(e) => updateCostItem(item.id, 'splitType', e.target.value)}
                      style={{ padding: '6px 4px', fontSize: 11, border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', color: '#374151' }}>
                      <option value="total">Split evenly</option>
                      <option value="per-family">Per family</option>
                      <option value="per-player">Per player</option>
                    </select>
                    {costItems.length > 1 && (
                      <button onClick={() => removeCostItem(item.id)} style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addCostItem} style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 0', cursor: 'pointer', width: '100%', marginTop: 8 }}>+ Add cost line</button>
              {/* Live preview */}
              {costItems.some(c => c.amount && parseFloat(c.amount) > 0) && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', marginBottom: 6 }}>PREVIEW: Per-family cost</div>
                  {costItems.filter(c => c.label.trim() && c.amount).map(item => {
                    const amt = parseFloat(item.amount) || 0;
                    const families = parseInt(familyCount) || 16;
                    const perFamily = item.splitType === 'per-family' ? amt : item.splitType === 'per-player' ? amt : Math.ceil((amt / families) * 100) / 100;
                    return (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', marginBottom: 2 }}>
                        <span>{item.label}</span>
                        <span style={{ fontWeight: 600 }}>
                          ${perFamily.toFixed(2)}
                          {item.splitType === 'total' && <span style={{ color: '#9ca3af', fontWeight: 400 }}> (${amt} ÷ {families})</span>}
                          {item.splitType === 'per-family' && <span style={{ color: '#9ca3af', fontWeight: 400 }}> /family</span>}
                          {item.splitType === 'per-player' && <span style={{ color: '#9ca3af', fontWeight: 400 }}> /player</span>}
                        </span>
                      </div>
                    );
                  })}
                  <div style={{ borderTop: '1px solid #bbf7d0', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                    <span>Total per family</span>
                    <span>${costItems.filter(c => c.label.trim() && c.amount).reduce((sum, item) => {
                      const amt = parseFloat(item.amount) || 0;
                      const families = parseInt(familyCount) || 16;
                      return sum + (item.splitType === 'total' ? Math.ceil((amt / families) * 100) / 100 : amt);
                    }, 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes for the team</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Arrive 45 min early, parking fills up fast on tournament weekends" rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>
          {/* Collaborative toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0c4a6e' }}>👥 Let teammates add info</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Others can add restaurants, tips, and notes</div>
            </div>
            <button onClick={() => setCollaborative(!collaborative)} style={{ width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: collaborative ? '#0ea5e9' : '#d1d5db', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: collaborative ? 27 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
            </button>
          </div>
          {/* Submit */}
          <button onClick={createTrip} disabled={!selectedRink || !teamName.trim()} style={{ width: '100%', padding: '16px 0', fontSize: 16, fontWeight: 700, background: (selectedRink && teamName.trim()) ? '#0ea5e9' : '#e5e7eb', color: (selectedRink && teamName.trim()) ? '#fff' : '#9ca3af', border: 'none', borderRadius: 12, cursor: (selectedRink && teamName.trim()) ? 'pointer' : 'default', marginTop: 12, transition: 'all 0.2s', boxShadow: (selectedRink && teamName.trim()) ? '0 4px 14px rgba(14,165,233,0.3)' : 'none' }}>
            {selectedRink ? `Create ${(rinks.find(r => r.id === selectedRink) || { name: '' }).name} trip page →` : 'Create trip page →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TripNewPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading...</div>}>
      <TripBuilderInner />
    </Suspense>
  );
}
