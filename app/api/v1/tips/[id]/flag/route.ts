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

  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const userId = session!.user!.id;

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
      reason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : null;
    } catch {
      // No body or invalid JSON is fine — reason is optional
    }

    // Transaction: verify tip, check for duplicate flag, insert flag, check threshold, conditionally hide
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

      // Per-user dedup: one flag per user per tip
      const existingFlag = await client.query(
        'SELECT id FROM tip_flags WHERE tip_id = $1 AND reporter_id = $2',
        [tipId, userId]
      );
      if (existingFlag.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'You have already flagged this tip', alreadyFlagged: true }, { status: 409 });
      }

      await client.query(
        'INSERT INTO tip_flags (tip_id, reason, reporter_id) VALUES ($1, $2, $3)',
        [tipId, reason, userId]
      );

      const countResult = await client.query(
        'SELECT COUNT(DISTINCT reporter_id)::int AS count FROM tip_flags WHERE tip_id = $1',
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
