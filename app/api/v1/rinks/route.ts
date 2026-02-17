import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('query')?.trim() || '';
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

  try {
    if (!query) {
      // No search — return first N rinks ordered by name
      const { rows } = await pool.query(
        'SELECT id, name, city, state, address, latitude, longitude, created_at FROM rinks ORDER BY name LIMIT $1',
        [limit]
      );
      return NextResponse.json(rows);
    }

    // ILIKE search on name/city/state, prefix matches first
    const pattern = `%${query}%`;
    const prefixPattern = `${query}%`;
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
       ORDER BY rank, name
       LIMIT $4`,
      [pattern, prefixPattern, query, limit]
    );

    // Strip the rank column before returning
    const results = rows.map(({ rank: _rank, ...rest }) => rest);
    return NextResponse.json(results);
  } catch (err) {
    console.error('GET /api/v1/rinks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
