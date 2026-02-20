import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';

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
      confidence: Math.min(1, 0.2 + row.count * 0.1),
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
    let verdict = 'No ratings yet';
    if (ratingCount > 0) {
      if (overallAvg >= 3.8) verdict = 'Good rink overall';
      else if (overallAvg >= 3.0) verdict = 'Mixed reviews';
      else verdict = 'Heads up — some issues reported';
    }

    return {
      ...r,
      summary: totalCount > 0 ? {
        verdict,
        signals: topSignals,
        tips: [],
        contribution_count: totalCount,
        confirmed_this_season: true,
      } : undefined,
    };
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query')?.trim() || '';
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

  try {
    if (!query) {
      const [{ rows }, countResult] = await Promise.all([
        pool.query(
          'SELECT id, name, city, state, address, latitude, longitude, created_at FROM rinks ORDER BY name LIMIT $1',
          [limit]
        ),
        pool.query('SELECT COUNT(*)::int AS total, COUNT(DISTINCT state)::int AS states FROM rinks'),
      ]);
      const enriched = await enrichWithSummaries(rows);
      return NextResponse.json({
        data: enriched,
        total: countResult.rows[0].total,
        states: countResult.rows[0].states,
      });
    }

    // ILIKE search on name/city/state, prefix matches first
    // Also match with spaces removed (e.g. "Ice Works" matches "IceWorks")
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
       WHERE name ILIKE $1 OR city ILIKE $1 OR state ILIKE $1
          OR REPLACE(lower(name), ' ', '') LIKE lower($5)
       ORDER BY rank, name
       LIMIT $4`,
      [pattern, prefixPattern, query, limit, compactPattern]
    );

    const rinks = rows.map(({ rank: _rank, ...rest }) => rest);
    const enriched = await enrichWithSummaries(rinks);
    return NextResponse.json(enriched);
  } catch (err) {
    console.error('GET /api/v1/rinks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
