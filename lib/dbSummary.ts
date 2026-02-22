import { pool } from './db';
import type { RinkSummary, Signal, Tip } from './rinkTypes';
import { VENUE_CONFIG } from './venueConfig';
import { computeVerdict, computeConfidence } from './verdict';

export async function buildSummary(rinkId: string): Promise<RinkSummary> {
  const [signalResult, tipResult, lastSignal, lastTip] = await Promise.all([
    pool.query(
      `SELECT signal,
              AVG(value) AS value, COUNT(*)::int AS count, STDDEV_POP(value) AS stddev,
              AVG(value) FILTER (WHERE created_at >= NOW() - INTERVAL '12 months') AS recent_value,
              COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '12 months')::int AS recent_count,
              STDDEV_POP(value) FILTER (WHERE created_at >= NOW() - INTERVAL '12 months') AS recent_stddev
       FROM signal_ratings WHERE rink_id = $1 GROUP BY signal`,
      [rinkId]
    ),
    pool.query(
      `SELECT t.id, t.text, t.contributor_type, t.context, t.created_at,
              t.user_id, u.name AS contributor_name, u."rinksRated" AS rinks_rated,
              or_resp.text AS resp_text, or_resp.responder_name AS resp_name, or_resp.responder_role AS resp_role
       FROM tips t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN LATERAL (
         SELECT text, responder_name, responder_role FROM operator_responses
         WHERE tip_id = t.id ORDER BY created_at DESC LIMIT 1
       ) or_resp ON TRUE
       WHERE t.rink_id = $1 AND t.hidden = FALSE ORDER BY t.created_at DESC LIMIT 20`,
      [rinkId]
    ),
    pool.query(
      `SELECT created_at FROM signal_ratings WHERE rink_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [rinkId]
    ),
    pool.query(
      `SELECT created_at FROM tips WHERE rink_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [rinkId]
    ),
  ]);

  const signals: Signal[] = VENUE_CONFIG.signals.map((key) => {
    const row = signalResult.rows.find((r: { signal: string }) => r.signal === key);
    if (row) {
      // Prefer last-12-month data when available; fall back to all-time
      const hasRecent = row.recent_count > 0;
      const avg = parseFloat(hasRecent ? row.recent_value : row.value);
      const count = hasRecent ? row.recent_count : row.count;
      const rawStddev = hasRecent && row.recent_stddev != null ? row.recent_stddev : row.stddev;
      const stddev = rawStddev ? Math.round(parseFloat(rawStddev) * 100) / 100 : 0;
      return {
        signal: key,
        value: Math.round(avg * 10) / 10,
        count,
        confidence: computeConfidence(count),
        stddev,
      };
    }
    return { signal: key, value: 0, count: 0, confidence: 0, stddev: 0 };
  });

  const tips: Tip[] = tipResult.rows.map((r: {
    id: number; text: string; contributor_type: string; context: string | null; created_at: Date;
    user_id: string | null; contributor_name: string | null; rinks_rated: number | null;
    resp_text: string | null; resp_name: string | null; resp_role: string | null;
  }) => ({
    id: r.id,
    text: r.text,
    contributor_type: r.contributor_type,
    context: r.context ?? undefined,
    created_at: r.created_at.toISOString(),
    user_id: r.user_id ?? undefined,
    contributor_name: r.contributor_name ?? undefined,
    contributor_badge: r.rinks_rated && r.rinks_rated >= 10 ? 'Trusted' : undefined,
    operator_response: r.resp_text ? { text: r.resp_text, name: r.resp_name ?? 'Staff', role: r.resp_role ?? 'Rink Staff' } : undefined,
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
  const dates = [
    lastSignal.rows[0]?.created_at,
    lastTip.rows[0]?.created_at,
  ].filter(Boolean).map((d: Date) => d.getTime());
  const lastUpdatedAt = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;

  const verdict = computeVerdict(overallAvg, totalCount);

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
