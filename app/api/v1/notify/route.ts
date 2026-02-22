import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';
import { rateLimit } from '../../../../lib/rateLimit';
import { logger, generateRequestId } from '../../../../lib/logger';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const logCtx = { requestId, method: 'POST', path: '/api/v1/notify' };

  const limited = rateLimit(request, 5, 60_000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const { email, feature } = body;

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (email.trim().length > 254) {
      return NextResponse.json({ error: 'Email too long' }, { status: 400 });
    }

    const featureValue = typeof feature === 'string' ? feature.slice(0, 100) : 'general';

    await pool.query(
      `INSERT INTO notify_signups (email, feature)
       VALUES ($1, $2)
       ON CONFLICT (email, feature) DO NOTHING`,
      [email.trim().toLowerCase(), featureValue]
    );

    logger.info('Notify signup', { ...logCtx, feature: featureValue });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Notify signup failed', { ...logCtx, error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
