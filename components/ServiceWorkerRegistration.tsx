'use client';

import { useEffect } from 'react';

let swReg: ServiceWorkerRegistration | null = null;

/** Get the current service worker registration (available after mount in production). */
export function getSwRegistration() { return swReg; }

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').then(reg => { swReg = reg; }).catch(() => {});
    }
  }, []);
  return null;
}
