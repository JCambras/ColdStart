import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../../lib/db';

const FLAG_THRESHOLD = 3;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tipId = parseInt(id, 10);
    if (isNaN(tipId)) {
      return NextResponse.json({ error: 'Invalid tip ID' }, { status: 400 });
    }

    // Verify tip exists
    const tipCheck = await pool.query('SELECT id, hidden FROM tips WHERE id = $1', [tipId]);
    if (tipCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Tip not found' }, { status: 404 });
    }

    // Parse optional reason
    let reason: string | null = null;
    try {
      const body = await request.json();
      reason = body.reason || null;
    } catch {
      // No body or invalid JSON is fine — reason is optional
    }

    // Insert flag
    await pool.query(
      'INSERT INTO tip_flags (tip_id, reason) VALUES ($1, $2)',
      [tipId, reason]
    );

    // Check flag count against threshold
    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS count FROM tip_flags WHERE tip_id = $1',
      [tipId]
    );
    const flagCount = countResult.rows[0].count;
    let hidden = tipCheck.rows[0].hidden;

    if (flagCount >= FLAG_THRESHOLD && !hidden) {
      await pool.query('UPDATE tips SET hidden = TRUE WHERE id = $1', [tipId]);
      hidden = true;
    }

    return NextResponse.json({ flagged: true, hidden });
  } catch (err) {
    console.error('POST /api/v1/tips/[id]/flag error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
