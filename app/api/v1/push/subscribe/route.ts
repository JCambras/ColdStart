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
    const { subscription, watchedRinkIds } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    const userId = session!.user!.id;
    const rinkIds = Array.isArray(watchedRinkIds) ? watchedRinkIds.filter((id: unknown) => typeof id === 'string') : [];

    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, watched_rink_ids, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (endpoint) DO UPDATE
       SET user_id = EXCLUDED.user_id,
           p256dh = EXCLUDED.p256dh,
           auth = EXCLUDED.auth,
           watched_rink_ids = EXCLUDED.watched_rink_ids,
           updated_at = NOW()`,
      [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, rinkIds],
    );

    return NextResponse.json({ data: { subscribed: true } });
  } catch (err) {
    console.error('Push subscribe failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
