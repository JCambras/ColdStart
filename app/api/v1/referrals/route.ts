import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';
import { rateLimit } from '../../../../lib/rateLimit';
import { logger, generateRequestId } from '../../../../lib/logger';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const logCtx = { requestId, method: 'POST', path: '/api/v1/referrals' };

  const limited = rateLimit(request, 30, 60_000);
  if (limited) return limited;

  // Referrals can be logged without auth (shared links from non-users)

  try {
    const body = await request.json();
    const { rink_id, source } = body;

    if (!source || typeof source !== 'string' || source.length > 100) {
      return NextResponse.json({ error: 'source is required (max 100 chars)' }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO referral_visits (rink_id, source) VALUES ($1, $2)`,
      [rink_id || null, source.slice(0, 100)]
    );

    logger.info('Referral logged', { ...logCtx, rink_id, source });
    return NextResponse.json({ logged: true });
  } catch (err) {
    logger.error('Referral logging failed', { ...logCtx, error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
