import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/apiAuth';
import { rateLimit } from '../../../../../lib/rateLimit';

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 10, 60_000);
  if (limited) return limited;

  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
    }

    const userId = session!.user!.id;

    await pool.query(
      'DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2',
      [endpoint, userId],
    );

    return NextResponse.json({ data: { unsubscribed: true } });
  } catch (err) {
    console.error('Push unsubscribe failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
