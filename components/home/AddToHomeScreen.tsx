'use client';

import { useState, useEffect, useRef } from 'react';
import { storage } from '../../lib/storage';
import { getVibe } from '../../app/vibe';
import { colors, spacing, pad } from '../../lib/theme';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AddToHomeScreen() {
  const [visible, setVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const isIOS = useRef(false);

  useEffect(() => {
    // Don't show if already dismissed
    if (storage.getA2HSDismissed()) return;

    // Don't show on first visit
    if (getVibe().sessionCount < 2) return;

    // Don't show if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Detect iOS Safari
    const ua = navigator.userAgent;
    isIOS.current = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as Record<string, unknown>).MSStream;

    // On iOS, show right away since there's no beforeinstallprompt
    if (isIOS.current) {
      setVisible(true);
      return;
    }

    // Listen for Chrome/Edge install prompt
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  function dismiss() {
    storage.setA2HSDismissed(true);
    setVisible(false);
  }

  async function handleInstallClick() {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') {
        dismiss();
      }
      deferredPrompt.current = null;
    } else if (isIOS.current) {
      setShowIOSInstructions(true);
    }
  }

  if (!visible) return null;

  return (
    <section
      aria-label="Add to home screen"
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: pad(spacing[0], spacing[24]),
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[12],
          padding: pad(spacing[14], spacing[18]),
          background: colors.bgInfo,
          border: `1px solid ${colors.brandLight}`,
          borderRadius: 14,
        }}
      >
        <span style={{ fontSize: 22, flexShrink: 0 }}>📱</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, margin: spacing[0] }}>
            Add ColdStart to your home screen
          </p>
          <p style={{ fontSize: 12, color: colors.textMuted, margin: pad(spacing[2], spacing[0], spacing[0]) }}>
            Instant access before away games.
          </p>
          {showIOSInstructions && (
            <p style={{ fontSize: 12, color: colors.textTertiary, margin: pad(spacing[6], spacing[0], spacing[0]), lineHeight: 1.4 }}>
              Tap the share button <span style={{ fontWeight: 600 }}>↑</span> in Safari, then &ldquo;Add to Home Screen.&rdquo;
            </p>
          )}
        </div>
        <button
          onClick={handleInstallClick}
          style={{
            fontSize: 12, fontWeight: 600,
            color: colors.brand, background: colors.surface,
            border: `1px solid ${colors.brandLight}`,
            borderRadius: 10, padding: pad(spacing[8], spacing[14]),
            cursor: 'pointer', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {showIOSInstructions ? 'Got it' : 'Install'}
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss add to home screen banner"
          style={{
            fontSize: 14, color: colors.textMuted,
            background: 'none', border: 'none',
            cursor: 'pointer', padding: spacing[8],
            flexShrink: 0, lineHeight: 1,
            minWidth: 32, minHeight: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>
    </section>
  );
}
