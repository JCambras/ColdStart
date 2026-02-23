import { pool } from './db';
import { computeVerdict, computeConfidence } from './verdict';

const TOP_SIGNALS = ['parking', 'cold', 'food_nearby'];

export async function enrichWithSummaries(rinks: Record<string, unknown>[]) {
  if (rinks.length === 0) return rinks;

  const ids = rinks.map((r) => r.id as string);
  const [signalResult, tipCountResult] = await Promise.all([
    pool.query(
      `SELECT rink_id, signal, AVG(value) AS value, COUNT(*)::int AS count
       FROM signal_ratings WHERE rink_id = ANY($1) GROUP BY rink_id, signal`,
      [ids]
    ),
    pool.query(
      `SELECT rink_id, COUNT(*)::int AS count FROM tips WHERE rink_id = ANY($1) GROUP BY rink_id`,
      [ids]
    ),
  ]);

  const signalsByRink: Record<string, { signal: string; value: number; count: number; confidence: number }[]> = {};
  for (const row of signalResult.rows) {
    if (!signalsByRink[row.rink_id]) signalsByRink[row.rink_id] = [];
    const avg = parseFloat(row.value);
    signalsByRink[row.rink_id].push({
      signal: row.signal,
      value: Math.round(avg * 10) / 10,
      count: row.count,
      confidence: computeConfidence(row.count),
    });
  }

  const tipCountByRink: Record<string, number> = {};
  for (const row of tipCountResult.rows) {
    tipCountByRink[row.rink_id] = row.count;
  }

  return rinks.map((r) => {
    const id = r.id as string;
    const signals = signalsByRink[id] || [];
    const topSignals = TOP_SIGNALS
      .map(key => signals.find(s => s.signal === key))
      .filter(Boolean);
    const ratingCount = signals.reduce((sum, s) => sum + s.count, 0);
    const tipCount = tipCountByRink[id] || 0;
    const totalCount = ratingCount + tipCount;

    const ratedSignals = signals.filter(s => s.count > 0);
    const overallAvg = ratedSignals.length > 0
      ? ratedSignals.reduce((sum, s) => sum + s.value, 0) / ratedSignals.length
      : 0;

    return {
      ...r,
      summary: totalCount > 0 ? {
        verdict: computeVerdict(overallAvg, ratingCount),
        signals: topSignals,
        tips: [],
        contribution_count: totalCount,
      } : undefined,
    };
  });
}
