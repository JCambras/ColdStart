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
    const summary = await buildSummary(id);

    return NextResponse.json({ rink, summary });
  } catch (err) {
    console.error('GET /api/v1/rinks/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
