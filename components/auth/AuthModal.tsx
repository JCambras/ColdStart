'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Logo } from '../Logo';
import { UserProfile } from '../../lib/rinkTypes';
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

  async function handleCredentials() {
    if (!email.trim() || !password.trim()) return;
    if (mode === 'signup' && !name.trim()) return;
    setError('');
    setSending(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        password,
        name: name.trim(),
        action: mode,
      });

      if (result?.error) {
        const msg = result.error === 'CredentialsSignin'
          ? mode === 'signin'
            ? 'Invalid email or password.'
            : 'Account already exists. Sign in instead.'
          : result.error;
        setError(msg);
        setSending(false);
        return;
      }

      setSending(false);
      setSent(true);
      setTimeout(() => onSuccess({} as UserProfile), 600);
    } catch {
      setError('Something went wrong. Please try again.');
      setSending(false);
    }
  }

  function handleSocial(provider: string) {
    signIn(provider, { callbackUrl: window.location.href });
  }

  const canSubmit = email.trim() && password.trim() && (mode === 'signin' || name.trim());

  const socialButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 0',
    fontSize: text.base,
    fontWeight: 600,
    background: colors.surface,
    color: colors.textPrimary,
    border: `1px solid ${colors.borderDefault}`,
    borderRadius: radius.lg,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.15s',
  };

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
          background: colors.surface, borderRadius: 20, maxWidth: 400, width: '100%',
          padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#x2705;</div>
            <p style={{ fontSize: text.xl, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>You&apos;re in!</p>
            <p style={{ fontSize: text.base, color: colors.textTertiary, marginTop: 8 }}>Welcome to ColdStart Hockey.</p>
          </div>
        ) : (
          <>
            {/* Branding */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'inline-block', marginBottom: 8 }}><Logo size={40} /></div>
              <p id="auth-modal-title" style={{
                fontSize: 20, fontWeight: 600, color: colors.textPrimary, margin: 0,
              }}>
                {mode === 'signin' ? 'Sign in to ColdStart' : 'Create your account'}
              </p>
              <p style={{ fontSize: text.sm, color: colors.textTertiary, marginTop: 6, margin: '6px 0 0' }}>
                {mode === 'signin'
                  ? 'Welcome back! Pick a sign-in method.'
                  : 'Set up a new account to get started.'}
              </p>
            </div>

            {/* Social login buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <button onClick={() => handleSocial('google')} style={socialButtonStyle}>
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Continue with Google
              </button>
              <button onClick={() => handleSocial('apple')} style={socialButtonStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                Continue with Apple
              </button>
              <button onClick={() => handleSocial('facebook')} style={socialButtonStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Continue with Facebook
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: colors.borderDefault }} />
              <span style={{ fontSize: text.sm, color: colors.textMuted, fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: colors.borderDefault }} />
            </div>

            {error && (
              <div style={{
                padding: '8px 12px', marginBottom: 12, borderRadius: radius.md,
                background: colors.bgError, border: `1px solid ${colors.error}`,
                fontSize: text.sm, color: colors.error,
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
                onKeyDown={(e) => e.key === 'Enter' && handleCredentials()}
                placeholder="Enter your password"
                minLength={8}
                style={{
                  width: '100%', padding: '10px 14px', fontSize: text.base,
                  border: `1px solid ${colors.borderMedium}`, borderRadius: radius.lg,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleCredentials}
              disabled={sending || !canSubmit}
              style={{
                width: '100%', padding: '12px 0', fontSize: text.base, fontWeight: 700,
                background: sending ? colors.brandLight : colors.textPrimary, color: colors.textInverse,
                border: 'none', borderRadius: radius.lg, cursor: sending ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                opacity: !canSubmit ? 0.5 : 1,
              }}
            >
              {sending ? 'Signing in...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

            <p style={{ fontSize: text.sm, color: colors.textMuted, textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
              {mode === 'signin' ? (
                <>Don&apos;t have an account?{' '}
                  <button onClick={() => { setMode('signup'); setError(''); }} style={{ color: colors.brand, cursor: 'pointer', fontWeight: 600, background: 'none', border: 'none', padding: 0, font: 'inherit' }}>
                    Sign up
                  </button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button onClick={() => { setMode('signin'); setError(''); }} style={{ color: colors.brand, cursor: 'pointer', fontWeight: 600, background: 'none', border: 'none', padding: 0, font: 'inherit' }}>
                    Sign in
                  </button>
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
