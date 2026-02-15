'use client';

import { useState } from 'react';
import { storage } from '../../lib/storage';

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
    const claims = storage.getClaims();
    claims.push({ rink_id: rinkId, rink_name: rinkName, name: name.trim(), email: email.trim(), role: role.trim(), timestamp: new Date().toISOString() });
    storage.setClaims(claims);
    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', border: '1px solid #bfdbfe', borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✉️</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#1e40af', margin: 0 }}>We&apos;ll be in touch!</p>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6, lineHeight: 1.5 }}>
          Verified rink profiles are launching soon. As an early claimer, you&apos;ll get priority access + a free month.
        </p>
      </div>
    );
  }

  if (!expanded) {
    return (
      <div onClick={() => setExpanded(true)} style={{
        background: '#fff', border: '1.5px dashed #93c5fd', borderRadius: 16, padding: '20px 24px',
        cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 16,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#f8faff'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.background = '#fff'; }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏟️</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1e40af', margin: 0 }}>Manage this rink?</p>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Claim your profile — respond to feedback, get featured, see analytics.</p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', whiteSpace: 'nowrap' }}>Claim →</span>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Claim {rinkName}</h3>
        <button onClick={() => setExpanded(false)} style={{ fontSize: 12, color: '#9ca3af', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
      </div>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 }}>
        Verified rink profiles are coming soon. Leave your info and we&apos;ll reach out with early access. Free for the first 30 days.
      </p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" style={{ width: '100%', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', marginBottom: 10, outline: 'none', fontFamily: 'inherit', color: '#111827' }} onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" autoComplete="email" style={{ width: '100%', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', marginBottom: 10, outline: 'none', fontFamily: 'inherit', color: '#111827' }} onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
      <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Your role (e.g. Rink Manager, Owner)" autoComplete="organization-title" style={{ width: '100%', fontSize: 14, border: '1px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', marginBottom: 16, outline: 'none', fontFamily: 'inherit', color: '#111827' }} onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }} />
      <button onClick={handleSubmit} disabled={!name.trim() || !email.trim() || submitting} style={{ width: '100%', padding: '13px 20px', fontSize: 14, fontWeight: 600, background: (name.trim() && email.trim()) ? '#1e40af' : '#e5e7eb', color: (name.trim() && email.trim()) ? '#fff' : '#9ca3af', border: 'none', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', opacity: submitting ? 0.6 : 1 }}>
        {submitting ? 'Submitting...' : 'Request early access'}
      </button>
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>No charge until you activate. We&apos;ll email you when it&apos;s ready.</p>
    </div>
  );
}
