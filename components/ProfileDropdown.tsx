'use client';

import { useAuth } from '../contexts/AuthContext';
import { storage } from '../lib/storage';
import { colors, text } from '../lib/theme';

export function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const { currentUser: user, logout } = useAuth();
  if (!user) return null;

  const initials = (user.name || user.email).slice(0, 2).toUpperCase();
  const savedCount = storage.getSavedRinks().length;

  function handleSignOut() {
    logout();
    onClose();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: 56, right: 16,
          background: colors.surface, borderRadius: 14, width: 280,
          boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Profile header */}
        <div style={{ padding: '16px 16px 12px', background: colors.bgSubtle, borderBottom: `1px solid ${colors.borderLight}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: text.md, fontWeight: 700,
            }}>
              {initials}
            </div>
            <div>
              <p style={{ fontSize: text.base, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>{user.name}</p>
              <p style={{ fontSize: text.sm, color: colors.textTertiary, margin: 0 }}>{user.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '12px 16px', display: 'flex', gap: 16, borderBottom: `1px solid ${colors.borderLight}` }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: text.xl, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>{user.rinksRated}</p>
            <p style={{ fontSize: text.xs, color: colors.textMuted, margin: 0 }}>Rinks rated</p>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: text.xl, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>{user.tipsSubmitted}</p>
            <p style={{ fontSize: text.xs, color: colors.textMuted, margin: 0 }}>Tips shared</p>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: text.xl, fontWeight: 800, color: colors.textPrimary, margin: 0 }}>{savedCount}</p>
            <p style={{ fontSize: text.xs, color: colors.textMuted, margin: 0 }}>Saved rinks</p>
          </div>
        </div>

        {/* Trusted badge progress */}
        {user.rinksRated < 10 && (
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${colors.borderLight}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: text.xs, fontWeight: 600, color: colors.textTertiary }}>🏅 Trusted Reviewer</span>
              <span style={{ fontSize: text.xs, color: colors.textMuted }}>{user.rinksRated}/10 rinks</span>
            </div>
            <div style={{ height: 4, background: colors.borderLight, borderRadius: 2 }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, #0ea5e9, #3b82f6)',
                width: `${Math.min(100, (user.rinksRated / 10) * 100)}%`,
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}
        {user.rinksRated >= 10 && (
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${colors.borderLight}`, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: text.md }}>🏅</span>
            <span style={{ fontSize: text.sm, fontWeight: 600, color: colors.warning }}>Trusted Reviewer</span>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '12px 16px', fontSize: text.md, fontWeight: 500,
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
