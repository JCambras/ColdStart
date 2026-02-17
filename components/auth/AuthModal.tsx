'use client';

import { useState, useEffect } from 'react';
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
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setName('');
      setError('');
      setSent(false);
      setMode('signin');
    }
  }, [isOpen]);

  // Focus trap and auto-focus
  useEffect(() => {
    if (!isOpen) return;
    const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>('input, button, [tabindex]:not([tabindex="-1"])');
    if (focusable.length > 0) focusable[0].focus();

    function trapFocus(e: KeyboardEvent) {
      if (e.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', trapFocus);
    return () => document.removeEventListener('keydown', trapFocus);
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    setError('');
    setSending(true);
    setTimeout(() => {
      const existing = storage.getProfiles();
      let profile = existing[email.toLowerCase()];

      if (mode === 'signin') {
        if (!profile) {
          setSending(false);
          setError('No account found. Sign up below.');
          setMode('signup');
          return;
        }
        // For demo: accept any password for existing accounts
        storage.setCurrentUser(profile);
        setSending(false);
        setSent(true);
        setTimeout(() => onSuccess(profile), 600);
      } else {
        if (profile) {
          setSending(false);
          setError('Account already exists. Sign in instead.');
          setMode('signin');
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
        storage.setCurrentUser(profile);
        setSending(false);
        setSent(true);
        setTimeout(() => onSuccess(profile), 600);
      }
    }, 800);
  }

  const canSubmit = email.trim() && password.trim() && (mode === 'signin' || name.trim());

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
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
            {/* Apple logo + branding */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}></div>
              <p id="auth-modal-title" style={{
                fontSize: 20, fontWeight: 600, color: colors.textPrimary, margin: 0,
              }}>
                {mode === 'signin' ? 'Log in with your Apple Account' : 'Create your Apple Account'}
              </p>
              <p style={{ fontSize: text.sm, color: colors.textTertiary, marginTop: 6, margin: '6px 0 0' }}>
                {mode === 'signin'
                  ? 'Use your email and password to sign in.'
                  : 'Set up a new account to get started.'}
              </p>
            </div>

            {error && (
              <div style={{
                padding: '8px 12px', marginBottom: 12, borderRadius: radius.md,
                background: '#fef2f2', border: '1px solid #fecaca',
                fontSize: text.sm, color: '#991b1b',
              }}>
                {error}
              </div>
            )}

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
                    width: '100%', padding: '10px 14px', fontSize: text.base,
                    border: `1px solid ${colors.borderMedium}`, borderRadius: radius.lg,
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: text.sm, fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="your@email.com"
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px', fontSize: text.base,
                  border: `1px solid ${colors.borderMedium}`, borderRadius: radius.lg,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: text.sm, fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Enter your password"
                style={{
                  width: '100%', padding: '10px 14px', fontSize: text.base,
                  border: `1px solid ${colors.borderMedium}`, borderRadius: radius.lg,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={sending || !canSubmit}
              style={{
                width: '100%', padding: '12px 0', fontSize: text.base, fontWeight: 700,
                background: sending ? '#93c5fd' : '#000', color: '#fff',
                border: 'none', borderRadius: radius.lg, cursor: sending ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                opacity: !canSubmit ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {sending ? 'Signing in...' : mode === 'signin' ? <><span style={{ fontSize: 16 }}></span> Sign In</> : <><span style={{ fontSize: 16 }}></span> Create Account</>}
            </button>

            <p style={{ fontSize: text.sm, color: colors.textMuted, textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
              {mode === 'signin' ? (
                <>Don&apos;t have an account?{' '}
                  <span onClick={() => { setMode('signup'); setError(''); }} style={{ color: colors.brand, cursor: 'pointer', fontWeight: 600 }}>
                    Sign up
                  </span>
                </>
              ) : (
                <>Already have an account?{' '}
                  <span onClick={() => { setMode('signin'); setError(''); }} style={{ color: colors.brand, cursor: 'pointer', fontWeight: 600 }}>
                    Sign in
                  </span>
                </>
              )}
            </p>

            <div style={{
              marginTop: 20, paddingTop: 16, borderTop: `1px solid ${colors.borderLight}`,
            }}>
              <p style={{ fontSize: text.xs, color: colors.textMuted, textAlign: 'center', margin: 0 }}>
                Sign in to vote, comment, and save your favorite rinks.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
