'use client';

import { useState } from 'react';
import { RinkSummary } from '../../lib/rinkTypes';
import { apiPost } from '../../lib/api';
import { storage } from '../../lib/storage';
import { colors } from '../../lib/theme';
import { ContextToggle } from './ContextToggle';

const PROMPT_SIGNALS = [
  { key: 'parking', icon: '🅿️', question: 'How was parking?', low: 'Tough', high: 'Easy' },
  { key: 'cold', icon: '🌡️', question: 'How comfortable was it?', low: 'Freezing', high: 'Comfortable' },
  { key: 'food_nearby', icon: '🍔', question: 'Food options nearby?', low: 'None', high: 'Plenty' },
  { key: 'chaos', icon: '📋', question: 'How organized was it?', low: 'Hectic', high: 'Calm' },
  { key: 'family_friendly', icon: '👨‍👩‍👧', question: 'Family friendly?', low: 'Not great', high: 'Great' },
  { key: 'locker_rooms', icon: '🚪', question: 'Locker rooms?', low: 'Tight', high: 'Spacious' },
  { key: 'pro_shop', icon: '🏒', question: 'Pro shop?', low: 'Sparse', high: 'Stocked' },
];

interface ReturnRatingPromptProps {
  rinkId: string;
  rinkName: string;
  rinkAddress: string;
  contributionCount: number;
  onDismiss: () => void;
  onSummaryUpdate: (s: RinkSummary) => void;
  currentUser: { id: string; name: string; email: string } | null;
}

export function ReturnRatingPrompt({
  rinkId, rinkName, rinkAddress, contributionCount, onDismiss, onSummaryUpdate, currentUser,
}: ReturnRatingPromptProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rated, setRated] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [tipMode, setTipMode] = useState(false);
  const [tipText, setTipText] = useState('');

  const current = PROMPT_SIGNALS[currentIndex];
  const totalRated = Object.keys(rated).length;

  async function submitRating(signal: string, value: number) {
    setRated(prev => ({ ...prev, [signal]: value }));
    setSubmitting(true);

    const { data } = await apiPost<{ summary?: RinkSummary }>('/contributions', {
      rink_id: rinkId,
      kind: 'signal_rating',
      contributor_type: storage.getContributorType(),
      context: storage.getRatingContext(),
      signal_rating: { signal, value },
      user_id: currentUser?.id,
    });
    if (data?.summary) onSummaryUpdate(data.summary);

    setSubmitting(false);

    if (currentIndex < PROMPT_SIGNALS.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    } else {
      setDone(true);
    }
  }

  async function submitTip() {
    if (!tipText.trim()) return;
    const { data } = await apiPost<{ summary?: RinkSummary }>('/contributions', {
      rink_id: rinkId,
      kind: 'tip',
      contributor_type: storage.getContributorType(),
      context: storage.getRatingContext(),
      tip: { text: tipText.trim() },
      user_id: currentUser?.id,
    });
    if (data?.summary) onSummaryUpdate(data.summary);
    storage.addMyTip(rinkId, tipText.trim());
    setTipMode(false);
    setDone(true);
  }

  function handleFinish() {
    try {
      localStorage.setItem(`coldstart_rated_${rinkId}`, new Date().toISOString());
      const ratedRinks = storage.getRatedRinks();
      ratedRinks[rinkId] = Date.now();
      storage.setRatedRinks(ratedRinks);
    } catch {}
    onDismiss();
  }

  if (done) {
    function handleShare() {
      const shareUrl = new URL(window.location.href);
      shareUrl.searchParams.set('ref', 'post_rate');
      const url = shareUrl.toString();
      const shareText = `${rinkName}\n📍 ${rinkAddress}\nRink info from hockey parents: ${url}`;
      if (typeof navigator.share === 'function') {
        navigator.share({ title: `${rinkName} — ColdStart Hockey`, text: shareText, url }).catch(() => {});
      } else {
        if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(shareText).catch(() => {}); } else { const ta = document.createElement('textarea'); ta.value = shareText; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
      }
    }

    return (
      <section style={{
        background: `linear-gradient(135deg, ${colors.bgSuccess} 0%, ${colors.bgSuccess} 100%)`,
        border: `1px solid ${colors.successBorder}`,
        borderRadius: 14, padding: '18px 20px', marginTop: 16,
      }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: colors.success, margin: 0 }}>
          Thanks! You rated {totalRated} signal{totalRated !== 1 ? 's' : ''}.
        </p>
        <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 3, margin: '3px 0 0' }}>
          {contributionCount > 1
            ? `You're one of ${contributionCount} parents helping families headed to ${rinkName}.`
            : `You're the first parent to rate ${rinkName} — the next family will see your intel.`
          }
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={handleShare}
            style={{
              flex: 1, fontSize: 13, fontWeight: 600,
              color: colors.textInverse, background: colors.success,
              border: 'none', borderRadius: 8,
              padding: '10px 16px', cursor: 'pointer',
            }}
          >
            📤 Share this rink with your team
          </button>
          <button
            onClick={handleFinish}
            style={{
              fontSize: 13, fontWeight: 600, color: colors.success,
              background: colors.surface, border: `1px solid ${colors.successBorder}`,
              borderRadius: 8, padding: '10px 16px', cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </section>
    );
  }

  if (tipMode) {
    return (
      <section style={{
        background: `linear-gradient(135deg, ${colors.indigoBg} 0%, ${colors.purpleBg} 100%)`,
        border: `1px solid ${colors.indigoBorder}`,
        borderRadius: 14, padding: '18px 20px', marginTop: 16,
      }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: colors.indigo, margin: 0 }}>
          Drop a quick tip about {rinkName}
        </p>
        <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 3, margin: '3px 0 0' }}>
          Parking hack, entrance tip, food recommendation — anything that helps the next family.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            value={tipText}
            onChange={(e) => setTipText(e.target.value)}
            placeholder="e.g. Use the side entrance for Rink C"
            onKeyDown={(e) => e.key === 'Enter' && submitTip()}
            maxLength={280}
            aria-label="Write a tip"
            autoFocus
            style={{
              flex: 1, fontSize: 14, padding: '10px 14px',
              border: `1px solid ${colors.borderMedium}`, borderRadius: 10,
              outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={submitTip}
            disabled={!tipText.trim()}
            style={{
              fontSize: 13, fontWeight: 600, color: colors.textInverse,
              background: tipText.trim() ? colors.indigo : colors.indigoBorder,
              border: 'none', borderRadius: 10, padding: '10px 18px',
              cursor: tipText.trim() ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
            }}
          >
            Send
          </button>
        </div>
        <button
          onClick={() => { setTipMode(false); setDone(true); }}
          style={{
            fontSize: 11, color: colors.textMuted, background: 'none', border: 'none',
            cursor: 'pointer', marginTop: 8, padding: '6px 12px',
          }}
        >
          Skip →
        </button>
      </section>
    );
  }

  return (
    <section style={{
      background: `linear-gradient(135deg, ${colors.indigoBg} 0%, ${colors.purpleBg} 100%)`,
      border: `1px solid ${colors.indigoBorder}`,
      borderRadius: 14, padding: '18px 20px', marginTop: 16,
    }}>
      <div style={{ marginBottom: 10 }}>
        <ContextToggle />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: colors.indigo, margin: 0 }}>
            {totalRated === 0 ? `Been to ${rinkName}?` : current.question}
          </p>
          <p style={{ fontSize: 11, color: colors.textTertiary, marginTop: 2, margin: '2px 0 0' }}>
            {totalRated === 0
              ? 'Quick rate — tap a number, help the next family.'
              : `${totalRated} of ${PROMPT_SIGNALS.length} · tap to rate or skip`
            }
          </p>
        </div>
        <button
          onClick={() => {
            if (totalRated > 0) { setDone(true); }
            else { handleFinish(); }
          }}
          style={{ fontSize: 14, color: colors.indigoBorder, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '12px', minWidth: 44, minHeight: 44 }}
        >
          ✕
        </button>
      </div>

      <div style={{ height: 3, background: colors.purpleBorder, borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: colors.indigo,
          width: `${(currentIndex / PROMPT_SIGNALS.length) * 100}%`,
          transition: 'width 0.3s ease',
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 28 }}>{current.icon}</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary }}>
            {current.question}
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
            {current.low} ← 1 · · · 5 → {current.high}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((val) => {
          const isRated = rated[current.key] === val;
          const color = val >= 4 ? colors.success : val >= 3 ? colors.warning : colors.error;
          const bg = val >= 4 ? colors.bgSuccess : val >= 3 ? colors.bgWarning : colors.bgError;
          return (
            <button
              key={val}
              onClick={() => !submitting && submitRating(current.key, val)}
              disabled={submitting}
              style={{
                flex: 1, height: 48,
                fontSize: 18, fontWeight: 700,
                color: isRated ? '#fff' : color,
                background: isRated ? color : bg,
                border: `2px solid ${isRated ? color : 'transparent'}`,
                borderRadius: 10, cursor: submitting ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {val}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <button
          onClick={() => {
            if (currentIndex < PROMPT_SIGNALS.length - 1) {
              setCurrentIndex(prev => prev + 1);
            } else {
              setTipMode(true);
            }
          }}
          style={{
            fontSize: 12, color: colors.textMuted, background: 'none', border: 'none',
            cursor: 'pointer', padding: '6px 12px',
          }}
        >
          Skip this →
        </button>
        {totalRated > 0 && (
          <button
            onClick={() => setTipMode(true)}
            style={{
              fontSize: 12, color: colors.indigo, background: 'none', border: 'none',
              cursor: 'pointer', padding: '6px 12px', fontWeight: 600,
            }}
          >
            + Add a tip instead
          </button>
        )}
      </div>
    </section>
  );
}
