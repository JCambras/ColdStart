'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '../../lib/storage';
import { colors, text, layout } from '../../lib/theme';
import { RinkData } from '../RinkCard';

interface Change {
  rinkId: string;
  rinkName: string;
  delta: number;
}

export function WhatsNew({ savedRinks }: { savedRinks: RinkData[] }) {
  const router = useRouter();
  const [changes, setChanges] = useState<Change[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const snapshot = storage.getRinkSnapshot();

    // First visit — silently populate snapshot
    if (Object.keys(snapshot).length === 0) {
      const newSnapshot: Record<string, { count: number; updated: string | null }> = {};
      for (const rink of savedRinks) {
        if (rink.summary) {
          newSnapshot[rink.id] = {
            count: rink.summary.contribution_count,
            updated: rink.summary.last_updated_at || null,
          };
        }
      }
      storage.setRinkSnapshot(newSnapshot);
      return;
    }

    // Compare current data against snapshot
    const detected: Change[] = [];
    const newSnapshot: Record<string, { count: number; updated: string | null }> = { ...snapshot };

    for (const rink of savedRinks) {
      if (!rink.summary) continue;
      const prev = snapshot[rink.id];
      if (!prev) {
        // New saved rink — record but don't show as change
        newSnapshot[rink.id] = {
          count: rink.summary.contribution_count,
          updated: rink.summary.last_updated_at || null,
        };
        continue;
      }

      const delta = rink.summary.contribution_count - prev.count;
      if (delta > 0) {
        detected.push({ rinkId: rink.id, rinkName: rink.name, delta });
      }

      // Update snapshot
      newSnapshot[rink.id] = {
        count: rink.summary.contribution_count,
        updated: rink.summary.last_updated_at || null,
      };
    }

    if (detected.length > 0) {
      setChanges(detected.slice(0, 3));
    }

    storage.setRinkSnapshot(newSnapshot);
  }, [savedRinks]);

  if (changes.length === 0 || dismissed) return null;

  return (
    <section aria-label="What's new at your rinks" style={{
      maxWidth: layout.maxWidth5xl, margin: '0 auto', padding: '32px 24px 0',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12,
      }}>
        <h3 style={{
          fontSize: 12, fontWeight: 500, color: colors.stone500,
          textTransform: 'uppercase', letterSpacing: 1.5, margin: 0,
        }}>
          What&apos;s New
        </h3>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss what's new"
          style={{
            fontSize: 12, color: colors.textMuted,
            background: 'none', border: 'none',
            cursor: 'pointer', padding: '4px 8px',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {changes.map((change) => (
          <div
            key={change.rinkId}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/rinks/${change.rinkId}`)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/rinks/${change.rinkId}`); } }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px', background: colors.surface,
              border: `1px solid ${colors.brandLight}`,
              borderRadius: 10, cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.brandLight; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>🆕</span>
              <div>
                <div style={{ fontSize: text.base, fontWeight: 600, color: colors.stone800 }}>
                  {change.rinkName}
                </div>
                <div style={{ fontSize: text.xs, color: colors.textMuted, marginTop: 1 }}>
                  {change.delta} new contribution{change.delta !== 1 ? 's' : ''} since your last visit
                </div>
              </div>
            </div>
            <span style={{ fontSize: text.sm, color: colors.brand, fontWeight: 500 }}>→</span>
          </div>
        ))}
      </div>
    </section>
  );
}
