import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../../lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, email, role } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
    }

    // Verify rink exists
    const rinkCheck = await pool.query('SELECT id FROM rinks WHERE id = $1', [id]);
    if (rinkCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 });
    }

    const result = await pool.query(
      `INSERT INTO rink_claims (rink_id, name, email, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, status, created_at`,
      [id, name.trim(), email.trim(), role?.trim() || null]
    );

    return NextResponse.json({ claim: result.rows[0] });
  } catch (err) {
    console.error('POST /api/v1/rinks/[id]/claim error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
