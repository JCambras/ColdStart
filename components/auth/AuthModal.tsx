'use client';

import { useState } from 'react';
import { Logo } from '../Logo';
import { UserProfile } from '../../lib/rinkTypes';
import { storage } from '../../lib/storage';
import { colors, text, radius } from '../../lib/theme';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  function handleSubmit() {
    if (!email.trim()) return;
    setSending(true);
    setTimeout(() => {
      const existing = storage.getProfiles();
      let profile = existing[email.toLowerCase()];
      if (!profile) {
        if (mode === 'signin') {
          setSending(false);
          setMode('signup');
          return;
        }
        profile = {
          id: 'user_' + Math.random().toString(36).slice(2, 10),
          email: email.toLowerCase(),
          name: name.trim() || email.split('@')[0],
          createdAt: new Date().toISOString(),
          rinksRated: 0,
          tipsSubmitted: 0,
        };
        existing[email.toLowerCase()] = profile;
        storage.setProfiles(existing);
      }
      storage.setCurrentUser(profile);
      setSending(false);
      setSent(true);
      setTimeout(() => onSuccess(profile), 600);
    }, 800);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, maxWidth: 400, width: '100%',
          padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: text.xl, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>You&apos;re in!</p>
            <p style={{ fontSize: text.base, color: colors.textTertiary, marginTop: 8 }}>Welcome to ColdStart Hockey.</p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Logo size={28} />
              <p style={{ fontSize: text.lg, color: colors.textTertiary, marginTop: 8, margin: '8px 0 0' }}>
                {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
              </p>
            </div>

            {mode === 'signup' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: text.sm, fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: text.lg,
                    border: `1px solid ${colors.borderMedium}`, borderRadius: radius.lg,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: text.sm, fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="your@email.com"
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px', fontSize: text.lg,
                  border: `1px solid ${colors.borderMedium}`, borderRadius: radius.lg,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={sending || !email.trim()}
              style={{
                width: '100%', padding: '12px 0', fontSize: text.lg, fontWeight: 700,
                background: sending ? '#93c5fd' : colors.brand, color: '#fff',
                border: 'none', borderRadius: radius.lg, cursor: sending ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                opacity: !email.trim() ? 0.5 : 1,
              }}
            >
              {sending ? 'Signing in...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>

            <p style={{ fontSize: text.md, color: colors.textMuted, textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
              {mode === 'signin' ? (
                <>Don&apos;t have an account?{' '}
                  <span onClick={() => setMode('signup')} style={{ color: colors.brand, cursor: 'pointer', fontWeight: 600 }}>
                    Sign up
                  </span>
                </>
              ) : (
                <>Already have an account?{' '}
                  <span onClick={() => setMode('signin')} style={{ color: colors.brand, cursor: 'pointer', fontWeight: 600 }}>
                    Sign in
                  </span>
                </>
              )}
            </p>

            <div style={{
              marginTop: 20, paddingTop: 16, borderTop: `1px solid ${colors.borderLight}`,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <p style={{ fontSize: text.xs, color: colors.textMuted, textAlign: 'center', margin: 0 }}>
                Save rinks, track your contributions, and build your reputation as a trusted reviewer.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
