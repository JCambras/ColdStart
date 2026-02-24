'use client';

import { useState } from 'react';
import { storage } from '../../lib/storage';
import { colors, text, spacing, pad } from '../../lib/theme';

interface RinkRequestFormProps {
  query: string;
}

export function RinkRequestForm({ query }: RinkRequestFormProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit() {
    if (!email.trim()) return;
    const requests = storage.getRinkRequests();
    requests.push({ query, email: email.trim(), timestamp: new Date().toISOString() });
    storage.setRinkRequests(requests);
    setSent(true);
  }

  if (sent) {
    return (
      <div style={{ marginTop: spacing[16], padding: pad(spacing[16], spacing[20]), background: colors.bgSuccess, border: `1px solid ${colors.successBorder}`, borderRadius: 12 }}>
        <p style={{ fontSize: text.base, fontWeight: 600, color: colors.success, margin: spacing[0] }}>Got it!</p>
        <p style={{ fontSize: text.md, color: colors.textTertiary, marginTop: spacing[4] }}>
          We&apos;ll add &ldquo;{query}&rdquo; and email you when it&apos;s live.
        </p>
      </div>
    );
  }

  return (
    <>
      <p style={{ fontSize: text.base, color: colors.textTertiary, marginTop: spacing[8], lineHeight: 1.5 }}>
        Know a rink we&apos;re missing? Drop your email and we&apos;ll add it.
      </p>
      <div style={{ display: 'flex', gap: spacing[8], marginTop: spacing[16] }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          type="email"
          autoComplete="email"
          aria-label="Email for rink request notification"
          style={{
            flex: 1, fontSize: text.base, padding: pad(spacing[10], spacing[14]),
            border: `1px solid ${colors.borderDefault}`, borderRadius: 10,
            outline: 'none', fontFamily: 'inherit', color: colors.textPrimary,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}
        />
        <button
          onClick={handleSubmit}
          disabled={!email.trim()}
          style={{
            fontSize: text.base, fontWeight: 600,
            color: email.trim() ? colors.textInverse : colors.textMuted,
            background: email.trim() ? colors.brand : colors.borderDefault,
            border: 'none', borderRadius: 10, padding: pad(spacing[10], spacing[20]),
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
          }}
        >
          Notify me
        </button>
      </div>
    </>
  );
}
