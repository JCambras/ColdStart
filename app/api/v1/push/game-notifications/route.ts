import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { pool } from '../../../../../lib/db';
import { isPushConfigured } from '../../../../../lib/pushService';

function ensureVapid() {
  if (!isPushConfigured()) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

async function sendAndCleanup(
  sub: { id: number; endpoint: string; p256dh: string; auth: string },
  payload: string,
) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload,
    );
    return true;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 410 || status === 404) {
      await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
      console.log('[game-push] Removed stale subscription', sub.id);
    }
    return false;
  }
}

export async function GET(request: NextRequest) {
  // Optional auth via CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ data: { skipped: true, reason: 'VAPID not configured' } });
  }

  ensureVapid();

  let pregameSent = 0;
  let postgameSent = 0;

  try {
    // ── Pre-game: games starting in next 24 hours ──
    const { rows: pregameRows } = await pool.query(
      `SELECT ts.id AS schedule_id, ts.user_id, ts.rink_id, ts.rink_name,
              ts.team_name, ts.opponent, ts.game_time,
              ps.id AS sub_id, ps.endpoint, ps.p256dh, ps.auth
       FROM trip_schedules ts
       JOIN push_subscriptions ps ON ps.user_id = ts.user_id
       WHERE ts.game_time > NOW()
         AND ts.game_time <= NOW() + INTERVAL '24 hours'
         AND NOT EXISTS (
           SELECT 1 FROM notification_log nl
           WHERE nl.subscription_id = ps.id
             AND nl.rink_id = ts.rink_id
             AND nl.event_type = 'pregame'
             AND nl.sent_at > NOW() - INTERVAL '24 hours'
         )`,
    );

    for (const row of pregameRows) {
      const gameDate = new Date(row.game_time);
      const timeStr = gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const title = `Game tomorrow at ${row.rink_name}`;
      const body = row.opponent
        ? `${row.team_name} vs ${row.opponent} at ${timeStr}`
        : `${row.team_name} at ${timeStr}`;
      const payload = JSON.stringify({ title, body, url: `/rinks/${row.rink_id}` });

      const sent = await sendAndCleanup(
        { id: row.sub_id, endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth },
        payload,
      );

      if (sent) {
        await pool.query(
          `INSERT INTO notification_log (subscription_id, rink_id, event_type) VALUES ($1, $2, 'pregame')`,
          [row.sub_id, row.rink_id],
        );
        pregameSent++;
      }
    }

    // ── Post-game: games ended 2-6 hours ago ──
    const { rows: postgameRows } = await pool.query(
      `SELECT ts.id AS schedule_id, ts.user_id, ts.rink_id, ts.rink_name,
              ts.team_name, ts.opponent,
              ps.id AS sub_id, ps.endpoint, ps.p256dh, ps.auth
       FROM trip_schedules ts
       JOIN push_subscriptions ps ON ps.user_id = ts.user_id
       WHERE ts.game_time + INTERVAL '2 hours' <= NOW()
         AND ts.game_time + INTERVAL '6 hours' >= NOW()
         AND NOT EXISTS (
           SELECT 1 FROM notification_log nl
           WHERE nl.subscription_id = ps.id
             AND nl.rink_id = ts.rink_id
             AND nl.event_type = 'postgame'
             AND nl.sent_at > NOW() - INTERVAL '24 hours'
         )`,
    );

    for (const row of postgameRows) {
      const title = `How was ${row.rink_name}?`;
      const body = 'Rate your experience to help the next family.';
      const payload = JSON.stringify({ title, body, url: `/rinks/${row.rink_id}` });

      const sent = await sendAndCleanup(
        { id: row.sub_id, endpoint: row.endpoint, p256dh: row.p256dh, auth: row.auth },
        payload,
      );

      if (sent) {
        await pool.query(
          `INSERT INTO notification_log (subscription_id, rink_id, event_type) VALUES ($1, $2, 'postgame')`,
          [row.sub_id, row.rink_id],
        );
        postgameSent++;
      }
    }
  } catch (err) {
    console.error('[game-push] Cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({
    data: { pregameSent, postgameSent },
  });
}
