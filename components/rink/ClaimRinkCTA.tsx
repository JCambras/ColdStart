'use client';

import { useState } from 'react';
import { storage } from '../../lib/storage';
import { colors, text, radius } from '../../lib/theme';

export function ClaimRinkCTA({ rinkId, rinkName }: { rinkId: string; rinkName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/rinks/${rinkId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), role: role.trim() }),
      });
      if (!res.ok) throw new Error('Claim failed');
    } catch {
      // Also store locally as fallback
      const claims = storage.getClaims();
      claims.push({ rink_id: rinkId, rink_name: rinkName, name: name.trim(), email: email.trim(), role: role.trim(), timestamp: new Date().toISOString() });
      storage.setClaims(claims);
    }
    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div style={{ background: `linear-gradient(135deg, ${colors.indigoBg} 0%, ${colors.bgSuccess} 100%)`, border: `1px solid ${colors.indigoBorder}`, borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✉️</div>
        <p style={{ fontSize: text.lg, fontWeight: 600, color: colors.indigo, margin: 0 }}>We&apos;ll be in touch!</p>
        <p style={{ fontSize: text.md, color: colors.textTertiary, marginTop: 6, lineHeight: 1.5 }}>
          Verified rink profiles are launching soon. As an early claimer, you&apos;ll get priority access + a free month.
        </p>
      </div>
    );
  }

  if (!expanded) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(true); } }}
        style={{
          background: colors.white, border: `1.5px dashed ${colors.brandLight}`, borderRadius: 16, padding: '20px 24px',
          cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 16,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brandAccent; e.currentTarget.style.background = colors.bgInfo; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.brandLight; e.currentTarget.style.background = colors.white; }}
      >
        <div style={{ width: 44, height: 44, borderRadius: radius.xl, background: colors.indigoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏟️</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: text.base, fontWeight: 600, color: colors.indigo, margin: 0 }}>Manage this rink?</p>
          <p style={{ fontSize: text.sm, color: colors.textTertiary, marginTop: 2 }}>Claim your profile — respond to feedback, get featured, see analytics.</p>
        </div>
        <span style={{ fontSize: text.sm, fontWeight: 600, color: colors.brandAccent, whiteSpace: 'nowrap' }}>Claim →</span>
      </div>
    );
  }

  return (
    <div style={{ background: colors.white, border: `1px solid ${colors.indigoBorder}`, borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Claim {rinkName}</h3>
        <button onClick={() => setExpanded(false)} style={{ fontSize: text.sm, color: colors.textMuted, cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
      </div>
      <p style={{ fontSize: text.md, color: colors.textTertiary, marginBottom: 16, lineHeight: 1.5 }}>
        Verified rink profiles are coming soon. Leave your info and we&apos;ll reach out with early access. Free for the first 30 days.
      </p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" style={{ width: '100%', fontSize: text.base, border: `1px solid ${colors.borderDefault}`, borderRadius: radius.lg, padding: '11px 14px', marginBottom: 10, outline: 'none', fontFamily: 'inherit', color: colors.textPrimary }} onFocus={(e) => { e.currentTarget.style.borderColor = colors.brandAccent; }} onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" autoComplete="email" style={{ width: '100%', fontSize: text.base, border: `1px solid ${colors.borderDefault}`, borderRadius: radius.lg, padding: '11px 14px', marginBottom: 10, outline: 'none', fontFamily: 'inherit', color: colors.textPrimary }} onFocus={(e) => { e.currentTarget.style.borderColor = colors.brandAccent; }} onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }} />
      <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Your role (e.g. Rink Manager, Owner)" autoComplete="organization-title" style={{ width: '100%', fontSize: text.base, border: `1px solid ${colors.borderDefault}`, borderRadius: radius.lg, padding: '11px 14px', marginBottom: 16, outline: 'none', fontFamily: 'inherit', color: colors.textPrimary }} onFocus={(e) => { e.currentTarget.style.borderColor = colors.brandAccent; }} onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }} />
      <button onClick={handleSubmit} disabled={!name.trim() || !email.trim() || submitting} style={{ width: '100%', padding: '13px 20px', fontSize: text.base, fontWeight: 600, background: (name.trim() && email.trim()) ? colors.indigo : colors.borderDefault, color: (name.trim() && email.trim()) ? colors.white : colors.textMuted, border: 'none', borderRadius: radius.xl, cursor: 'pointer', transition: 'all 0.2s', opacity: submitting ? 0.6 : 1 }}>
        {submitting ? 'Submitting...' : 'Request early access'}
      </button>
      <p style={{ fontSize: text.xs, color: colors.textMuted, marginTop: 10, textAlign: 'center' }}>No charge until you activate. We&apos;ll email you when it&apos;s ready.</p>
    </div>
  );
}
