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
  const response = MANAGER_RESPONSES[rinkSlug]?.[tipIndex];
  const [expanded, setExpanded] = useState(false);

  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const saved = storage.getTipVote(rinkSlug, tipIndex);
    if (saved.vote !== null) {
      setUserVote(saved.vote as 'up' | 'down');
      setScore(saved.score);
    } else {
      const seeded = (tipIndex === 0 ? 12 : tipIndex === 1 ? 8 : tipIndex === 2 ? 5 : Math.floor(Math.random() * 6) + 1);
      setScore(seeded);
    }
  }, [rinkSlug, tipIndex]);

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
      style={{
        padding: '10px 14px',
        background: colors.white,
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
            <p style={{ fontSize: text.md, color: colors.textSecondary, lineHeight: 1.5, margin: 0, flex: 1 }}>
              &ldquo;{tip.text}&rdquo;
            </p>
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{
                  fontSize: text['2xs'], fontWeight: 500, padding: '2px 8px',
                  borderRadius: radius.lg,
                  background: isLocal ? colors.indigoBg : colors.purpleBg,
                  color: isLocal ? '#2563eb' : colors.purple,
                }}>
                  {isLocal ? 'Plays here regularly' : 'Visiting parent'}
                </span>
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
                      background: colors.brandAccent, color: colors.white, textTransform: 'uppercase', letterSpacing: 0.5,
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
