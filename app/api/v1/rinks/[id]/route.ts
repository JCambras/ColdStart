import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../lib/db';
import { buildSummary } from '../../../../../lib/dbSummary';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { rows } = await pool.query(
      'SELECT id, name, city, state, address, latitude, longitude, created_at FROM rinks WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 });
    }

    const rink = rows[0];

    // Infer sport from existing signal data
    const sportCheck = await pool.query(
      `SELECT signal FROM signal_ratings WHERE rink_id = $1 AND signal IN ('heat', 'dugouts', 'batting_cages') LIMIT 1`,
      [id]
    );
    const sport = sportCheck.rows.length > 0 ? 'baseball' : 'hockey';

    const summary = await buildSummary(id, sport);

    const [teamResult, photoResult] = await Promise.all([
      pool.query('SELECT team_name FROM home_teams WHERE rink_id = $1 ORDER BY id', [id]),
      pool.query(
        `SELECT rp.id, rp.url, rp.caption, rp.created_at, u.name AS contributor_name
         FROM rink_photos rp LEFT JOIN users u ON rp.user_id = u.id
         WHERE rp.rink_id = $1 ORDER BY rp.created_at DESC LIMIT 10`,
        [id]
      ),
    ]);
    const home_teams = teamResult.rows.map((r: { team_name: string }) => r.team_name);
    const photos = photoResult.rows;

    return NextResponse.json({ rink, summary, home_teams, photos });
  } catch (err) {
    console.error('GET /api/v1/rinks/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
