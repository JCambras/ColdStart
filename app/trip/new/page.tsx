'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '../../../components/Logo';
import { apiGet } from '../../../lib/api';
import { storage } from '../../../lib/storage';

import { getVibe as _getVibe } from '../../vibe';
const getVibe = () => {
  if (typeof window === 'undefined') return { log: () => {} };
  try { return _getVibe(); } catch { return { log: () => {} }; }
};

interface Game { id: string; day: string; time: string; opponent: string; sheet: string; note: string; }
interface CostItem { id: string; label: string; amount: string; splitType: 'per-family' | 'per-player' | 'total'; }
interface NearbyPlace { name: string; distance: string; url: string; isFar?: boolean; }
interface NearbyData { [category: string]: NearbyPlace[]; }
interface RinkListItem { id: string; name: string; city: string; state: string; }
interface TripDraft {
  teamName?: string;
  startDate?: string;
  endDate?: string;
  dates?: string;
  selectedRink?: { id: string; name: string; city: string; state: string } | null;
  hotel?: NearbyPlace | null;
  hotelCost?: string;
  lunch?: NearbyPlace | null;
  lunchCost?: string;
  dinner?: NearbyPlace | null;
  dinnerCost?: string;
  games?: Game[];
  notes?: string;
  familyCount?: string;
  costItems?: CostItem[];
  collaborative?: boolean;
  showCosts?: boolean;
}
interface TripAddition { text: string; author: string; timestamp: string; }

function getRinkSlug(rink: { name: string; city?: string }): string {
  const city = (rink.city || '').toLowerCase();
  return `${rink.name} ${city}`.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function NearbyPicker({ label, icon, places, selected, onSelect, onClear, costValue, onCostChange }: {
  label: string; icon: string; places: NearbyPlace[]; selected: NearbyPlace | null;
  onSelect: (p: NearbyPlace) => void; onClear: () => void; costValue: string; onCostChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{icon} {label}</label>
      {selected ? (
        <div style={{ border: '1px solid #bae6fd', background: '#f0f9ff', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0c4a6e' }}>{selected.name}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>{selected.distance}</span>
                <a href={selected.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#0ea5e9', textDecoration: 'none', fontWeight: 500 }}>
                  Directions ↗
                </a>
              </div>
            </div>
            <button onClick={() => { onClear(); setOpen(false); }} style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>Change</button>
          </div>
          <input value={costValue} onChange={(e) => onCostChange(e.target.value)}
            placeholder="💲 Budget (optional)" style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none', boxSizing: 'border-box' as const, marginTop: 8 }} />
        </div>
      ) : places.length > 0 ? (
        <div>
          <button onClick={() => setOpen(!open)} style={{
            width: '100%', padding: '10px 14px', fontSize: 13, color: '#6b7280',
            background: '#fff', border: '1px solid #d1d5db', borderRadius: 10,
            cursor: 'pointer', textAlign: 'left',
          }}>
            Choose from nearby places ▾
          </button>
          {open && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', maxHeight: 200, overflowY: 'auto', marginTop: 4 }}>
              {places.map((p, i) => (
                <div key={i} onClick={() => { onSelect(p); setOpen(false); }}
                  style={{ padding: '8px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 8 }}>{p.distance}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '10px 14px', fontSize: 13, color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: 10, textAlign: 'center' }}>
          Select a rink first to see nearby options
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, icon, expanded, onToggle, children }: {
  title: string; icon: string; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
          {icon} {title}
        </span>
        <span style={{
          fontSize: 14, color: '#9ca3af', transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'none', display: 'inline-block',
        }}>
          ▾
        </span>
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 16px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function TripBuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRinkId = searchParams.get('rink') || '';

  const [teamName, setTeamName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allRinks, setAllRinks] = useState<RinkListItem[]>([]);
  const [selectedRink, setSelectedRink] = useState<{ id: string; name: string; city: string; state: string } | null>(null);
  const [rinkSearch, setRinkSearch] = useState('');
  const [rinkStateFilter, setRinkStateFilter] = useState('');
  const [hotel, setHotel] = useState<NearbyPlace | null>(null);
  const [hotelCost, setHotelCost] = useState('');
  const [lunch, setLunch] = useState<NearbyPlace | null>(null);
  const [lunchCost, setLunchCost] = useState('');
  const [dinner, setDinner] = useState<NearbyPlace | null>(null);
  const [dinnerCost, setDinnerCost] = useState('');
  const [nearbyData, setNearbyData] = useState<NearbyData | null>(null);
  const [showCosts, setShowCosts] = useState(true);
  const [games, setGames] = useState<Game[]>([{ id: 'g1', day: '', time: '', opponent: '', sheet: '', note: '' }]);
  const [notes, setNotes] = useState('');
  const [collaborative, setCollaborative] = useState(true);
  const [familyCount, setFamilyCount] = useState('16');
  const [costItems, setCostItems] = useState<CostItem[]>([
    { id: 'c1', label: '', amount: '', splitType: 'total' },
  ]);
  // Draft status
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRestoredRef = useRef(false);

  // Progressive disclosure
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    games: false,
    lodging: false,
    costs: false,
    notes: false,
  });

  const canShowOptional = !!(teamName.trim() && selectedRink);

  function toggleSection(key: string) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // ── Draft restore on mount ──
  useEffect(() => {
    if (draftRestoredRef.current) return;
    draftRestoredRef.current = true;
    const raw = storage.getTripDraft();
    {
      const draft = raw as TripDraft | null;
      if (!draft) return;
      if (draft.teamName) setTeamName(draft.teamName);
      if (draft.startDate) setStartDate(draft.startDate);
      if (draft.endDate) setEndDate(draft.endDate);
      // Legacy: support old single "dates" field from previous drafts
      if (!draft.startDate && draft.dates) setStartDate(draft.dates);
      // preselectedRinkId takes precedence over draft rink
      if (!preselectedRinkId && draft.selectedRink) setSelectedRink(draft.selectedRink);
      if (draft.hotel) setHotel(typeof draft.hotel === 'string' ? null : draft.hotel);
      if (draft.hotelCost) setHotelCost(draft.hotelCost);
      if (draft.lunch) setLunch(typeof draft.lunch === 'string' ? null : draft.lunch);
      if (draft.lunchCost) setLunchCost(draft.lunchCost);
      if (draft.dinner) setDinner(typeof draft.dinner === 'string' ? null : draft.dinner);
      if (draft.dinnerCost) setDinnerCost(draft.dinnerCost);
      if (draft.showCosts === false) setShowCosts(false);
      if (draft.games?.length) setGames(draft.games);
      if (draft.notes) setNotes(draft.notes);
      if (draft.familyCount) setFamilyCount(draft.familyCount);
      if (draft.costItems?.length) setCostItems(draft.costItems);
      if (typeof draft.collaborative === 'boolean') setCollaborative(draft.collaborative);

      // Auto-expand sections that have data from draft
      const autoExpand: Record<string, boolean> = { games: false, lodging: false, costs: false, notes: false };
      if (draft.games?.some((g: Game) => g.opponent || g.time)) autoExpand.games = true;
      if (draft.hotel || draft.hotelCost || draft.lunch || draft.lunchCost || draft.dinner || draft.dinnerCost || (typeof draft.hotel === 'object' && draft.hotel)) autoExpand.lodging = true;
      if (draft.costItems?.some((c: CostItem) => c.label || c.amount)) autoExpand.costs = true;
      if (draft.notes) autoExpand.notes = true;
      setExpandedSections(autoExpand);
    }
  }, [preselectedRinkId]);

  // ── Auto-save draft (debounced 500ms) ──
  const saveDraft = useCallback(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const draft = {
        teamName, startDate, endDate, selectedRink, hotel, hotelCost,
        lunch, lunchCost, dinner, dinnerCost, games, notes,
        familyCount, costItems, collaborative, showCosts,
      };
      storage.setTripDraft(draft as Record<string, unknown>);
      setDraftStatus('saved');
      setTimeout(() => setDraftStatus('idle'), 1500);
    }, 500);
  }, [teamName, startDate, endDate, selectedRink, hotel, hotelCost, lunch, lunchCost, dinner, dinnerCost, games, notes, familyCount, costItems, collaborative, showCosts]);

  useEffect(() => {
    // Don't save on first render (draft restore)
    if (!draftRestoredRef.current) return;
    saveDraft();
  }, [saveDraft]);

  // Load all rinks for dropdown
  useEffect(() => {
    async function loadRinks() {
      const { data } = await apiGet<RinkListItem[]>('/rinks?limit=200', {
        seedPath: '/data/rinks.json',
        transform: (raw) => raw as RinkListItem[],
      });
      const rinks: RinkListItem[] = Array.isArray(data) ? data : [];
      if (rinks.length > 0) {
        setAllRinks(rinks);
        if (preselectedRinkId && !selectedRink) {
          const match = rinks.find((r) => r.id === preselectedRinkId);
          if (match) setSelectedRink({ id: match.id, name: match.name, city: match.city, state: match.state });
        }
      }
    }
    loadRinks();
  }, [preselectedRinkId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load nearby data when rink is selected
  useEffect(() => {
    if (!selectedRink) { setNearbyData(null); return; }
    const slug = getRinkSlug(selectedRink);
    if (!slug) return;
    fetch(`/data/nearby/${slug}.json`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setNearbyData(data); })
      .catch(() => {});
  }, [selectedRink]);

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
      dates: [startDate, endDate].filter(Boolean).join(' – '),
      startDate,
      endDate,
      rink: selectedRink,
      hotel, hotelCost: hotelCost.trim(),
      lunch, lunchCost: lunchCost.trim(),
      dinner, dinnerCost: dinnerCost.trim(),
      games: games.filter(g => g.opponent.trim() || g.time.trim()),
      notes: notes.trim(),
      collaborative,
      familyCount: parseInt(familyCount) || 16,
      costItems: costItems.filter(c => c.label.trim() && c.amount.trim()),
      additions: [] as TripAddition[],
      createdAt: new Date().toISOString(),
    };
    const trips = storage.getTrips();
    trips[trip.id] = trip;
    storage.setTrips(trips);
    storage.setTripDraft(null);
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
        <Logo size={36} />
        {draftStatus === 'saved' && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#16a34a', fontWeight: 500 }}>Draft saved</span>
        )}
      </nav>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px 60px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>📋 Plan a trip</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>Create a game day page to share with your team.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
          {/* ── Always visible: Team name, Dates, Rink ── */}
          {/* Team name */}
          <div>
            <label style={labelStyle}>Team name *</label>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. South Jersey Bandits 12U AA" style={inputStyle} />
          </div>
          {/* Dates */}
          <div>
            <label style={labelStyle}>Dates</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <span style={{ fontSize: 13, color: '#9ca3af', flexShrink: 0 }}>to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            </div>
          </div>
          {/* Rink search + state filter */}
          <div>
            <label style={labelStyle}>Rink *</label>
            {selectedRink ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0c4a6e' }}>{selectedRink.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{selectedRink.city}, {selectedRink.state}</div>
                </div>
                <button onClick={() => { setSelectedRink(null); setRinkSearch(''); }} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>Change</button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={rinkSearch}
                    onChange={(e) => setRinkSearch(e.target.value)}
                    placeholder="Search by rink name or city..."
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <select
                    value={rinkStateFilter}
                    onChange={(e) => setRinkStateFilter(e.target.value)}
                    style={{
                      ...inputStyle, width: 80, padding: '10px 8px',
                      color: rinkStateFilter ? '#111827' : '#9ca3af',
                    }}
                  >
                    <option value="">State</option>
                    {[...new Set(allRinks.map((r: RinkListItem) => r.state).filter(Boolean))].sort().map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {(rinkSearch.length >= 2 || rinkStateFilter) && (() => {
                  const q = rinkSearch.toLowerCase();
                  const filtered = allRinks
                    .filter((r: RinkListItem) => {
                      if (rinkStateFilter && r.state !== rinkStateFilter) return false;
                      if (q.length >= 2) {
                        return r.name?.toLowerCase().includes(q) || r.city?.toLowerCase().includes(q);
                      }
                      return true;
                    })
                    .sort((a: RinkListItem, b: RinkListItem) => (a.name || '').localeCompare(b.name || ''))
                    .slice(0, 20);
                  return filtered.length > 0 ? (
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', maxHeight: 240, overflowY: 'auto' }}>
                      {filtered.map((r: RinkListItem) => (
                        <div
                          key={r.id}
                          onClick={() => { setSelectedRink({ id: r.id, name: r.name, city: r.city, state: r.state }); setRinkSearch(''); setRinkStateFilter(''); }}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: '#fff' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                        >
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{r.name}</div>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.city}, {r.state}</div>
                        </div>
                      ))}
                      {allRinks.filter((r: RinkListItem) => {
                        if (rinkStateFilter && r.state !== rinkStateFilter) return false;
                        if (q.length >= 2) return r.name?.toLowerCase().includes(q) || r.city?.toLowerCase().includes(q);
                        return true;
                      }).length > 20 && (
                        <div style={{ padding: '8px 14px', fontSize: 12, color: '#9ca3af', textAlign: 'center', background: '#fafbfc' }}>
                          Type more to narrow results...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '12px 14px', fontSize: 13, color: '#9ca3af', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                      No rinks found
                    </div>
                  );
                })()}
                {!rinkSearch && !rinkStateFilter && (
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    Search by name or pick a state to browse
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Optional sections — progressive disclosure ── */}
          {!canShowOptional ? (
            <div style={{
              border: '2px dashed #e5e7eb', borderRadius: 12,
              padding: '20px 24px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                Fill in team name and select a rink to see more options
              </p>
            </div>
          ) : (
            <>
              {/* Game Schedule */}
              <CollapsibleSection
                title="Game schedule"
                icon="🏒"
                expanded={expandedSections.games}
                onToggle={() => toggleSection('games')}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {games.map((game, idx) => (
                    <div key={game.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: idx > 0 ? '10px 0 0' : 0, borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>GAME {idx + 1}</span>
                        {games.length > 1 && <button onClick={() => removeGame(game.id)} style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Remove</button>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="date" value={game.day} onChange={(e) => updateGame(game.id, 'day', e.target.value)} style={{ ...smallInputStyle, flex: 1 }} />
                        <input type="time" value={game.time} onChange={(e) => updateGame(game.id, 'time', e.target.value)} style={{ ...smallInputStyle, flex: 1 }} />
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
              </CollapsibleSection>

              {/* Lodging & Food */}
              <CollapsibleSection
                title="Lodging & food"
                icon="🏨"
                expanded={expandedSections.lodging}
                onToggle={() => toggleSection('lodging')}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <NearbyPicker
                    label="Hotel"
                    icon="🏨"
                    places={nearbyData?.hotels || []}
                    selected={hotel}
                    onSelect={setHotel}
                    onClear={() => setHotel(null)}
                    costValue={hotelCost}
                    onCostChange={setHotelCost}
                  />
                  <NearbyPicker
                    label="Lunch spot"
                    icon="🍕"
                    places={[...(nearbyData?.team_lunch || []), ...(nearbyData?.quick_bite || [])]}
                    selected={lunch}
                    onSelect={setLunch}
                    onClear={() => setLunch(null)}
                    costValue={lunchCost}
                    onCostChange={setLunchCost}
                  />
                  <NearbyPicker
                    label="Dinner spot"
                    icon="🍝"
                    places={nearbyData?.dinner || []}
                    selected={dinner}
                    onSelect={setDinner}
                    onClear={() => setDinner(null)}
                    costValue={dinnerCost}
                    onCostChange={setDinnerCost}
                  />
                </div>
              </CollapsibleSection>

              {/* Cost Breakdown */}
              {showCosts ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowCosts(false)}
                  style={{
                    position: 'absolute', top: 10, right: 10, zIndex: 2,
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#f3f4f6', border: '1px solid #e5e7eb',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 12, color: '#9ca3af',
                    lineHeight: 1,
                  }}
                  title="Remove cost breakdown"
                >✕</button>
              <CollapsibleSection
                title="Cost breakdown"
                icon="💰"
                expanded={expandedSections.costs}
                onToggle={() => toggleSection('costs')}
              >
                <div>
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
              </CollapsibleSection>
              </div>
              ) : (
                <button
                  onClick={() => setShowCosts(true)}
                  style={{
                    width: '100%', padding: '12px 16px', fontSize: 13,
                    color: '#9ca3af', background: '#fafbfc',
                    border: '1px dashed #e5e7eb', borderRadius: 12,
                    cursor: 'pointer', textAlign: 'center',
                  }}
                >
                  💰 Add cost breakdown
                </button>
              )}

              {/* Notes */}
              <CollapsibleSection
                title="Notes for the team"
                icon="📝"
                expanded={expandedSections.notes}
                onToggle={() => toggleSection('notes')}
              >
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Arrive 45 min early, parking fills up fast on tournament weekends" rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </CollapsibleSection>

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
            </>
          )}

          {/* Submit */}
          <button onClick={createTrip} disabled={!selectedRink || !teamName.trim()} style={{ width: '100%', padding: '16px 0', fontSize: 16, fontWeight: 700, background: (selectedRink && teamName.trim()) ? '#0ea5e9' : '#e5e7eb', color: (selectedRink && teamName.trim()) ? '#fff' : '#9ca3af', border: 'none', borderRadius: 12, cursor: (selectedRink && teamName.trim()) ? 'pointer' : 'default', marginTop: 12, transition: 'all 0.2s', boxShadow: (selectedRink && teamName.trim()) ? '0 4px 14px rgba(14,165,233,0.3)' : 'none' }}>
            {selectedRink ? `Create ${selectedRink.name} trip page →` : 'Create trip page →'}
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
