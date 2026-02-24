'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../lib/storage';
import { getVibe } from '../app/vibe';
import { colors, text, spacing, pad } from '../lib/theme';

const ARCHETYPE_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  organizer: { label: 'The Organizer', icon: '📋', description: 'You plan trips and keep the team together' },
  scout: { label: 'The Scout', icon: '🔍', description: 'You research rinks before game day' },
  contributor: { label: 'The Contributor', icon: '⭐', description: 'You help other families with ratings and tips' },
  glancer: { label: 'The Quick Check', icon: '👀', description: 'You pop in for the essentials' },
  anxious: { label: 'The Planner', icon: '📝', description: 'You like to know every detail beforehand' },
};

export function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const { currentUser: user, logout } = useAuth();
  const [archetype, setArchetype] = useState<string>('unknown');

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const vibe = getVibe();
    setArchetype(vibe.archetype);
  }, []);

  if (!user) return null;

  const initials = (user.name || user.email).slice(0, 2).toUpperCase();
  const savedCount = storage.getSavedRinks().length;
  const archetypeInfo = ARCHETYPE_LABELS[archetype];

  function handleSignOut() {
    logout();
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-label="Profile menu"
      onClick={onClose}
      style={{
        position: 'fixed', top: spacing[0], left: spacing[0], right: spacing[0], bottom: spacing[0],
        zIndex: 999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: 56, right: spacing[16],
          background: colors.surface, borderRadius: 14, width: 280,
          boxShadow: `0 10px 40px ${colors.stone200}, 0 0 0 1px ${colors.borderLight}`,
          overflow: 'hidden',
        }}
      >
        {/* Profile header */}
        <div style={{ padding: pad(spacing[16], spacing[16], spacing[12]), background: colors.bgSubtle, borderBottom: `1px solid ${colors.borderLight}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[10] }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.brand}, ${colors.brandDeep})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: colors.textInverse, fontSize: text.md, fontWeight: 700,
            }}>
              {initials}
            </div>
            <div>
              <p style={{ fontSize: text.base, fontWeight: 700, color: colors.textPrimary, margin: spacing[0] }}>{user.name}</p>
              <p style={{ fontSize: text.sm, color: colors.textTertiary, margin: spacing[0] }}>{user.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: pad(spacing[12], spacing[16]), display: 'flex', gap: spacing[16], borderBottom: `1px solid ${colors.borderLight}` }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: text.xl, fontWeight: 800, color: colors.textPrimary, margin: spacing[0] }}>{user.rinksRated}</p>
            <p style={{ fontSize: text.xs, color: colors.textMuted, margin: spacing[0] }}>Rinks rated</p>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: text.xl, fontWeight: 800, color: colors.textPrimary, margin: spacing[0] }}>{user.tipsSubmitted}</p>
            <p style={{ fontSize: text.xs, color: colors.textMuted, margin: spacing[0] }}>Tips shared</p>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: text.xl, fontWeight: 800, color: colors.textPrimary, margin: spacing[0] }}>{savedCount}</p>
            <p style={{ fontSize: text.xs, color: colors.textMuted, margin: spacing[0] }}>Saved rinks</p>
          </div>
        </div>

        {/* Trusted badge progress */}
        {user.rinksRated < 10 && (
          <div style={{ padding: pad(spacing[10], spacing[16]), borderBottom: `1px solid ${colors.borderLight}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[4] }}>
              <span style={{ fontSize: text.xs, fontWeight: 600, color: colors.textTertiary }}>🏅 Trusted Reviewer</span>
              <span style={{ fontSize: text.xs, color: colors.textMuted }}>{user.rinksRated}/10 rinks</span>
            </div>
            <div style={{ height: 4, background: colors.borderLight, borderRadius: 2 }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: `linear-gradient(90deg, ${colors.brand}, ${colors.brandAccent})`,
                width: `${Math.min(100, (user.rinksRated / 10) * 100)}%`,
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}
        {user.rinksRated >= 10 && (
          <div style={{ padding: pad(spacing[10], spacing[16]), borderBottom: `1px solid ${colors.borderLight}`, display: 'flex', alignItems: 'center', gap: spacing[6] }}>
            <span style={{ fontSize: text.md }}>🏅</span>
            <span style={{ fontSize: text.sm, fontWeight: 600, color: colors.warning }}>Trusted Reviewer</span>
          </div>
        )}

        {/* ColdStart Style (Vibe archetype) */}
        {archetypeInfo && (
          <div style={{ padding: pad(spacing[10], spacing[16]), borderBottom: `1px solid ${colors.borderLight}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[6] }}>
              <span style={{ fontSize: text.md }}>{archetypeInfo.icon}</span>
              <span style={{ fontSize: text.sm, fontWeight: 600, color: colors.textPrimary }}>
                {archetypeInfo.label}
              </span>
            </div>
            <p style={{ fontSize: text.xs, color: colors.textMuted, margin: pad(spacing[3], spacing[0], spacing[0]), lineHeight: 1.4 }}>
              {archetypeInfo.description}
            </p>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: pad(spacing[12], spacing[16]), fontSize: text.md, fontWeight: 500,
            color: colors.error, background: 'none', border: 'none',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
