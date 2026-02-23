'use client';

import { useState, useEffect, useRef } from 'react';
import { RinkSummary } from '../../lib/rinkTypes';
import { apiPost } from '../../lib/api';
import { storage } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../lib/theme';
import { VisitorToggle } from './VisitorToggle';
import { ContextToggle } from './ContextToggle';
import { QuickVoteRow } from './QuickVoteRow';
import { QuickTipInput } from './QuickTipInput';

// ── Rate & Contribute — main flow ──
export function RateAndContribute({ rinkId, rinkName, onSummaryUpdate, contributionCount, signals }: { rinkId: string; rinkName: string; onSummaryUpdate: (s: RinkSummary) => void; contributionCount?: number; signals?: { signal: string; value: number; count: number }[] }) {
  const { isLoggedIn } = useAuth();
  const [phase, setPhase] = useState<'button' | 'verify' | 'rate' | 'tip' | 'done_rate' | 'done_tip' | 'confirmed'>('button');
  const [botAnswer, setBotAnswer] = useState('');
  const verifyNum = useRef(Math.floor(Math.random() * 5) + 2);
  const [pendingFlow, setPendingFlow] = useState<'rate' | 'tip'>('rate');
  const [hasRated, setHasRated] = useState(false);
  const [ratedCount, setRatedCount] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [lastRating, setLastRating] = useState<{ signal: string; value: number } | null>(null);

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = { title: rinkName, text: `Check out ${rinkName} on ColdStart`, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // User cancelled share — ignore
    }
  }

  const shareButton = (
    <button
      onClick={handleShare}
      style={{
        marginTop: 10, fontSize: 13, fontWeight: 600,
        color: colors.brand, background: colors.bgInfo,
        border: `1px solid ${colors.brandLight}`,
        borderRadius: 12, padding: '10px 20px',
        cursor: 'pointer', transition: 'all 0.15s',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}
    >
      📤 {shareCopied ? 'Link copied!' : 'Share with your team'}
    </button>
  );

  useEffect(() => {
    const rated = storage.getRatedRinks();
    if (rated[rinkId]) setHasRated(true);
  }, [rinkId]);

  function markRated() {
    const rated = storage.getRatedRinks();
    rated[rinkId] = Date.now();
    storage.setRatedRinks(rated);
    setHasRated(true);
  }

  function checkBot() {
    if (parseInt(botAnswer) === verifyNum.current + 3) setPhase(pendingFlow);
  }

  async function handleQuickConfirm() {
    setConfirming(true);
    try {
      const { data } = await apiPost<{ summary?: RinkSummary }>('/contributions', {
        rink_id: rinkId,
        kind: 'confirm',
        contributor_type: storage.getContributorType(),
        user_id: undefined, // will be set server-side from session
      });
      if (data?.summary) onSummaryUpdate(data.summary);
      setPhase('confirmed');
    } catch {
      // Silently fail — user can try again
    } finally {
      setConfirming(false);
    }
  }

  function startFlow(flow: 'rate' | 'tip') {
    setPendingFlow(flow);
    if (!isLoggedIn) {
      setPhase('verify');
      return;
    }
    setPhase(flow);
  }

  if (phase === 'button') {
    return (
      <section style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => startFlow('rate')} style={{
            flex: 1, padding: '16px 20px',
            background: hasRated ? colors.bgSuccess : colors.surface,
            color: hasRated ? colors.success : colors.textPrimary,
            border: `1px solid ${hasRated ? colors.successBorder : colors.borderDefault}`,
            borderRadius: 14, cursor: 'pointer',
            fontSize: 15, fontWeight: 600, transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = hasRated ? colors.successBorder : colors.borderDefault; }}>
            {hasRated ? <><span>✓</span> Update ratings</> : <><span>📊</span> Rate the rink</>}
          </button>
          <button onClick={() => startFlow('tip')} style={{
            flex: 1, padding: '16px 20px', background: colors.surface, color: colors.textPrimary,
            border: `1px solid ${colors.borderDefault}`, borderRadius: 14, cursor: 'pointer',
            fontSize: 15, fontWeight: 600, transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}>
            <span>💬</span> Drop a tip
          </button>
        </div>
        {contributionCount != null && contributionCount > 0 && !hasRated && (
          <p style={{ fontSize: 12, color: colors.textTertiary, textAlign: 'center', marginTop: 10, margin: '10px 0 0' }}>
            Join {contributionCount} parent{contributionCount !== 1 ? 's' : ''} who&apos;ve rated this rink
          </p>
        )}
        {hasRated && (
          <>
            <button
              onClick={handleQuickConfirm}
              disabled={confirming}
              style={{
                width: '100%', marginTop: 10, padding: '12px 20px',
                fontSize: 13, fontWeight: 600,
                color: colors.success, background: colors.bgSuccess,
                border: `1px solid ${colors.successBorder}`,
                borderRadius: 14, cursor: confirming ? 'wait' : 'pointer',
                opacity: confirming ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              {confirming ? 'Confirming...' : '✓ Still accurate — confirm ratings'}
            </button>
            <p style={{ fontSize: 11, color: colors.textMuted, marginTop: 6, textAlign: 'center' }}>
              One tap to confirm, or update individual signals above.
            </p>
          </>
        )}
      </section>
    );
  }

  const ratedRinkCount = Object.keys(storage.getRatedRinks()).length;

  if (phase === 'confirmed') {
    return (
      <section style={{ marginTop: 16, background: colors.bgSuccess, border: `1px solid ${colors.successBorder}`, borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: colors.success, margin: 0 }}>Confirmed!</p>
        <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }}>Thanks for confirming the ratings are still accurate. This helps keep info fresh.</p>
        {ratedRinkCount >= 2 && (
          <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>You&apos;ve helped families at {ratedRinkCount} rinks this season.</p>
        )}
        {shareButton}
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setPhase('button')} style={{ fontSize: 12, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Done</button>
        </div>
      </section>
    );
  }

  if (phase === 'verify') {
    return (
      <section style={{ marginTop: 16, background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Quick check</p>
        <p style={{ fontSize: 13, color: colors.textTertiary, marginTop: 4 }}>What is {verifyNum.current} + 3?</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', maxWidth: 200, margin: '12px auto 0' }}>
          <input value={botAnswer} onChange={(e) => setBotAnswer(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') checkBot(); }} placeholder="?" autoFocus aria-label="Answer to verification question"
            style={{ width: 60, fontSize: 18, fontWeight: 700, textAlign: 'center', padding: '8px', border: `1px solid ${colors.borderDefault}`, borderRadius: 10, outline: 'none', fontFamily: 'inherit', color: colors.textPrimary }}
            onFocus={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }} />
          <button onClick={checkBot} style={{ fontSize: 14, fontWeight: 600, color: colors.textInverse, background: colors.textPrimary, border: 'none', borderRadius: 10, padding: '8px 20px', cursor: 'pointer' }}>Go</button>
        </div>
      </section>
    );
  }

  if (phase === 'rate') {
    return (
      <section style={{ marginTop: 16, background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '8px 24px', background: colors.bgInfo, borderBottom: `1px solid ${colors.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>Rate the signals</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ContextToggle />
            <VisitorToggle />
          </div>
        </div>
        <div style={{ padding: '18px 24px' }}>
          <QuickVoteRow rinkId={rinkId} onSummaryUpdate={onSummaryUpdate} onRatedCountChange={setRatedCount} onLastRating={(signal, value) => setLastRating({ signal, value })} />
        </div>
        <div style={{ padding: '12px 24px 16px', borderTop: `1px solid ${colors.borderLight}`, display: 'flex', gap: 10 }}>
          <button onClick={() => { if (ratedCount > 0) markRated(); setPhase(ratedCount > 0 ? 'done_rate' : 'button'); }} style={{ flex: 1, padding: '13px 20px', fontSize: 14, fontWeight: 600, background: ratedCount > 0 ? colors.textPrimary : colors.borderDefault, color: ratedCount > 0 ? colors.textInverse : colors.textMuted, border: 'none', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { if (ratedCount > 0) e.currentTarget.style.background = colors.stone800; }}
            onMouseLeave={(e) => { if (ratedCount > 0) e.currentTarget.style.background = colors.textPrimary; }}>
            {ratedCount > 0 ? 'Done' : 'Cancel'}
          </button>
          <button onClick={() => setPhase('tip')} style={{ padding: '13px 20px', fontSize: 14, fontWeight: 600, color: colors.brand, background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}>
            💬 Add tip
          </button>
        </div>
      </section>
    );
  }

  if (phase === 'tip') {
    return (
      <section style={{ marginTop: 16, background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '8px 24px', background: colors.bgInfo, borderBottom: `1px solid ${colors.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>Drop a tip</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ContextToggle />
            <VisitorToggle />
          </div>
        </div>
        <div style={{ padding: '18px 24px' }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: colors.textMuted }}>What should parents know?</span>
          </div>
          <QuickTipInput rinkId={rinkId} onSummaryUpdate={onSummaryUpdate} />
        </div>
        <div style={{ padding: '12px 24px 16px', borderTop: `1px solid ${colors.borderLight}`, textAlign: 'center' }}>
          {!hasRated ? (
            <button onClick={() => setPhase('rate')} style={{ fontSize: 13, fontWeight: 500, color: colors.brand, background: 'none', border: 'none', cursor: 'pointer' }}>📊 Rate the rink too →</button>
          ) : (
            <button onClick={() => setPhase('button')} style={{ fontSize: 13, fontWeight: 500, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>← Done</button>
          )}
        </div>
      </section>
    );
  }

  if (phase === 'done_rate') {
    return (
      <section style={{ marginTop: 16, background: colors.bgSuccess, border: `1px solid ${colors.successBorder}`, borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: colors.success, margin: 0 }}>Rating submitted</p>
        <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }}>Thanks — this helps other hockey parents.</p>
        {lastRating && signals && (() => {
          const match = signals.find(s => s.signal === lastRating.signal);
          if (match && match.count > 0 && Math.abs(lastRating.value - match.value) <= 1) {
            const meta = { parking: 'Parking', cold: 'Comfort', food_nearby: 'Food', chaos: 'Organized', family_friendly: 'Family', locker_rooms: 'Lockers', pro_shop: 'Pro shop' } as Record<string, string>;
            const label = meta[lastRating.signal] || lastRating.signal;
            return (
              <p style={{ fontSize: 12, color: colors.brandDark, background: colors.bgInfo, padding: '8px 12px', borderRadius: 8, marginTop: 8, margin: '8px 0 0' }}>
                Your rating of {lastRating.value} for {label} is close to the average of {match.value.toFixed(1)} — parents agree.
              </p>
            );
          }
          return null;
        })()}
        {ratedRinkCount >= 2 && (
          <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>You&apos;ve helped families at {ratedRinkCount} rinks this season.</p>
        )}
        <button onClick={() => setPhase('tip')} style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: colors.textPrimary, background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 12, padding: '12px 24px', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}>💬 Drop a tip?</button>
        {shareButton}
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setPhase('button')} style={{ fontSize: 12, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Done</button>
        </div>
      </section>
    );
  }

  if (phase === 'done_tip') {
    return (
      <section style={{ marginTop: 16, background: colors.bgSuccess, border: `1px solid ${colors.successBorder}`, borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: colors.success, margin: 0 }}>Tip added</p>
        <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }}>Thanks for sharing what you know.</p>
        <p style={{ fontSize: 12, color: colors.brandDark, background: colors.bgInfo, padding: '8px 12px', borderRadius: 8, marginTop: 8, margin: '8px 0 0' }}>
          Your tip will help visiting families.
        </p>
        {ratedRinkCount >= 2 && (
          <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>You&apos;ve helped families at {ratedRinkCount} rinks this season.</p>
        )}
        {!hasRated && (
          <button onClick={() => setPhase('rate')} style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: colors.textPrimary, background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 12, padding: '12px 24px', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}>📊 Rate the rink too</button>
        )}
        {shareButton}
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setPhase('button')} style={{ fontSize: 12, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Done</button>
        </div>
      </section>
    );
  }

  return null;
}
