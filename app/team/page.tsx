'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '../../components/PageShell';
import { storage } from '../../lib/storage';
import { apiGet } from '../../lib/api';
import { getBarColor, getBarBg } from '../../lib/rinkHelpers';
import { colors, text, radius, spacing, pad } from '../../lib/theme';

interface Team {
  name: string;
  homeRinkId: string;
  homeRinkName: string;
  homeRinkCity: string;
  homeRinkState: string;
}

interface Trip {
  id: string;
  teamName: string;
  dates: string;
  rink: { id: string; name: string; city: string; state: string };
  createdAt: string;
  games?: { id: string; opponent: string; time: string }[];
}

interface RinkSearchResult {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface SignalSummary {
  signal: string;
  value: number;
  count: number;
}

interface RinkSummaryData {
  id?: string;
  rink_id?: string;
  summary?: {
    signals?: SignalSummary[];
    verdict?: string;
  };
}

export default function TeamDashboardPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Setup form state
  const [teamName, setTeamName] = useState('');
  const [rinkQuery, setRinkQuery] = useState('');
  const [rinkResults, setRinkResults] = useState<RinkSearchResult[]>([]);
  const [selectedRink, setSelectedRink] = useState<RinkSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [editing, setEditing] = useState(false);

  // Dashboard state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [rinkSummaries, setRinkSummaries] = useState<Map<string, { signals: SignalSummary[]; verdict: string }>>(new Map());

  useEffect(() => {
    const saved = storage.getTeam();
    setTeam(saved);
    setLoaded(true);
  }, []);

  // Load trips for team
  useEffect(() => {
    if (!team) return;
    const stored = storage.getTrips();
    const list = (Object.values(stored) as Trip[])
      .filter(t => t.teamName.toLowerCase() === team.name.toLowerCase())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    setTrips(list);
  }, [team]);

  // Fetch rink summaries for trip rinks + home rink
  useEffect(() => {
    if (!team) return;
    const rinkIds = new Set<string>([team.homeRinkId]);
    trips.forEach(t => rinkIds.add(t.rink.id));
    if (rinkIds.size === 0) return;

    const idsParam = Array.from(rinkIds).slice(0, 50).join(',');
    apiGet<{ data: RinkSummaryData[] }>(`/rinks?ids=${encodeURIComponent(idsParam)}`)
      .then(({ data }) => {
        if (!data?.data) return;
        const map = new Map<string, { signals: SignalSummary[]; verdict: string }>();
        for (const r of data.data) {
          const id = r.id || r.rink_id;
          if (id && r.summary) {
            map.set(id, {
              signals: r.summary.signals || [],
              verdict: r.summary.verdict || '',
            });
          }
        }
        setRinkSummaries(map);
      });
  }, [team, trips]);

  // Rink search with debounce
  useEffect(() => {
    if (!rinkQuery.trim() || rinkQuery.trim().length < 2) {
      setRinkResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      const { data } = await apiGet<RinkSearchResult[]>(`/rinks?query=${encodeURIComponent(rinkQuery)}`);
      if (data) {
        setRinkResults((Array.isArray(data) ? data : []).slice(0, 8));
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [rinkQuery]);

  const handleSaveTeam = useCallback(() => {
    if (!teamName.trim() || !selectedRink) return;
    const newTeam: Team = {
      name: teamName.trim(),
      homeRinkId: selectedRink.id,
      homeRinkName: selectedRink.name,
      homeRinkCity: selectedRink.city,
      homeRinkState: selectedRink.state,
    };
    storage.setTeam(newTeam);
    setTeam(newTeam);
    setEditing(false);
  }, [teamName, selectedRink]);

  function startEdit() {
    if (team) {
      setTeamName(team.name);
      setSelectedRink({ id: team.homeRinkId, name: team.homeRinkName, city: team.homeRinkCity, state: team.homeRinkState });
      setRinkQuery('');
    }
    setEditing(true);
  }

  if (!loaded) return <PageShell back="/" backLabel="← Home"><div /></PageShell>;

  const showSetup = !team || editing;

  // ─── Setup Mode ───
  if (showSetup) {
    return (
      <PageShell back="/" backLabel="← Home">
        <div style={{ maxWidth: 480, margin: '0 auto', padding: pad(spacing[40], spacing[24], spacing[80]) }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary, margin: '0 0 4px' }}>
            {editing ? 'Edit your team' : 'Set up your team'}
          </h1>
          <p style={{ fontSize: 14, color: colors.textTertiary, margin: '0 0 28px' }}>
            Add your team to see upcoming trips and rink intel in one place.
          </p>

          {/* Team name */}
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.textSecondary, marginBottom: spacing[6] }}>
            Team name
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. West Chester Wolverines"
            style={{
              width: '100%', padding: '12px 16px', fontSize: 15,
              border: `1px solid ${colors.borderDefault}`, borderRadius: radius.lg,
              background: colors.surface, outline: 'none', boxSizing: 'border-box',
              color: colors.textPrimary,
            }}
          />

          {/* Home rink picker */}
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.textSecondary, marginTop: spacing[20], marginBottom: spacing[6] }}>
            Home rink
          </label>
          {selectedRink ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: colors.bgSuccess, border: `1px solid ${colors.successBorder}`,
              borderRadius: radius.lg,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>{selectedRink.name}</div>
                <div style={{ fontSize: 12, color: colors.textMuted }}>{selectedRink.city}, {selectedRink.state}</div>
              </div>
              <button
                onClick={() => { setSelectedRink(null); setRinkQuery(''); }}
                style={{ fontSize: 12, color: colors.brand, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={rinkQuery}
                onChange={(e) => setRinkQuery(e.target.value)}
                placeholder="Search for your home rink..."
                style={{
                  width: '100%', padding: '12px 16px', fontSize: 15,
                  border: `1px solid ${colors.borderDefault}`, borderRadius: radius.lg,
                  background: colors.surface, outline: 'none', boxSizing: 'border-box',
                  color: colors.textPrimary,
                }}
              />
              {searching && (
                <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>Searching...</p>
              )}
              {rinkResults.length > 0 && (
                <div style={{
                  marginTop: 4, border: `1px solid ${colors.borderDefault}`,
                  borderRadius: radius.lg, overflow: 'hidden',
                }}>
                  {rinkResults.map(r => (
                    <button
                      key={r.id}
                      onClick={() => { setSelectedRink(r); setRinkQuery(''); setRinkResults([]); }}
                      style={{
                        display: 'block', width: '100%', padding: '10px 16px',
                        background: colors.surface, border: 'none', borderBottom: `1px solid ${colors.borderLight}`,
                        textAlign: 'left', cursor: 'pointer', fontSize: 14, color: colors.textPrimary,
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{r.name}</span>
                      <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 8 }}>{r.city}, {r.state}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <button
            onClick={handleSaveTeam}
            disabled={!teamName.trim() || !selectedRink}
            style={{
              marginTop: spacing[28], width: '100%', padding: pad(spacing[14], spacing[24]),
              fontSize: 15, fontWeight: 600,
              color: colors.textInverse,
              background: (!teamName.trim() || !selectedRink) ? colors.textDisabled : colors.textPrimary,
              border: 'none', borderRadius: radius.lg,
              cursor: (!teamName.trim() || !selectedRink) ? 'default' : 'pointer',
            }}
          >
            {editing ? 'Update team' : 'Save team'}
          </button>

          {editing && (
            <button
              onClick={() => setEditing(false)}
              style={{
                marginTop: spacing[12], width: '100%', padding: pad(spacing[12], spacing[24]),
                fontSize: 14, fontWeight: 500, color: colors.textMuted,
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </PageShell>
    );
  }

  // ─── Dashboard Mode ───
  const homeRinkSummary = rinkSummaries.get(team.homeRinkId);

  return (
    <PageShell back="/" backLabel="← Home">
      <div style={{ maxWidth: 600, margin: '0 auto', padding: pad(spacing[24], spacing[24], spacing[80]) }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing[24] }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              {team.name}
            </h1>
            <p style={{ fontSize: 13, color: colors.textTertiary, marginTop: 4 }}>
              Home: {team.homeRinkName} · {team.homeRinkCity}, {team.homeRinkState}
            </p>
          </div>
          <button
            onClick={startEdit}
            aria-label="Edit team"
            style={{
              fontSize: 18, background: 'none', border: 'none',
              cursor: 'pointer', padding: pad(spacing[4], spacing[8]), color: colors.textMuted,
            }}
          >
            &#9998;
          </button>
        </div>

        {/* Home rink card */}
        <section style={{ marginBottom: spacing[24] }}>
          <h2 style={{
            fontSize: 12, fontWeight: 500, color: colors.stone500,
            textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing[10],
          }}>
            Home Rink
          </h2>
          <div
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/rinks/${team.homeRinkId}`)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/rinks/${team.homeRinkId}`); } }}
            style={{
              padding: pad(spacing[16], spacing[18]), background: colors.surface,
              border: `1px solid ${colors.borderDefault}`, borderRadius: 14,
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>{team.homeRinkName}</div>
            <div style={{ fontSize: 13, color: colors.textTertiary, marginTop: 2 }}>
              {team.homeRinkCity}, {team.homeRinkState}
            </div>
            {homeRinkSummary?.verdict && (
              <div style={{
                marginTop: 8, fontSize: 12, fontWeight: 600,
                padding: '4px 10px', borderRadius: 8,
                background: homeRinkSummary.verdict.includes('Good') ? colors.bgSuccess : colors.bgWarning,
                color: homeRinkSummary.verdict.includes('Good') ? colors.success : colors.warning,
                display: 'inline-block',
              }}>
                {homeRinkSummary.verdict.split(' ').slice(0, 4).join(' ')}
              </div>
            )}
          </div>
        </section>

        {/* Upcoming trips */}
        <section style={{ marginBottom: spacing[24] }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[10] }}>
            <h2 style={{
              fontSize: 12, fontWeight: 500, color: colors.stone500,
              textTransform: 'uppercase', letterSpacing: 1.5, margin: 0,
            }}>
              Trips ({trips.length})
            </h2>
            <button
              onClick={() => router.push('/trip/new')}
              style={{
                fontSize: 12, fontWeight: 600, color: colors.textInverse,
                background: colors.brand, border: 'none', borderRadius: 8,
                padding: pad(spacing[6], spacing[14]), cursor: 'pointer',
              }}
            >
              + Plan trip
            </button>
          </div>

          {trips.length === 0 ? (
            <div style={{
              padding: spacing[24], textAlign: 'center', background: colors.surface,
              border: `1px solid ${colors.borderDefault}`, borderRadius: 14,
            }}>
              <p style={{ fontSize: 14, color: colors.textTertiary, margin: 0 }}>
                No trips yet for {team.name}. Plan your first away game!
              </p>
              <button
                onClick={() => router.push('/trip/new')}
                style={{
                  marginTop: spacing[12], fontSize: 13, fontWeight: 600,
                  color: colors.brand, background: colors.bgInfo,
                  border: `1px solid ${colors.brandLight}`, borderRadius: 10,
                  padding: pad(spacing[10], spacing[20]), cursor: 'pointer',
                }}
              >
                Create a trip page &#8594;
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[10] }}>
              {trips.map(trip => {
                const gameCount = trip.games?.length || 0;
                const summary = rinkSummaries.get(trip.rink.id);
                const parking = summary?.signals?.find(s => s.signal === 'parking');
                const cold = summary?.signals?.find(s => s.signal === 'cold');
                return (
                  <div
                    key={trip.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/trip/${trip.id}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/trip/${trip.id}`); } }}
                    style={{
                      padding: pad(spacing[14], spacing[18]), background: colors.surface,
                      border: `1px solid ${colors.borderDefault}`, borderRadius: 14,
                      cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
                      at {trip.rink.name}
                    </div>
                    <div style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>
                      {trip.rink.city}, {trip.rink.state}
                    </div>
                    <div style={{ display: 'flex', gap: spacing[6], marginTop: spacing[8], flexWrap: 'wrap' }}>
                      {trip.dates && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: colors.bgInfo, color: colors.brandDark }}>
                          {trip.dates}
                        </span>
                      )}
                      {gameCount > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: colors.purpleBg, color: colors.purple }}>
                          {gameCount} game{gameCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {parking && parking.count > 0 && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                          background: getBarBg(parking.value, parking.count),
                          color: getBarColor(parking.value, parking.count),
                        }}>
                          &#127359;&#65039; {parking.value.toFixed(1)}
                        </span>
                      )}
                      {cold && cold.count > 0 && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                          background: getBarBg(cold.value, cold.count),
                          color: getBarColor(cold.value, cold.count),
                        }}>
                          &#127777;&#65039; {cold.value.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Explore rinks */}
        <div style={{ textAlign: 'center', marginTop: spacing[16] }}>
          <button
            onClick={() => router.push('/')}
            style={{
              fontSize: 13, fontWeight: 500, color: colors.brand,
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            Explore rinks &#8594;
          </button>
        </div>
      </div>
    </PageShell>
  );
}
