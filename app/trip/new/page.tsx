'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageShell } from '../../../components/PageShell';
import { apiGet, seedGet } from '../../../lib/api';
import { storage } from '../../../lib/storage';
import { getRinkSlug } from '../../../lib/rinkHelpers';
import { colors, text } from '../../../lib/theme';
import { CollapsibleSection } from '../../../components/trip/CollapsibleSection';
import { NearbyPicker } from '../../../components/trip/NearbyPicker';
import { Game, CostItem, NearbyPlace, NearbyData } from '../../../types/trip';

import { getVibe as _getVibe } from '../../vibe';
const getVibe = () => {
  if (typeof window === 'undefined') return { log: () => {} };
  try { return _getVibe(); } catch { return { log: () => {} }; }
};

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
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRestoredRef = useRef(false);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    games: false, lodging: false, costs: false, notes: false,
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
      if (!draft.startDate && draft.dates) setStartDate(draft.dates);
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
    seedGet<NearbyData>(`/data/nearby/${slug}.json`)
      .then(data => { if (data) setNearbyData(data); });
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
    border: `1px solid ${colors.borderMedium}`, borderRadius: 10,
    outline: 'none', boxSizing: 'border-box',
  };
  const smallInputStyle: React.CSSProperties = { ...inputStyle, padding: '8px 10px', fontSize: 13 };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: 4 };

  return (
    <PageShell
      back
      navRight={draftStatus === 'saved' ? (
        <span style={{ fontSize: 11, color: colors.success, fontWeight: 500 }}>Draft saved</span>
      ) : undefined}
    >
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px 60px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>📋 Plan a trip</h1>
        <p style={{ fontSize: 14, color: colors.textTertiary, marginTop: 8 }}>Create a game day page to share with your team.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
          {/* ── Always visible: Team name, Dates, Rink ── */}
          <div>
            <label style={labelStyle}>Team name *</label>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. South Jersey Bandits 12U AA" aria-label="Team name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Dates</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label="Start date" style={{ ...inputStyle, flex: 1 }} />
              <span style={{ fontSize: 13, color: colors.textMuted, flexShrink: 0 }}>to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} aria-label="End date" style={{ ...inputStyle, flex: 1 }} />
            </div>
          </div>
          {/* Rink search + state filter */}
          <div>
            <label style={labelStyle}>Rink *</label>
            {selectedRink ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: colors.bgInfo, border: `1px solid ${colors.brandLight}`, borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.brandDeep }}>{selectedRink.name}</div>
                  <div style={{ fontSize: 12, color: colors.textTertiary }}>{selectedRink.city}, {selectedRink.state}</div>
                </div>
                <button onClick={() => { setSelectedRink(null); setRinkSearch(''); }} aria-label="Change rink" style={{ fontSize: 12, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Change</button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={rinkSearch}
                    onChange={(e) => setRinkSearch(e.target.value)}
                    placeholder="Search by rink name or city..."
                    aria-label="Search rinks"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <select
                    value={rinkStateFilter}
                    onChange={(e) => setRinkStateFilter(e.target.value)}
                    aria-label="Filter by state"
                    style={{
                      ...inputStyle, width: 80, padding: '10px 8px',
                      color: rinkStateFilter ? colors.textPrimary : colors.textMuted,
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
                    <div role="listbox" aria-label="Rink search results" style={{ border: `1px solid ${colors.borderDefault}`, borderRadius: 10, overflow: 'hidden', maxHeight: 240, overflowY: 'auto' }}>
                      {filtered.map((r: RinkListItem) => (
                        <div
                          key={r.id}
                          role="option"
                          aria-selected={false}
                          tabIndex={0}
                          onClick={() => { setSelectedRink({ id: r.id, name: r.name, city: r.city, state: r.state }); setRinkSearch(''); setRinkStateFilter(''); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedRink({ id: r.id, name: r.name, city: r.city, state: r.state }); setRinkSearch(''); setRinkStateFilter(''); } }}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${colors.borderLight}`, background: colors.surface }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgInfo)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = colors.surface)}
                        >
                          <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>{r.name}</div>
                          <div style={{ fontSize: 12, color: colors.textMuted }}>{r.city}, {r.state}</div>
                        </div>
                      ))}
                      {allRinks.filter((r: RinkListItem) => {
                        if (rinkStateFilter && r.state !== rinkStateFilter) return false;
                        if (q.length >= 2) return r.name?.toLowerCase().includes(q) || r.city?.toLowerCase().includes(q);
                        return true;
                      }).length > 20 && (
                        <div style={{ padding: '8px 14px', fontSize: 12, color: colors.textMuted, textAlign: 'center', background: colors.bgPage }}>
                          Type more to narrow results...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '12px 14px', fontSize: 13, color: colors.textMuted, textAlign: 'center', border: `1px solid ${colors.borderDefault}`, borderRadius: 10 }}>
                      No rinks found
                    </div>
                  );
                })()}
                {!rinkSearch && !rinkStateFilter && (
                  <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                    Search by name or pick a state to browse
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Optional sections — progressive disclosure ── */}
          {!canShowOptional ? (
            <div style={{
              border: `2px dashed ${colors.borderDefault}`, borderRadius: 12,
              padding: '20px 24px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>
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
                    <div key={game.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: idx > 0 ? '10px 0 0' : 0, borderTop: idx > 0 ? `1px solid ${colors.borderLight}` : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted }}>GAME {idx + 1}</span>
                        {games.length > 1 && <button onClick={() => removeGame(game.id)} aria-label={`Remove game ${idx + 1}`} style={{ fontSize: 11, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>✕ Remove</button>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="date" value={game.day} onChange={(e) => updateGame(game.id, 'day', e.target.value)} aria-label={`Game ${idx + 1} date`} style={{ ...smallInputStyle, flex: 1 }} />
                        <input type="time" value={game.time} onChange={(e) => updateGame(game.id, 'time', e.target.value)} aria-label={`Game ${idx + 1} time`} style={{ ...smallInputStyle, flex: 1 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input value={game.opponent} onChange={(e) => updateGame(game.id, 'opponent', e.target.value)} placeholder="vs. Opponent" aria-label={`Game ${idx + 1} opponent`} style={{ ...smallInputStyle, flex: 2 }} />
                        <input value={game.sheet} onChange={(e) => updateGame(game.id, 'sheet', e.target.value)} placeholder="Sheet (e.g. Rink 3)" aria-label={`Game ${idx + 1} sheet`} style={{ ...smallInputStyle, flex: 1 }} />
                      </div>
                      <input value={game.note} onChange={(e) => updateGame(game.id, 'note', e.target.value)} placeholder="Note (e.g. use back entrance for Rink 3)" aria-label={`Game ${idx + 1} note`} style={smallInputStyle} />
                    </div>
                  ))}
                  <button onClick={addGame} style={{ fontSize: 12, fontWeight: 600, color: colors.brand, background: colors.bgInfo, border: `1px solid ${colors.brandLight}`, borderRadius: 8, padding: '8px 0', cursor: 'pointer', width: '100%' }}>+ Add another game</button>
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
                  aria-label="Remove cost breakdown"
                  style={{
                    position: 'absolute', top: 10, right: 10, zIndex: 2,
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#f3f4f6', border: `1px solid ${colors.borderDefault}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 12, color: colors.textMuted,
                    lineHeight: 1,
                  }}
                >✕</button>
              <CollapsibleSection
                title="Cost breakdown"
                icon="💰"
                expanded={expandedSections.costs}
                onToggle={() => toggleSection('costs')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: colors.textTertiary }}>Families on the team:</span>
                    <input value={familyCount} onChange={(e) => setFamilyCount(e.target.value.replace(/\D/g, ''))}
                      aria-label="Number of families"
                      style={{ width: 50, padding: '4px 8px', fontSize: 14, fontWeight: 700, border: `1px solid ${colors.borderMedium}`, borderRadius: 6, textAlign: 'center', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {costItems.map((item, idx) => (
                      <div key={item.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input value={item.label} onChange={(e) => updateCostItem(item.id, 'label', e.target.value)}
                          placeholder={idx === 0 ? 'e.g. Tournament registration' : 'e.g. Extra ice time'}
                          aria-label={`Cost item ${idx + 1} label`}
                          style={{ ...smallInputStyle, flex: 2 }} />
                        <div style={{ position: 'relative', flex: 1 }}>
                          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: colors.textMuted }}>$</span>
                          <input value={item.amount} onChange={(e) => updateCostItem(item.id, 'amount', e.target.value.replace(/[^\d.]/g, ''))}
                            placeholder="0" aria-label={`Cost item ${idx + 1} amount`}
                            style={{ ...smallInputStyle, paddingLeft: 20 }} />
                        </div>
                        <select value={item.splitType} onChange={(e) => updateCostItem(item.id, 'splitType', e.target.value)}
                          aria-label={`Cost item ${idx + 1} split type`}
                          style={{ padding: '6px 4px', fontSize: 11, border: `1px solid ${colors.borderMedium}`, borderRadius: 6, background: colors.surface, color: colors.textSecondary }}>
                          <option value="total">Split evenly</option>
                          <option value="per-family">Per family</option>
                          <option value="per-player">Per player</option>
                        </select>
                        {costItems.length > 1 && (
                          <button onClick={() => removeCostItem(item.id)} aria-label={`Remove cost item ${idx + 1}`} style={{ fontSize: 11, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={addCostItem} style={{ fontSize: 12, fontWeight: 600, color: colors.success, background: colors.bgSuccess, border: `1px solid ${colors.successBorder}`, borderRadius: 8, padding: '6px 0', cursor: 'pointer', width: '100%', marginTop: 8 }}>+ Add cost line</button>
                  {costItems.some(c => c.amount && parseFloat(c.amount) > 0) && (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: colors.bgSuccess, border: `1px solid ${colors.successBorder}`, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: colors.success, marginBottom: 6 }}>PREVIEW: Per-family cost</div>
                      {costItems.filter(c => c.label.trim() && c.amount).map(item => {
                        const amt = parseFloat(item.amount) || 0;
                        const families = parseInt(familyCount) || 16;
                        const perFamily = item.splitType === 'per-family' ? amt : item.splitType === 'per-player' ? amt : Math.ceil((amt / families) * 100) / 100;
                        return (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.textSecondary, marginBottom: 2 }}>
                            <span>{item.label}</span>
                            <span style={{ fontWeight: 600 }}>
                              ${perFamily.toFixed(2)}
                              {item.splitType === 'total' && <span style={{ color: colors.textMuted, fontWeight: 400 }}> (${amt} ÷ {families})</span>}
                              {item.splitType === 'per-family' && <span style={{ color: colors.textMuted, fontWeight: 400 }}> /family</span>}
                              {item.splitType === 'per-player' && <span style={{ color: colors.textMuted, fontWeight: 400 }}> /player</span>}
                            </span>
                          </div>
                        );
                      })}
                      <div style={{ borderTop: `1px solid ${colors.successBorder}`, marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: colors.success }}>
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
                    color: colors.textMuted, background: colors.bgPage,
                    border: `1px dashed ${colors.borderDefault}`, borderRadius: 12,
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
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Arrive 45 min early, parking fills up fast on tournament weekends" aria-label="Trip notes" rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </CollapsibleSection>

              {/* Collaborative toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: colors.bgInfo, border: `1px solid ${colors.brandLight}`, borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.brandDeep }}>👥 Let teammates add info</div>
                  <div style={{ fontSize: 11, color: colors.textTertiary, marginTop: 2 }}>Others can add restaurants, tips, and notes</div>
                </div>
                <button
                  onClick={() => setCollaborative(!collaborative)}
                  role="switch"
                  aria-checked={collaborative}
                  aria-label="Let teammates add info"
                  style={{ width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: collaborative ? colors.brand : colors.textDisabled, position: 'relative', transition: 'background 0.2s' }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: colors.surface, position: 'absolute', top: 3, left: collaborative ? 27 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                </button>
              </div>
            </>
          )}

          {/* Submit */}
          <button onClick={createTrip} disabled={!selectedRink || !teamName.trim()} style={{ width: '100%', padding: '16px 0', fontSize: 16, fontWeight: 700, background: (selectedRink && teamName.trim()) ? colors.brand : colors.borderDefault, color: (selectedRink && teamName.trim()) ? colors.textInverse : colors.textMuted, border: 'none', borderRadius: 12, cursor: (selectedRink && teamName.trim()) ? 'pointer' : 'default', marginTop: 12, transition: 'all 0.2s', boxShadow: (selectedRink && teamName.trim()) ? '0 4px 14px rgba(14,165,233,0.3)' : 'none' }}>
            {selectedRink ? `Create ${selectedRink.name} trip page →` : 'Create trip page →'}
          </button>
        </div>
      </div>
    </PageShell>
  );
}

export default function TripNewPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: colors.textMuted }}>Loading...</div>}>
      <TripBuilderInner />
    </Suspense>
  );
}
