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
  const logCtx = { requestId, method: 'POST', path: '/api/v1/rinks/[id]/claim' };

  const limited = rateLimit(request, 5, 60_000);
  if (limited) return limited;

  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, email, role } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'name and email are required' }, { status: 400 });
    }
    if (name.trim().length > 200 || email.trim().length > 254 || (role && role.length > 200)) {
      return NextResponse.json({ error: 'Field too long' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Verify rink exists
    const rinkCheck = await pool.query('SELECT id FROM rinks WHERE id = $1', [id]);
    if (rinkCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 });
    }

    // Check for existing claim
    const existingClaim = await pool.query(
      'SELECT id FROM rink_claims WHERE rink_id = $1 AND email = $2',
      [id, email.trim().toLowerCase()]
    );
    if (existingClaim.rows.length > 0) {
      return NextResponse.json({ error: 'A claim for this rink with this email already exists' }, { status: 409 });
    }

    const result = await pool.query(
      `INSERT INTO rink_claims (rink_id, name, email, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, status, created_at`,
      [id, name.trim(), email.trim().toLowerCase(), role?.trim() || null]
    );

    logger.info('Rink claimed', { ...logCtx, rinkId: id });
    return NextResponse.json({ claim: result.rows[0] });
  } catch (err) {
    logger.error('Claim failed', { ...logCtx, error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
