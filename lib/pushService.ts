import webpush from 'web-push';
import { pool } from './db';

/** Returns true when VAPID keys are configured and push can be sent. */
export function isPushConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  );
}

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  if (!isPushConfigured()) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  vapidConfigured = true;
}

/**
 * Send push notifications to all subscribers watching a rink.
 * Deduplicates against notification_log (1-hour window per sub+rink).
 * Automatically removes stale 410/404 endpoints.
 * Fire-and-forget — never throws.
 */
export async function notifyRinkWatchers(
  rinkId: string,
  excludeUserId: string,
  payload: { title: string; body: string; url: string },
): Promise<void> {
  if (!isPushConfigured()) return;
  ensureVapid();

  try {
    // Find subscriptions watching this rink, excluding the contributor
    const { rows: subs } = await pool.query(
      `SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
       FROM push_subscriptions ps
       WHERE $1 = ANY(ps.watched_rink_ids)
         AND ps.user_id != $2
         AND NOT EXISTS (
           SELECT 1 FROM notification_log nl
           WHERE nl.subscription_id = ps.id
             AND nl.rink_id = $1
             AND nl.sent_at > NOW() - INTERVAL '1 hour'
         )`,
      [rinkId, excludeUserId],
    );

    if (subs.length === 0) return;

    const payloadStr = JSON.stringify(payload);

    await Promise.allSettled(
      subs.map(async (sub: { id: number; endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payloadStr,
          );
          // Log successful send
          await pool.query(
            `INSERT INTO notification_log (subscription_id, rink_id, event_type) VALUES ($1, $2, 'contribution')`,
            [sub.id, rinkId],
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 410 || status === 404) {
            // Endpoint no longer valid — clean up
            await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
            console.log('[push] Removed stale subscription', sub.id);
          }
        }
      }),
    );
  } catch (err) {
    console.error('[push] notifyRinkWatchers failed', rinkId, err);
  }
}
