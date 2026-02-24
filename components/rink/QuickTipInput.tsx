'use client';

import { useState, useEffect, useRef } from 'react';
import { RinkSummary } from '../../lib/rinkTypes';
import { apiPost } from '../../lib/api';
import { storage } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, pad } from '../../lib/theme';

interface QuickTipInputProps {
  rinkId: string;
  onSummaryUpdate: (s: RinkSummary) => void;
}

export function QuickTipInput({ rinkId, onSummaryUpdate }: QuickTipInputProps) {
  const { isLoggedIn, openAuth } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const pendingSubmitRef = useRef<string | null>(null);

  const submitWithTextRef = useRef(submitWithText);
  submitWithTextRef.current = submitWithText;

  useEffect(() => {
    if (isLoggedIn && pendingSubmitRef.current) {
      const pendingText = pendingSubmitRef.current;
      pendingSubmitRef.current = null;
      setText(pendingText);
      setTimeout(() => submitWithTextRef.current(pendingText), 0);
    }
  }, [isLoggedIn]);

  async function submitWithText(tipText: string) {
    if (!tipText.trim()) return;
    setError(false);
    setSubmitting(true);
    try {
      const contributorType = storage.getContributorType();
      const { data } = await apiPost<{ summary?: RinkSummary }>('/contributions', {
        rink_id: rinkId, kind: 'one_thing_tip', contributor_type: contributorType,
        context: storage.getRatingContext(),
        one_thing_tip: { text: tipText.trim() },
      });
      if (data?.summary) onSummaryUpdate(data.summary);
      setText('');
      setSuccess(true);
    } catch {
      setError(true);
    }
    setSubmitting(false);
  }

  async function submit() {
    if (!text.trim() || submitting) return;
    if (!isLoggedIn) {
      pendingSubmitRef.current = text.trim();
      openAuth();
      return;
    }
    await submitWithText(text);
  }

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[8], padding: pad(spacing[4], spacing[0]) }}>
        <span style={{ fontSize: 16 }}>✓</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.success, flex: 1 }}>Tip added — thanks!</span>
        <button
          onClick={() => setSuccess(false)}
          aria-label="Dismiss"
          style={{
            fontSize: 16, color: colors.textMuted, background: 'none',
            border: 'none', cursor: 'pointer', padding: pad(spacing[2], spacing[6]),
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[6] }}>
      {error && (
        <div style={{ fontSize: 11, color: colors.error }}>
          Couldn&apos;t save — try again
        </div>
      )}
    <div style={{ display: 'flex', gap: spacing[10], alignItems: 'center' }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>💬</span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="One thing parents should know..."
        maxLength={280}
        aria-label="Add a tip about this rink"
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        style={{
          flex: 1, fontSize: 14, padding: pad(spacing[10], spacing[14]),
          border: `1px solid ${colors.borderDefault}`, borderRadius: 10,
          outline: 'none', fontFamily: 'inherit', color: colors.textPrimary,
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}
      />
      <button
        onClick={submit}
        disabled={!text.trim() || submitting}
        style={{
          fontSize: 13, fontWeight: 600,
          color: text.trim() ? colors.textInverse : colors.textMuted,
          background: text.trim() ? colors.textPrimary : colors.borderDefault,
          border: 'none', borderRadius: 10, padding: pad(spacing[10], spacing[18]),
          cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'all 0.2s', opacity: submitting ? 0.5 : 1,
        }}
      >
        Add
      </button>
    </div>
    {text.length > 0 && (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 11, color: text.length > 240 ? colors.amber : colors.textMuted, fontWeight: text.length > 260 ? 600 : 400 }}>{text.length}/280</span>
      </div>
    )}
    </div>
  );
}
