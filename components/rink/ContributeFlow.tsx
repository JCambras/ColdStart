'use client';

import { useState, useEffect, useRef } from 'react';
import { SIGNAL_META, SIGNAL_OPTIONS, SignalType, ContributorType } from '../../lib/constants';
import { RinkSummary } from '../../lib/rinkTypes';
import { apiPost } from '../../lib/api';
import { storage } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../lib/theme';
import { VisitorToggle } from './VisitorToggle';
import { ContextToggle } from './ContextToggle';
import { QuickVoteRow } from './QuickVoteRow';
import { QuickTipInput } from './QuickTipInput';

// ── Contribution Form (inline, 2-step) ──
export function ContributeSection({ rinkId, onSummaryUpdate }: { rinkId: string; onSummaryUpdate: (s: RinkSummary) => void }) {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState<'idle' | 'signal' | 'tip'>('idle');
  const [selectedSignal, setSelectedSignal] = useState<SignalType | null>(null);
  const [signalValue, setSignalValue] = useState<number | null>(null);
  const [tipText, setTipText] = useState('');
  const [contributorType, setContributorType] = useState<ContributorType>('visiting_parent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  function reset() {
    setMode('idle');
    setSelectedSignal(null);
    setSignalValue(null);
    setTipText('');
    setError(null);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const body: Record<string, unknown> = {
      rink_id: rinkId,
      contributor_type: contributorType,
      context: storage.getRatingContext(),
      user_id: currentUser?.id,
    };

    if (mode === 'signal' && selectedSignal && signalValue) {
      body.kind = 'signal_rating';
      body.signal_rating = { signal: selectedSignal, value: signalValue };
    } else if (mode === 'tip' && tipText.trim()) {
      body.kind = 'one_thing_tip';
      body.one_thing_tip = { text: tipText.trim() };
    } else return;

    const { data, error: apiError } = await apiPost<{ summary?: RinkSummary }>('/contributions', body);
    if (apiError) {
      setError(apiError);
    } else {
      if (data?.summary) onSummaryUpdate(data.summary);
      setSuccess(true);
      setTimeout(() => { reset(); setSuccess(false); }, 2000);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div style={{ background: colors.bgSuccess, border: `1px solid ${colors.successBorder}`, borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: colors.success, margin: 0 }}>Thanks for sharing!</p>
        <p style={{ fontSize: 13, color: colors.textTertiary, marginTop: 4 }}>The summary has been updated. Your contribution helps the next family headed here.</p>
      </div>
    );
  }

  if (mode === 'idle') {
    return (
      <div ref={formRef}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>Share what you know</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setMode('tip')} style={{ flex: 1, padding: '20px 16px', background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 14, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>Drop a tip</div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>&ldquo;Park behind building 2&rdquo;</div>
          </button>
          <button onClick={() => setMode('signal')} style={{ flex: 1, padding: '20px 16px', background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 14, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📊</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>Rate a signal</div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Parking, cold, food...</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={formRef} style={{ background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>{mode === 'signal' ? 'Rate a signal' : 'One thing to know'}</h3>
        <button onClick={reset} style={{ fontSize: 12, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>← Back</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: colors.textMuted }}>{contributorType === 'visiting_parent' ? "I'm visiting" : 'I play here regularly'}</span>
        <button onClick={() => setContributorType(contributorType === 'visiting_parent' ? 'local_parent' : 'visiting_parent')} style={{ fontSize: 11, color: colors.brand, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Change</button>
      </div>

      {mode === 'signal' && (
        <>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{selectedSignal ? '1. Signal' : '1. Pick a signal'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SIGNAL_OPTIONS.map((s) => (
                <button key={s.key} onClick={() => { setSelectedSignal(s.key); setSignalValue(null); }}
                  style={{ fontSize: 13, padding: '10px 16px', borderRadius: 12, border: `1.5px solid ${selectedSignal === s.key ? colors.brand : colors.borderDefault}`, background: selectedSignal === s.key ? colors.bgInfo : colors.surface, color: selectedSignal === s.key ? colors.brand : colors.textSecondary, cursor: 'pointer', fontWeight: selectedSignal === s.key ? 600 : 400, transition: 'all 0.15s' }}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>
          {selectedSignal && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>2. Rate it</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map((v) => {
                  const active = signalValue === v;
                  const hov = hoveredValue === v;
                  return (
                    <button key={v} onClick={() => setSignalValue(v)} onMouseEnter={() => setHoveredValue(v)} onMouseLeave={() => setHoveredValue(null)}
                      aria-label={`Rate ${v} out of 5`}
                      style={{ width: 52, height: 52, borderRadius: 12, border: `1.5px solid ${active ? colors.brand : hov ? colors.brandLight : colors.borderDefault}`, background: active ? colors.brand : hov ? colors.bgInfo : colors.surface, color: active ? colors.textInverse : colors.textSecondary, fontSize: 18, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {v}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingLeft: 4, paddingRight: 4 }}>
                <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>← {SIGNAL_META[selectedSignal]?.lowLabel || 'Low'}</span>
                <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>{SIGNAL_META[selectedSignal]?.highLabel || 'High'} →</span>
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'tip' && (
        <div style={{ marginBottom: 20 }}>
          <textarea value={tipText} onChange={(e) => setTipText(e.target.value)} placeholder="One thing parents should know about this rink..." maxLength={280} rows={3} aria-label="Write a tip"
            style={{ width: '100%', fontSize: 14, border: `1px solid ${colors.borderDefault}`, borderRadius: 12, padding: '14px 16px', outline: 'none', resize: 'none', fontFamily: 'inherit', color: colors.textPrimary, lineHeight: 1.5 }}
            onFocus={(e) => { e.currentTarget.style.borderColor = colors.brand; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.1)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; e.currentTarget.style.boxShadow = 'none'; }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: tipText.length > 240 ? colors.amber : colors.textMuted, fontWeight: tipText.length > 260 ? 600 : 400 }}>{tipText.length}/280</span>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" style={{ fontSize: 13, color: colors.error, background: colors.bgError, padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>{error}</div>
      )}

      <button onClick={handleSubmit} disabled={loading || (mode === 'signal' ? !(selectedSignal && signalValue) : !tipText.trim())}
        style={{ width: '100%', padding: '14px 20px', fontSize: 14, fontWeight: 600, background: (mode === 'signal' ? (selectedSignal && signalValue) : tipText.trim()) ? colors.textPrimary : colors.borderDefault, color: (mode === 'signal' ? (selectedSignal && signalValue) : tipText.trim()) ? colors.textInverse : colors.textMuted, border: 'none', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
}

// ── Rate & Contribute — main flow ──
export function RateAndContribute({ rinkId, rinkName, onSummaryUpdate }: { rinkId: string; rinkName: string; onSummaryUpdate: (s: RinkSummary) => void }) {
  const { isLoggedIn } = useAuth();
  const [phase, setPhase] = useState<'button' | 'verify' | 'rate' | 'tip' | 'done_rate' | 'done_tip' | 'confirmed'>('button');
  const [botAnswer, setBotAnswer] = useState('');
  const verifyNum = useRef(Math.floor(Math.random() * 5) + 2);
  const [pendingFlow, setPendingFlow] = useState<'rate' | 'tip'>('rate');
  const [hasRated, setHasRated] = useState(false);
  const [ratedCount, setRatedCount] = useState(0);
  const [confirming, setConfirming] = useState(false);

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

  if (phase === 'confirmed') {
    return (
      <section style={{ marginTop: 16, background: colors.bgSuccess, border: `1px solid ${colors.successBorder}`, borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: colors.success, margin: 0 }}>Confirmed!</p>
        <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 4 }}>Thanks for confirming the ratings are still accurate. This helps keep info fresh.</p>
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
          <QuickVoteRow rinkId={rinkId} onSummaryUpdate={onSummaryUpdate} onRatedCountChange={setRatedCount} />
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
        <button onClick={() => setPhase('tip')} style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: colors.textPrimary, background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 12, padding: '12px 24px', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}>💬 Drop a tip?</button>
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
        {!hasRated && (
          <button onClick={() => setPhase('rate')} style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: colors.textPrimary, background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 12, padding: '12px 24px', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.brand; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}>📊 Rate the rink too</button>
        )}
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setPhase('button')} style={{ fontSize: 12, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Done</button>
        </div>
      </section>
    );
  }

  return null;
}
