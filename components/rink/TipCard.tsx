'use client';

import { useState, useEffect } from 'react';
import { Tip } from '../../lib/rinkTypes';
import { MANAGER_RESPONSES } from '../../lib/seedData';
import { timeAgo } from '../../lib/rinkHelpers';
import { storage } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import { colors, text, radius } from '../../lib/theme';

export function TipCard({ tip, tipIndex, rinkSlug }: { tip: Tip; tipIndex: number; rinkSlug: string }) {
  const { isLoggedIn, openAuth } = useAuth();
  const isLocal = tip.contributor_type === 'local_parent';
  const response = tip.operator_response || MANAGER_RESPONSES[rinkSlug]?.[tipIndex];
  const [expanded, setExpanded] = useState(false);
  const [isMyTip, setIsMyTip] = useState(false);

  useEffect(() => {
    const myTips = storage.getMyTips();
    const match = myTips.some(t => t.text === tip.text);
    setIsMyTip(match);
  }, [tip.text]);

  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [score, setScore] = useState(0);
  const [flagged, setFlagged] = useState(false);
  const [showFlagConfirm, setShowFlagConfirm] = useState(false);

  useEffect(() => {
    const saved = storage.getTipVote(rinkSlug, tipIndex);
    if (saved.vote !== null) {
      setUserVote(saved.vote as 'up' | 'down');
      setScore(saved.score);
    } else {
      const seeded = (tipIndex === 0 ? 12 : tipIndex === 1 ? 8 : tipIndex === 2 ? 5 : Math.floor(Math.random() * 6) + 1);
      setScore(seeded);
    }
    // Check if tip was previously flagged
    try {
      const flagKey = `coldstart_tip_flag_${rinkSlug}_${tipIndex}`;
      if (localStorage.getItem(flagKey)) setFlagged(true);
    } catch {}
  }, [rinkSlug, tipIndex]);

  async function handleFlag(e: React.MouseEvent) {
    e.stopPropagation();
    if (flagged) return;

    setFlagged(true);
    setShowFlagConfirm(true);
    setTimeout(() => setShowFlagConfirm(false), 3000);

    // Persist to server if tip has an ID
    if (tip.id) {
      try {
        await fetch(`/api/v1/tips/${tip.id}/flag`, { method: 'POST' });
      } catch {
        // Flag is shown optimistically; server failure is non-blocking
      }
    }

    // Keep localStorage as fallback for UI state across reloads
    try {
      localStorage.setItem(`coldstart_tip_flag_${rinkSlug}_${tipIndex}`, new Date().toISOString());
    } catch {}
  }

  function handleVote(direction: 'up' | 'down', e: React.MouseEvent) {
    e.stopPropagation();
    if (!isLoggedIn) { openAuth(); return; }

    let newVote: 'up' | 'down' | null = direction;
    let newScore = score;

    if (userVote === direction) {
      newVote = null;
      newScore += direction === 'up' ? -1 : 1;
    } else if (userVote === null) {
      newScore += direction === 'up' ? 1 : -1;
    } else {
      newScore += direction === 'up' ? 2 : -2;
    }

    setUserVote(newVote);
    setScore(newScore);
    storage.setTipVote(rinkSlug, tipIndex, { vote: newVote, score: newScore });
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      style={{
        padding: '10px 14px',
        background: colors.surface,
        border: `1px solid ${colors.borderLight}`,
        borderRadius: radius.lg,
        marginBottom: 6,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onClick={() => setExpanded(!expanded)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.borderDefault; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Vote buttons */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 0, flexShrink: 0, minWidth: 28,
        }}>
          <button
            onClick={(e) => handleVote('up', e)}
            aria-label="Helpful"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 10px', minHeight: 44, minWidth: 44,
              fontSize: text.base, lineHeight: 1,
              color: userVote === 'up' ? colors.brand : colors.textDisabled,
              transition: 'color 0.15s',
            }}
          >▲</button>
          <span style={{
            fontSize: text.sm, fontWeight: 700, lineHeight: 1,
            color: score > 0 ? colors.textPrimary : score < 0 ? colors.error : colors.textMuted,
          }}>{score}</span>
          <button
            onClick={(e) => handleVote('down', e)}
            aria-label="Not helpful"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 10px', minHeight: 44, minWidth: 44,
              fontSize: text.base, lineHeight: 1,
              color: userVote === 'down' ? colors.error : colors.textDisabled,
              transition: 'color 0.15s',
            }}
          >▼</button>
        </div>

        {/* Tip content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: text.md, color: colors.textSecondary, lineHeight: 1.5, margin: 0 }}>
                &ldquo;{tip.text}&rdquo;
              </p>
              {!expanded && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <span style={{
                    fontSize: text['2xs'], fontWeight: 500, padding: '1px 6px',
                    borderRadius: 6, display: 'inline-block',
                    background: isLocal ? colors.indigoBg : colors.purpleBg,
                    color: isLocal ? colors.indigo : colors.purple,
                  }}>
                    {isLocal ? 'Local' : 'Visitor'}
                  </span>
                  {tip.contributor_name && (
                    <a
                      href={tip.user_id ? `/profile/${tip.user_id}` : undefined}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        fontSize: text['2xs'], fontWeight: 500, color: colors.textMuted,
                        textDecoration: tip.user_id ? 'underline' : 'none',
                        textUnderlineOffset: 2, cursor: tip.user_id ? 'pointer' : 'default',
                      }}
                    >
                      {tip.contributor_name}
                    </a>
                  )}
                  {tip.context === 'tournament' && (
                    <span style={{
                      fontSize: text['2xs'], fontWeight: 600, padding: '1px 6px',
                      borderRadius: 6, display: 'inline-block',
                      background: colors.bgWarning, color: colors.amber,
                    }}>
                      {'\u{1F3C6}'} Tournament
                    </span>
                  )}
                  {tip.contributor_badge && (
                    <span style={{
                      fontSize: text['2xs'], fontWeight: 600, padding: '1px 6px',
                      borderRadius: 6, display: 'inline-block',
                      background: colors.bgSuccess, color: colors.success,
                    }}>
                      {tip.contributor_badge}
                    </span>
                  )}
                  {isMyTip && (
                    <span style={{
                      fontSize: text['2xs'], fontWeight: 600, padding: '1px 6px',
                      borderRadius: 6, display: 'inline-block',
                      background: colors.bgSuccess, color: colors.success,
                    }}>
                      Your tip
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {response && <span style={{ fontSize: text['2xs'], color: colors.brandAccent }}>💬</span>}
              <span style={{
                fontSize: text['2xs'], color: colors.textMuted,
                transform: expanded ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s', display: 'inline-block',
              }}>
                ▸
              </span>
            </div>
          </div>
          {expanded && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${colors.borderLight}` }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: text['2xs'], fontWeight: 500, padding: '2px 8px',
                  borderRadius: radius.lg,
                  background: isLocal ? colors.indigoBg : colors.purpleBg,
                  color: isLocal ? colors.indigo : colors.purple,
                }}>
                  {isLocal ? 'Plays here regularly' : 'Visiting parent'}
                </span>
                {isMyTip && (
                  <span style={{
                    fontSize: text['2xs'], fontWeight: 600, padding: '2px 8px',
                    borderRadius: radius.lg,
                    background: colors.bgSuccess, color: colors.success,
                  }}>
                    Your tip
                  </span>
                )}
                <span style={{ fontSize: text['2xs'], color: colors.textMuted }}>{timeAgo(tip.created_at)}</span>
              </div>
              {response && (
                <div style={{
                  marginTop: 8, padding: '8px 10px',
                  background: colors.indigoBg, border: `1px solid ${colors.indigoBorder}`,
                  borderRadius: radius.md, borderLeft: `3px solid ${colors.brandAccent}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                      background: colors.brandAccent, color: colors.textInverse, textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>
                      Verified
                    </span>
                    <span style={{ fontSize: text['2xs'], fontWeight: 600, color: colors.indigo }}>{response.name}</span>
                    <span style={{ fontSize: text['2xs'], color: colors.textTertiary }}>· {response.role}</span>
                  </div>
                  <p style={{ fontSize: text.sm, color: colors.indigo, lineHeight: 1.45, margin: 0 }}>
                    {response.text}
                  </p>
                </div>
              )}
              {/* Flag / report button */}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={handleFlag}
                  aria-label={flagged ? 'Tip flagged' : 'Flag this tip'}
                  style={{
                    fontSize: text['2xs'], color: flagged ? colors.textMuted : colors.textTertiary,
                    background: 'none', border: 'none', cursor: flagged ? 'default' : 'pointer',
                    padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4,
                    borderRadius: 6, transition: 'color 0.15s',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{flagged ? '🚩' : '⚑'}</span>
                  {flagged ? 'Flagged' : 'Flag'}
                </button>
                {showFlagConfirm && (
                  <span style={{ fontSize: text['2xs'], color: colors.success, fontWeight: 500 }}>
                    Thanks for the feedback.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
