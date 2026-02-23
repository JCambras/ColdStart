import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../../lib/db';
import { requireAuth } from '../../../../../../lib/apiAuth';
import { rateLimit } from '../../../../../../lib/rateLimit';
import { logger, generateRequestId } from '../../../../../../lib/logger';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

async function requireAdmin() {
  const { session, error } = await requireAuth();
  if (error) return { error };
  const email = session!.user!.email?.toLowerCase();
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }
  return { session, error: null };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const logCtx = { requestId, method: 'PATCH', path: '/api/v1/admin/claims/[id]' };

  const limited = rateLimit(request, 20, 60_000);
  if (limited) return limited;

  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const { action } = body;

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const result = await pool.query(
      `UPDATE rink_claims SET status = $1, updated_at = NOW()
       WHERE id = $2 AND status = 'pending'
       RETURNING id, rink_id, name, email, status`,
      [newStatus, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Claim not found or already processed' }, { status: 404 });
    }

    logger.info(`Claim ${action}d`, { ...logCtx, claimId: id, newStatus });
    return NextResponse.json({ claim: result.rows[0] });
  } catch (err) {
    logger.error('Claim update failed', { ...logCtx, error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
