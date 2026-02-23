import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';
import { enrichWithSummaries } from '../../../../lib/enrichSummaries';
import { logger, generateRequestId } from '../../../../lib/logger';
import { rateLimit } from '../../../../lib/rateLimit';

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 60, 60_000);
  if (limited) return limited;

  const requestId = generateRequestId();
  const logCtx = { requestId, method: 'GET', path: '/api/v1/rinks' };

  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query')?.trim() || '';
  const idsParam = searchParams.get('ids')?.trim() || '';
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

  if (query.length > 200) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 });
  }

  try {
    // Batch fetch by IDs
    if (idsParam) {
      const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean).slice(0, 50);
      if (ids.length === 0) {
        return NextResponse.json({ data: [] });
      }
      const { rows } = await pool.query(
        `SELECT id, name, city, state, address, latitude, longitude, created_at
         FROM rinks WHERE id = ANY($1) AND venue_type != 'non_ice'`,
        [ids]
      );
      const enriched = await enrichWithSummaries(rows);
      return NextResponse.json({ data: enriched });
    }

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
