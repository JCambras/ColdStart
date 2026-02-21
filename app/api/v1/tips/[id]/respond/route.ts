import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../../lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tipId = parseInt(id, 10);

  if (isNaN(tipId)) {
    return NextResponse.json({ error: 'Invalid tip ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { text, responder_name, responder_role, rink_id } = body;

    if (!text?.trim() || !responder_name?.trim()) {
      return NextResponse.json({ error: 'text and responder_name are required' }, { status: 400 });
    }

    // Verify tip exists
    const tipCheck = await pool.query('SELECT id FROM tips WHERE id = $1', [tipId]);
    if (tipCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Tip not found' }, { status: 404 });
    }

    const result = await pool.query(
      `INSERT INTO operator_responses (tip_id, rink_id, responder_name, responder_role, text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, text, responder_name, responder_role, created_at`,
      [tipId, rink_id || null, responder_name.trim(), responder_role?.trim() || null, text.trim()]
    );

    return NextResponse.json({ response: result.rows[0] });
  } catch (err) {
    console.error('POST /api/v1/tips/[id]/respond error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
