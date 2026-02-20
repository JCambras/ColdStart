// Pure helper functions for rink pages

import { Signal, Rink, RinkDetail } from './rinkTypes';
import { SEEDED_SIGNALS, SEEDED_NEARBY, NearbyPlace } from './seedData';
import { colors } from './theme';

export function getVerdictColor(verdict: string) {
  if (verdict.includes('Good')) return colors.success;
  if (verdict.includes('Heads up')) return colors.warning;
  if (verdict.includes('Mixed')) return colors.orangeDeep;
  return colors.textTertiary;
}

export function getVerdictBg(verdict: string) {
  if (verdict.includes('Good')) return colors.bgSuccess;
  if (verdict.includes('Heads up')) return colors.bgWarning;
  if (verdict.includes('Mixed')) return colors.bgOrangeLight;
  return colors.bgSubtle;
}

export function getBarColor(value: number, count?: number) {
  if (count !== undefined && count < 3) return colors.iceNodata;
  if (value >= 4.5) return colors.iceExcellent;
  if (value >= 3.5) return colors.iceGood;
  if (value >= 2.5) return colors.iceFair;
  return colors.icePoor;
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ensureAllSignals(signals: Signal[], rinkSlug: string, loadedSignals?: Record<string, { value: number; count: number; confidence: number }> | null): Signal[] {
  const allKeys = ['parking', 'cold', 'food_nearby', 'chaos', 'family_friendly', 'locker_rooms', 'pro_shop'];
  const existing = new Set(signals.map(s => s.signal));
  const seeded = SEEDED_SIGNALS[rinkSlug] || loadedSignals || {};
  const result = [...signals];
  for (const key of allKeys) {
    if (!existing.has(key)) {
      if (seeded[key]) {
        result.push({ signal: key, ...seeded[key] });
      } else {
        // Always show all 7 — placeholder for missing data
        result.push({ signal: key, value: 0, count: 0, confidence: 0 });
      }
    }
  }
  return result;
}

export function getRinkSlug(rink: { name: string; city?: string }): string {
  const name = (rink.name || '').toLowerCase();
  // Legacy hardcoded slugs
  if (name.includes('buffalo') || name.includes('bww')) return 'bww';
  if (name.includes('ice line')) return 'ice-line';
  if (name.includes('proskate') || name.includes('pro skate')) return 'proskate';
  // Generate slug from name + city (matches seed data format)
  const city = (rink.city || '').toLowerCase();
  return `${rink.name} ${city}`.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export function getNearbyPlaces(rink: Rink, category: string, loadedNearby?: Record<string, NearbyPlace[]> | null): NearbyPlace[] {
  const slug = getRinkSlug(rink);

  // Check loaded nearby data (from JSON files)
  if (loadedNearby && loadedNearby[category]?.length > 0) {
    return loadedNearby[category];
  }

  // Check hardcoded seed data
  const seeded = slug && SEEDED_NEARBY[slug]?.[category];
  if (seeded && seeded.length > 0) return seeded;

  // Fallback: Google Maps search
  const loc = encodeURIComponent(`${rink.address}, ${rink.city}, ${rink.state}`);
  const queries: Record<string, string> = {
    quick_bite: 'diners+bagel+shops+fast+food',
    coffee: 'coffee+shops',
    team_lunch: 'restaurants+large+groups+casual+dining',
    dinner: 'restaurants+dinner+sit+down',
    bowling: 'bowling+alley',
    arcade: 'arcade+game+center',
    movies: 'movie+theater',
    fun: 'trampoline+park+laser+tag',
    hotels: 'hotels',
  };
  const q = queries[category] || category;
  return [{
    name: `Search near ${rink.name}`,
    distance: '',
    url: `https://www.google.com/maps/search/${q}+near+${loc}`,
  }];
}

export function buildRinkDetailFromSeed(
  rinkId: string,
  rinks: unknown,
  signals?: unknown
): RinkDetail | null {
  const rinkArr = rinks as Array<Record<string, unknown>>;
  const seedRink = rinkArr.find((r) => r.id === rinkId);
  if (!seedRink) return null;

  const sigMap = (signals as Record<string, Record<string, { value: number; count: number; confidence: number }>> | undefined) ?? {};
  const seedSignals = sigMap[rinkId] || {};
  const signalArray: Signal[] = Object.entries(seedSignals).map(([key, val]) => ({
    signal: key,
    value: val.value,
    confidence: val.confidence,
    count: val.count,
  }));

  return {
    rink: {
      id: seedRink.id as string,
      name: seedRink.name as string,
      address: (seedRink.address as string) || '',
      city: (seedRink.city as string) || '',
      state: (seedRink.state as string) || '',
      latitude: (seedRink.latitude as number) || null,
      longitude: (seedRink.longitude as number) || null,
      created_at: new Date().toISOString(),
    },
    summary: {
      rink_id: seedRink.id as string,
      verdict: '',
      signals: signalArray,
      tips: [],
      evidence_counts: {},
      contribution_count: signalArray.reduce((sum, s) => sum + s.count, 0),
      last_updated_at: null,
      confirmed_this_season: false,
    },
  };
}
