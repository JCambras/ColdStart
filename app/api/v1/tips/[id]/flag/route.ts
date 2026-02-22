import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../../lib/db';
import { requireAuth } from '../../../../../../lib/apiAuth';
import { rateLimit } from '../../../../../../lib/rateLimit';
import { logger, generateRequestId } from '../../../../../../lib/logger';

const FLAG_THRESHOLD = 3;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const logCtx = { requestId, method: 'POST', path: '/api/v1/tips/[id]/flag' };

  const limited = rateLimit(request, 10, 60_000);
  if (limited) return limited;

  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const tipId = parseInt(id, 10);
    if (isNaN(tipId)) {
      return NextResponse.json({ error: 'Invalid tip ID' }, { status: 400 });
    }

    // Parse optional reason
    let reason: string | null = null;
    try {
      const body = await request.json();
      reason = body.reason || null;
    } catch {
      // No body or invalid JSON is fine — reason is optional
    }

    // Transaction: verify tip, insert flag, check threshold, conditionally hide
    const client = await pool.connect();
    let hidden = false;
    try {
      await client.query('BEGIN');

      const tipCheck = await client.query('SELECT id, hidden FROM tips WHERE id = $1 FOR UPDATE', [tipId]);
      if (tipCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Tip not found' }, { status: 404 });
      }
      hidden = tipCheck.rows[0].hidden;

      await client.query(
        'INSERT INTO tip_flags (tip_id, reason) VALUES ($1, $2)',
        [tipId, reason]
      );

      const countResult = await client.query(
        'SELECT COUNT(*)::int AS count FROM tip_flags WHERE tip_id = $1',
        [tipId]
      );
      const flagCount = countResult.rows[0].count;

      if (flagCount >= FLAG_THRESHOLD && !hidden) {
        await client.query('UPDATE tips SET hidden = TRUE WHERE id = $1', [tipId]);
        hidden = true;
      }

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    logger.info('Tip flagged', { ...logCtx, tipId, hidden });
    return NextResponse.json({ flagged: true, hidden });
  } catch (err) {
    logger.error('Flag failed', { ...logCtx, error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
