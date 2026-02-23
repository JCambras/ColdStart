import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';
import { computeVerdict, computeConfidence } from '../../../../lib/verdict';
import { logger, generateRequestId } from '../../../../lib/logger';
import { rateLimit } from '../../../../lib/rateLimit';

const TOP_SIGNALS = ['parking', 'cold', 'food_nearby'];

async function enrichWithSummaries(rinks: Record<string, unknown>[]) {
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

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 60, 60_000);
  if (limited) return limited;

  const requestId = generateRequestId();
  const logCtx = { requestId, method: 'GET', path: '/api/v1/rinks' };

  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query')?.trim() || '';
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

  if (query.length > 200) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 });
  }

  try {
    if (!query) {
      const [{ rows }, countResult] = await Promise.all([
        pool.query(
          `SELECT id, name, city, state, address, latitude, longitude, created_at FROM rinks WHERE venue_type != 'non_ice' ORDER BY name LIMIT $1`,
          [limit]
        ),
        pool.query(`SELECT COUNT(*)::int AS total, COUNT(DISTINCT state)::int AS states FROM rinks WHERE venue_type != 'non_ice'`),
      ]);
      const enriched = await enrichWithSummaries(rows);
      return NextResponse.json({
        data: enriched,
        total: countResult.rows[0].total,
        states: countResult.rows[0].states,
      });
    }

    // ILIKE search on name/city/state, prefix matches first
    const escaped = query.replace(/[%_]/g, '\\$&');
    const pattern = `%${escaped}%`;
    const prefixPattern = `${escaped}%`;
    const compactPattern = `%${escaped.replace(/\s+/g, '')}%`;
    const { rows } = await pool.query(
      `SELECT id, name, city, state, address, latitude, longitude, created_at,
        CASE
          WHEN lower(name) LIKE lower($2) THEN 0
          WHEN lower(city) LIKE lower($2) THEN 1
          WHEN upper(state) = upper($3) THEN 2
          ELSE 3
        END AS rank
       FROM rinks
       WHERE venue_type != 'non_ice'
         AND (name ILIKE $1 OR city ILIKE $1 OR state ILIKE $1
          OR REPLACE(lower(name), ' ', '') LIKE lower($5))
       ORDER BY rank, name
       LIMIT $4`,
      [pattern, prefixPattern, query, limit, compactPattern]
    );

    const rinks = rows.map(({ rank: _rank, ...rest }) => rest);
    const enriched = await enrichWithSummaries(rinks);
    return NextResponse.json(enriched);
  } catch (err) {
    logger.error('Rinks search failed', { ...logCtx, error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
