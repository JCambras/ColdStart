import { storage } from './storage';
import { getSwRegistration } from '../components/ServiceWorkerRegistration';
import { API_URL } from './constants';

/** Convert a VAPID public key from URL-safe base64 to a Uint8Array. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Check whether the browser supports push notifications and VAPID key is configured. */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'serviceWorker' in navigator &&
    !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  );
}

/** Check if the user has opted in to push notifications (local state). */
export function isPushSubscribed(): boolean {
  return storage.getPushSubscribed();
}

/** Subscribe the user to push notifications and register with the server. */
export async function subscribeToPush(watchedRinkIds: string[]): Promise<boolean> {
  try {
    const reg = getSwRegistration();
    if (!reg) return false;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });

    const json = subscription.toJSON();
    const res = await fetch(`${API_URL}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: {
          endpoint: json.endpoint,
          keys: json.keys,
        },
        watchedRinkIds,
      }),
    });

    if (!res.ok) return false;

    storage.setPushSubscribed(true);
    return true;
  } catch {
    return false;
  }
}

/** Unsubscribe from push notifications. */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const reg = getSwRegistration();
    if (!reg) return false;

    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      await fetch(`${API_URL}/push/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });
    }

    storage.setPushSubscribed(false);
    return true;
  } catch {
    return false;
  }
}

/** Re-POST subscription with updated watched rink IDs. Only acts if already subscribed. */
export async function syncPushWatchedRinks(rinkIds: string[]): Promise<void> {
  if (!isPushSubscribed() || !isPushSupported()) return;

  try {
    const reg = getSwRegistration();
    if (!reg) return;

    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) return;

    const json = subscription.toJSON();
    await fetch(`${API_URL}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: {
          endpoint: json.endpoint,
          keys: json.keys,
        },
        watchedRinkIds: rinkIds,
      }),
    });
  } catch {
    // Silent — syncing watched rinks is best-effort
  }
}
