import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../../lib/db';
import { requireAuth } from '../../../../../../lib/apiAuth';
import { rateLimit } from '../../../../../../lib/rateLimit';
import { logger, generateRequestId } from '../../../../../../lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const logCtx = { requestId, method: 'POST', path: '/api/v1/tips/[id]/respond' };

  const limited = rateLimit(request, 10, 60_000);
  if (limited) return limited;

  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

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
    if (text.trim().length > 1000 || responder_name.trim().length > 200 || (responder_role && responder_role.length > 200)) {
      return NextResponse.json({ error: 'Field too long' }, { status: 400 });
    }

    // Verify tip exists and get its rink_id
    const tipCheck = await pool.query('SELECT id, rink_id FROM tips WHERE id = $1', [tipId]);
    if (tipCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Tip not found' }, { status: 404 });
    }

    // Verify caller has an approved claim for the rink this tip belongs to
    const tipRinkId = rink_id || tipCheck.rows[0].rink_id;
    const userEmail = session!.user!.email;
    if (!userEmail || !tipRinkId) {
      return NextResponse.json({ error: 'Cannot verify operator ownership' }, { status: 403 });
    }

    const claimCheck = await pool.query(
      `SELECT id FROM rink_claims WHERE rink_id = $1 AND email = $2 AND status = 'approved'`,
      [tipRinkId, userEmail.toLowerCase()]
    );
    if (claimCheck.rows.length === 0) {
      return NextResponse.json({ error: 'You must have an approved claim for this rink to respond' }, { status: 403 });
    }

    const result = await pool.query(
      `INSERT INTO operator_responses (tip_id, rink_id, responder_name, responder_role, text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, text, responder_name, responder_role, created_at`,
      [tipId, tipRinkId, responder_name.trim(), responder_role?.trim() || null, text.trim()]
    );

    logger.info('Operator response saved', { ...logCtx, tipId });
    return NextResponse.json({ response: result.rows[0] });
  } catch (err) {
    logger.error('Respond failed', { ...logCtx, error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
