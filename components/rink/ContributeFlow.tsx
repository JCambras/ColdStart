'use client';

import { useState, useEffect, useRef } from 'react';
import { SIGNAL_META, SIGNAL_OPTIONS, SignalType, ContributorType } from '../../lib/constants';
import { RinkSummary } from '../../lib/rinkTypes';
import { apiPost } from '../../lib/api';
import { storage } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';

// ── Visitor/Regular Toggle ──
function VisitorToggle() {
  const [type, setType] = useState<'visiting_parent' | 'local_parent'>('visiting_parent');

  useEffect(() => {
    const saved = storage.getContributorType();
    if (saved === 'local_parent' || saved === 'visiting_parent') setType(saved);
  }, []);

  function toggle() {
    const next = type === 'visiting_parent' ? 'local_parent' : 'visiting_parent';
    setType(next);
    storage.setContributorType(next);
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {([['visiting_parent', '✈️ Visiting'], ['local_parent', '🏠 Regular']] as const).map(([val, label]) => (
        <button
          key={val}
          onClick={toggle}
          style={{
            fontSize: 12, fontWeight: type === val ? 600 : 400,
            padding: '5px 12px', borderRadius: 20,
            background: type === val ? (val === 'local_parent' ? '#eff6ff' : '#faf5ff') : 'transparent',
            color: type === val ? (val === 'local_parent' ? '#1d4ed8' : '#7c3aed') : '#9ca3af',
            border: `1px solid ${type === val ? (val === 'local_parent' ? '#bfdbfe' : '#ddd6fe') : 'transparent'}`,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Quick Vote Row ──
function QuickVoteRow({ rinkId, context, onSummaryUpdate }: { rinkId: string; context: string; onSummaryUpdate: (s: RinkSummary) => void }) {
  const { isLoggedIn, openAuth } = useAuth();
  const [activeSignal, setActiveSignal] = useState<SignalType | null>(null);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justRated, setJustRated] = useState<string | null>(null);
  const pendingSubmitRef = useRef<{ signal: SignalType; value: number } | null>(null);

  // Replay pending action when user logs in
  useEffect(() => {
    if (isLoggedIn && pendingSubmitRef.current) {
      const { signal, value } = pendingSubmitRef.current;
      pendingSubmitRef.current = null;
      setActiveSignal(signal);
      submitRating(value);
    }
  }, [isLoggedIn]);

  const signals: { key: SignalType; icon: string; label: string }[] = [
    { key: 'parking', icon: '🅿️', label: 'Parking' },
    { key: 'cold', icon: '❄️', label: 'Cold' },
    { key: 'food_nearby', icon: '🍔', label: 'Food' },
    { key: 'chaos', icon: '🌀', label: 'Chaos' },
    { key: 'family_friendly', icon: '👨‍👩‍👧', label: 'Family' },
    { key: 'locker_rooms', icon: '🚪', label: 'Lockers' },
    { key: 'pro_shop', icon: '🏒', label: 'Pro shop' },
  ];

  async function submitRating(value: number) {
    if (!activeSignal || submitting) return;
    if (!isLoggedIn) {
      pendingSubmitRef.current = { signal: activeSignal, value };
      openAuth();
      return;
    }
    setSubmitting(true);
    const contributorType = storage.getContributorType();
    const { data } = await apiPost<{ summary?: RinkSummary }>('/contributions', {
      rink_id: rinkId,
      kind: 'signal_rating',
      contributor_type: contributorType,
      context: context,
      signal_rating: { signal: activeSignal, value },
    });
    if (data?.summary) onSummaryUpdate(data.summary);
    setJustRated(activeSignal);
    setActiveSignal(null);
    setTimeout(() => setJustRated(null), 2000);
    setSubmitting(false);
  }

  return (
    <div>
      {/* Signal selector row */}
      {!activeSignal && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {signals.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSignal(s.key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '10px 14px', borderRadius: 12,
                background: justRated === s.key ? '#f0fdf4' : '#fafbfc',
                border: `1px solid ${justRated === s.key ? '#bbf7d0' : '#e5e7eb'}`,
                cursor: 'pointer', transition: 'all 0.15s',
                minWidth: 64,
              }}
              onMouseEnter={(e) => { if (justRated !== s.key) { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.background = '#f0f9ff'; } }}
              onMouseLeave={(e) => { if (justRated !== s.key) { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fafbfc'; } }}
            >
              <span style={{ fontSize: 22 }}>{justRated === s.key ? '✓' : s.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: justRated === s.key ? '#16a34a' : '#6b7280' }}>{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Rating 1-5 when signal is active */}
      {activeSignal && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{SIGNAL_META[activeSignal]?.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
              {SIGNAL_META[activeSignal]?.label}
            </span>
            <button
              onClick={() => setActiveSignal(null)}
              style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4 }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map(v => (
              <button
                key={v}
                onClick={() => submitRating(v)}
                onMouseEnter={() => setHoveredValue(v)}
                onMouseLeave={() => setHoveredValue(null)}
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  border: `1.5px solid ${hoveredValue === v ? '#0ea5e9' : '#e5e7eb'}`,
                  background: hoveredValue === v ? '#f0f9ff' : '#fff',
                  color: '#374151', fontSize: 18, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 280, margin: '6px auto 0', padding: '0 4px' }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>← {SIGNAL_META[activeSignal]?.lowLabel}</span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{SIGNAL_META[activeSignal]?.highLabel} →</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Quick Tip Input ──
function QuickTipInput({ rinkId, context, onSummaryUpdate }: { rinkId: string; context: string; onSummaryUpdate: (s: RinkSummary) => void }) {
  const { isLoggedIn, openAuth } = useAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const pendingSubmitRef = useRef<string | null>(null);

  // Replay pending action when user logs in
  useEffect(() => {
    if (isLoggedIn && pendingSubmitRef.current) {
      const pendingText = pendingSubmitRef.current;
      pendingSubmitRef.current = null;
      setText(pendingText);
      setTimeout(() => submitWithText(pendingText), 0);
    }
  }, [isLoggedIn]);

  async function submitWithText(tipText: string) {
    if (!tipText.trim()) return;
    setSubmitting(true);
    const contributorType = storage.getContributorType();
    const { data } = await apiPost<{ summary?: RinkSummary }>('/contributions', {
      rink_id: rinkId,
      kind: 'one_thing_tip',
      contributor_type: contributorType,
      context: context,
      one_thing_tip: { text: tipText.trim() },
    });
    if (data?.summary) onSummaryUpdate(data.summary);
    setText('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    setSubmitting(false);
  }

  async function submit() {
    if (!text.trim() || submitting) return;
    if (!isLoggedIn) {
      pendingSubmitRef.current = text.trim();
      openAuth();
      return;
    }
    setSubmitting(true);
    const contributorType = storage.getContributorType();
    const { data } = await apiPost<{ summary?: RinkSummary }>('/contributions', {
      rink_id: rinkId,
      kind: 'one_thing_tip',
      contributor_type: contributorType,
      context: context,
      one_thing_tip: { text: text.trim() },
    });
    if (data?.summary) onSummaryUpdate(data.summary);
    setText('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
    setSubmitting(false);
  }

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
        <span style={{ fontSize: 16 }}>✓</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>Tip added — thanks!</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>💬</span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="One thing parents should know..."
        maxLength={140}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        style={{
          flex: 1, fontSize: 14, padding: '10px 14px',
          border: '1px solid #e5e7eb', borderRadius: 10,
          outline: 'none', fontFamily: 'inherit', color: '#111827',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
      />
      <button
        onClick={submit}
        disabled={!text.trim() || submitting}
        style={{
          fontSize: 13, fontWeight: 600,
          color: text.trim() ? '#fff' : '#9ca3af',
          background: text.trim() ? '#111827' : '#e5e7eb',
          border: 'none', borderRadius: 10, padding: '10px 18px',
          cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'all 0.2s', opacity: submitting ? 0.5 : 1,
        }}
      >
        Add
      </button>
    </div>
  );
}

// ── Contribution Form (inline, 2-step) ──
export function ContributeSection({ rinkId, onSummaryUpdate }: { rinkId: string; onSummaryUpdate: (s: RinkSummary) => void }) {
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
      setTimeout(() => {
        reset();
        setSuccess(false);
      }, 2000);
    }
    setLoading(false);
  }

  // Success state
  if (success) {
    return (
      <div style={{
        background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16,
        padding: 28, textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#16a34a', margin: 0 }}>Thanks for sharing!</p>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          The summary has been updated. Your contribution helps the next family headed here.
        </p>
      </div>
    );
  }

  // Idle state
  if (mode === 'idle') {
    return (
      <div ref={formRef}>
        <h3 style={{
          fontSize: 13, fontWeight: 600, color: '#9ca3af',
          textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
        }}>
          Share what you know
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setMode('tip')}
            style={{
              flex: 1, padding: '20px 16px', background: '#fff',
              border: '1px solid #e5e7eb', borderRadius: 14, cursor: 'pointer',
              textAlign: 'center', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Drop a tip</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>&ldquo;Park behind building 2&rdquo;</div>
          </button>
          <button
            onClick={() => setMode('signal')}
            style={{
              flex: 1, padding: '20px 16px', background: '#fff',
              border: '1px solid #e5e7eb', borderRadius: 14, cursor: 'pointer',
              textAlign: 'center', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>📊</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Rate a signal</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Parking, cold, food...</div>
          </button>
        </div>
      </div>
    );
  }

  // Active contribution form
  return (
    <div ref={formRef} style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
          {mode === 'signal' ? 'Rate a signal' : 'One thing to know'}
        </h3>
        <button
          onClick={reset}
          style={{
            fontSize: 12, color: '#9ca3af', background: 'none', border: 'none',
            cursor: 'pointer', padding: '4px 8px',
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          {contributorType === 'visiting_parent' ? "I'm visiting" : 'I play here regularly'}
        </span>
        <button
          onClick={() => setContributorType(contributorType === 'visiting_parent' ? 'local_parent' : 'visiting_parent')}
          style={{
            fontSize: 11, color: '#0ea5e9', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, textDecoration: 'underline',
          }}
        >
          Change
        </button>
      </div>

      {mode === 'signal' && (
        <>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              {selectedSignal ? '1. Signal' : '1. Pick a signal'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SIGNAL_OPTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => { setSelectedSignal(s.key); setSignalValue(null); }}
                  style={{
                    fontSize: 13, padding: '10px 16px', borderRadius: 12,
                    border: `1.5px solid ${selectedSignal === s.key ? '#0ea5e9' : '#e5e7eb'}`,
                    background: selectedSignal === s.key ? '#f0f9ff' : '#fff',
                    color: selectedSignal === s.key ? '#0ea5e9' : '#374151',
                    cursor: 'pointer', fontWeight: selectedSignal === s.key ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {selectedSignal && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#9ca3af', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                2. Rate it
              </p>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map((v) => {
                  const active = signalValue === v;
                  const hov = hoveredValue === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setSignalValue(v)}
                      onMouseEnter={() => setHoveredValue(v)}
                      onMouseLeave={() => setHoveredValue(null)}
                      style={{
                        width: 52, height: 52, borderRadius: 12,
                        border: `1.5px solid ${active ? '#0ea5e9' : hov ? '#93c5fd' : '#e5e7eb'}`,
                        background: active ? '#0ea5e9' : hov ? '#f0f9ff' : '#fff',
                        color: active ? '#fff' : '#374151',
                        fontSize: 18, fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingLeft: 4, paddingRight: 4 }}>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
                  ← {SIGNAL_META[selectedSignal]?.lowLabel || 'Low'}
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
                  {SIGNAL_META[selectedSignal]?.highLabel || 'High'} →
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'tip' && (
        <div style={{ marginBottom: 20 }}>
          <textarea
            value={tipText}
            onChange={(e) => setTipText(e.target.value)}
            placeholder="One thing parents should know about this rink..."
            maxLength={140}
            rows={3}
            style={{
              width: '100%', fontSize: 14, border: '1px solid #e5e7eb',
              borderRadius: 12, padding: '14px 16px',
              outline: 'none', resize: 'none',
              fontFamily: 'inherit', color: '#111827',
              lineHeight: 1.5,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.1)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <span style={{
              fontSize: 11,
              color: tipText.length > 120 ? '#f59e0b' : '#9ca3af',
              fontWeight: tipText.length > 130 ? 600 : 400,
            }}>
              {tipText.length}/140
            </span>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          fontSize: 13, color: '#dc2626', background: '#fef2f2',
          padding: '8px 12px', borderRadius: 8, marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || (mode === 'signal' ? !(selectedSignal && signalValue) : !tipText.trim())}
        style={{
          width: '100%', padding: '14px 20px',
          fontSize: 14, fontWeight: 600,
          background: (mode === 'signal' ? (selectedSignal && signalValue) : tipText.trim()) ? '#111827' : '#e5e7eb',
          color: (mode === 'signal' ? (selectedSignal && signalValue) : tipText.trim()) ? '#fff' : '#9ca3af',
          border: 'none', borderRadius: 12, cursor: 'pointer',
          transition: 'all 0.2s',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
}

// ── Rate & Contribute — main flow ──
export function RateAndContribute({ rinkId, rinkName, onSummaryUpdate }: { rinkId: string; rinkName: string; onSummaryUpdate: (s: RinkSummary) => void }) {
  const { isLoggedIn } = useAuth();
  const [phase, setPhase] = useState<'button' | 'verify' | 'context' | 'rate' | 'tip' | 'done_rate' | 'done_tip'>('button');
  const [botAnswer, setBotAnswer] = useState('');
  const verifyNum = useRef(Math.floor(Math.random() * 5) + 2);
  const [ratingContext, setRatingContext] = useState<'tournament' | 'regular' | null>(null);
  const [pendingFlow, setPendingFlow] = useState<'rate' | 'tip'>('rate');
  const [hasRated, setHasRated] = useState(false);

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
    if (parseInt(botAnswer) === verifyNum.current + 3) setPhase('context');
  }

  function selectContext(ctx: 'tournament' | 'regular') {
    setRatingContext(ctx);
    storage.setRatingContext(ctx);
    setPhase(pendingFlow);
  }

  function startFlow(flow: 'rate' | 'tip') {
    setPendingFlow(flow);
    if (hasRated && flow === 'rate') return;
    if (isLoggedIn) {
      const savedCtx = storage.getRatingContext() as 'tournament' | 'regular' | null;
      if (savedCtx) {
        setRatingContext(savedCtx);
        setPhase(flow);
      } else {
        setPhase('context');
      }
    } else {
      setPhase('verify');
    }
  }

  if (phase === 'button') {
    return (
      <section style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => startFlow('rate')} style={{
            flex: 1, padding: '16px 20px',
            background: hasRated ? '#f0fdf4' : '#fff',
            color: hasRated ? '#16a34a' : '#111827',
            border: hasRated ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
            borderRadius: 14, cursor: hasRated ? 'default' : 'pointer',
            fontSize: 15, fontWeight: 600, transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={(e) => { if (!hasRated) e.currentTarget.style.borderColor = '#0ea5e9'; }}
          onMouseLeave={(e) => { if (!hasRated) e.currentTarget.style.borderColor = '#e5e7eb'; }}
          >
            {hasRated ? <><span>✓</span> Rated</> : <><span>📊</span> Rate it</>}
          </button>
          <button onClick={() => startFlow('tip')} style={{
            flex: 1, padding: '16px 20px', background: '#fff', color: '#111827',
            border: '1px solid #e5e7eb', borderRadius: 14, cursor: 'pointer',
            fontSize: 15, fontWeight: 600, transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
          >
            <span>💬</span> Drop a tip
          </button>
        </div>
        {hasRated && (
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, textAlign: 'center' }}>
            You&apos;ve already rated this rink. You can still drop tips.
          </p>
        )}
      </section>
    );
  }

  if (phase === 'verify') {
    return (
      <section style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Quick check</p>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>What is {verifyNum.current} + 3?</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', maxWidth: 200, margin: '12px auto 0' }}>
          <input value={botAnswer} onChange={(e) => setBotAnswer(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') checkBot(); }} placeholder="?" autoFocus
            style={{ width: 60, fontSize: 18, fontWeight: 700, textAlign: 'center', padding: '8px', border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', fontFamily: 'inherit', color: '#111827' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
          />
          <button onClick={checkBot} style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: '#111827', border: 'none', borderRadius: 10, padding: '8px 20px', cursor: 'pointer' }}>Go</button>
        </div>
      </section>
    );
  }

  if (phase === 'context') {
    return (
      <section style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>When were you here?</p>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Helps parents filter by context</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
          {([['tournament', '🏆', 'Tournament', 'Weekend event'], ['regular', '📅', 'Regular season', 'League or practice']] as const).map(([key, icon, title, sub]) => (
            <button key={key} onClick={() => selectContext(key as 'tournament' | 'regular')} style={{
              flex: 1, maxWidth: 180, padding: '14px 16px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = key === 'tournament' ? '#f59e0b' : '#0ea5e9'; e.currentTarget.style.background = key === 'tournament' ? '#fffbeb' : '#f0f9ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{title}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (phase === 'rate') {
    return (
      <section style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '8px 24px', background: ratingContext === 'tournament' ? '#fffbeb' : '#f0f9ff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['tournament', 'regular'] as const).map(ctx => (
              <button
                key={ctx}
                onClick={() => { setRatingContext(ctx); storage.setRatingContext(ctx); }}
                style={{
                  fontSize: 11, fontWeight: ratingContext === ctx ? 600 : 400,
                  padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: ratingContext === ctx ? (ctx === 'tournament' ? '#fde68a' : '#bae6fd') : 'transparent',
                  color: ratingContext === ctx ? (ctx === 'tournament' ? '#92400e' : '#1e40af') : '#9ca3af',
                  transition: 'all 0.15s',
                }}
              >
                {ctx === 'tournament' ? '🏆 Tournament' : '📅 Regular'}
              </button>
            ))}
          </div>
          <VisitorToggle />
        </div>
        <div style={{ padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Rate the signals</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Tap one, then rate 1-5</span>
          </div>
          <QuickVoteRow rinkId={rinkId} context={ratingContext || ''} onSummaryUpdate={onSummaryUpdate} />
        </div>
        <div style={{ padding: '12px 24px 16px', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={() => { markRated(); setPhase('done_rate'); }} style={{
            width: '100%', padding: '13px 20px', fontSize: 14, fontWeight: 600, background: '#111827', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1f2937'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#111827'; }}
          >
            Submit rating
          </button>
        </div>
      </section>
    );
  }

  if (phase === 'tip') {
    return (
      <section style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '8px 24px', background: ratingContext === 'tournament' ? '#fffbeb' : '#f0f9ff', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['tournament', 'regular'] as const).map(ctx => (
              <button
                key={ctx}
                onClick={() => { setRatingContext(ctx); storage.setRatingContext(ctx); }}
                style={{
                  fontSize: 11, fontWeight: ratingContext === ctx ? 600 : 400,
                  padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: ratingContext === ctx ? (ctx === 'tournament' ? '#fde68a' : '#bae6fd') : 'transparent',
                  color: ratingContext === ctx ? (ctx === 'tournament' ? '#92400e' : '#1e40af') : '#9ca3af',
                  transition: 'all 0.15s',
                }}
              >
                {ctx === 'tournament' ? '🏆 Tournament' : '📅 Regular'}
              </button>
            ))}
          </div>
          <VisitorToggle />
        </div>
        <div style={{ padding: '18px 24px' }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Drop a tip</span>
            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>What should parents know?</span>
          </div>
          <QuickTipInput rinkId={rinkId} context={ratingContext || ''} onSummaryUpdate={onSummaryUpdate} />
        </div>
        <div style={{ padding: '12px 24px 16px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          {!hasRated ? (
            <button onClick={() => setPhase('rate')} style={{ fontSize: 13, fontWeight: 500, color: '#0ea5e9', background: 'none', border: 'none', cursor: 'pointer' }}>
              📊 Rate the rink too →
            </button>
          ) : (
            <button onClick={() => setPhase('button')} style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>← Done</button>
          )}
        </div>
      </section>
    );
  }

  if (phase === 'done_rate') {
    return (
      <section style={{ marginTop: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#16a34a', margin: 0 }}>Rating submitted</p>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Thanks — this helps other hockey parents.</p>
        <button onClick={() => setPhase('tip')} style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: '#111827', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 24px', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
        >💬 Drop a tip?</button>
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setPhase('button')} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>Done</button>
        </div>
      </section>
    );
  }

  if (phase === 'done_tip') {
    return (
      <section style={{ marginTop: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#16a34a', margin: 0 }}>Tip added</p>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Thanks for sharing what you know.</p>
        {!hasRated && (
          <button onClick={() => setPhase('rate')} style={{ marginTop: 14, fontSize: 14, fontWeight: 600, color: '#111827', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 24px', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
          >📊 Rate the rink too</button>
        )}
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setPhase('button')} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>Done</button>
        </div>
      </section>
    );
  }

  return null;
}
