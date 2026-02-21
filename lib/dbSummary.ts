import { pool } from './db';
import type { RinkSummary, Signal, Tip } from './rinkTypes';
import { VENUE_CONFIG } from './venueConfig';

export async function buildSummary(rinkId: string): Promise<RinkSummary> {
  const [signalResult, tipResult] = await Promise.all([
    pool.query(
      `SELECT signal, AVG(value) AS value, COUNT(*)::int AS count
       FROM signal_ratings WHERE rink_id = $1 GROUP BY signal`,
      [rinkId]
    ),
    pool.query(
      `SELECT id, text, contributor_type, context, created_at
       FROM tips WHERE rink_id = $1 AND hidden = FALSE ORDER BY created_at DESC LIMIT 20`,
      [rinkId]
    ),
  ]);

  const signals: Signal[] = VENUE_CONFIG.signals.map((key) => {
    const row = signalResult.rows.find((r: { signal: string }) => r.signal === key);
    if (row) {
      const avg = parseFloat(row.value);
      const count = row.count;
      return {
        signal: key,
        value: Math.round(avg * 10) / 10,
        count,
        confidence: Math.min(1, 0.2 + count * 0.1),
      };
    }
    return { signal: key, value: 0, count: 0, confidence: 0 };
  });

  const tips: Tip[] = tipResult.rows.map((r: { id: number; text: string; contributor_type: string; context: string | null; created_at: Date }) => ({
    id: r.id,
    text: r.text,
    contributor_type: r.contributor_type,
    context: r.context ?? undefined,
    created_at: r.created_at.toISOString(),
  }));

  const ratedSignals = signals.filter((s) => s.count > 0);
  const totalCount = ratedSignals.reduce((sum, s) => sum + s.count, 0);
  const overallAvg = ratedSignals.length > 0
    ? ratedSignals.reduce((sum, s) => sum + s.value, 0) / ratedSignals.length
    : 0;

  const evidenceCounts: Record<string, number> = {};
  for (const s of signals) {
    evidenceCounts[s.signal] = s.count;
  }

  const lastSignal = await pool.query(
    `SELECT created_at FROM signal_ratings WHERE rink_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [rinkId]
  );
  const lastTip = await pool.query(
    `SELECT created_at FROM tips WHERE rink_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [rinkId]
  );
  const dates = [
    lastSignal.rows[0]?.created_at,
    lastTip.rows[0]?.created_at,
  ].filter(Boolean).map((d: Date) => d.getTime());
  const lastUpdatedAt = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;

  let verdict = '';
  if (totalCount === 0) {
    verdict = VENUE_CONFIG.verdicts.none;
  } else if (overallAvg >= 3.8) {
    verdict = VENUE_CONFIG.verdicts.good;
  } else if (overallAvg >= 3.0) {
    verdict = VENUE_CONFIG.verdicts.mixed;
  } else {
    verdict = VENUE_CONFIG.verdicts.bad;
  }

  // Consider "confirmed this season" if any data in last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const confirmedThisSeason = lastUpdatedAt ? new Date(lastUpdatedAt) > sixMonthsAgo : false;

  return {
    rink_id: rinkId,
    verdict,
    signals,
    tips,
    evidence_counts: evidenceCounts,
    contribution_count: totalCount + tips.length,
    last_updated_at: lastUpdatedAt,
    confirmed_this_season: confirmedThisSeason,
  };
}
