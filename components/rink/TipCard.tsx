'use client';

import { useState, useEffect } from 'react';
import { Tip } from '../../lib/rinkTypes';
import { MANAGER_RESPONSES } from '../../lib/seedData';
import { timeAgo } from '../../lib/rinkHelpers';
import { storage } from '../../lib/storage';

export function TipCard({ tip, tipIndex, rinkSlug, isLoggedIn, onAuthRequired }: { tip: Tip; tipIndex: number; rinkSlug: string; isLoggedIn: boolean; onAuthRequired: () => void }) {
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
    if (!isLoggedIn) { onAuthRequired(); return; }

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
      style={{
        padding: '10px 14px',
        background: '#fff',
        border: '1px solid #f1f5f9',
        borderRadius: 10,
        marginBottom: 6,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#f1f5f9'; }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Vote buttons */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 0, flexShrink: 0, minWidth: 28,
        }}>
          <button
            onClick={(e) => handleVote('up', e)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
              fontSize: 14, lineHeight: 1,
              color: userVote === 'up' ? '#0ea5e9' : '#d1d5db',
              transition: 'color 0.15s',
            }}
            title="Helpful"
          >▲</button>
          <span style={{
            fontSize: 12, fontWeight: 700, lineHeight: 1,
            color: score > 0 ? '#111827' : score < 0 ? '#ef4444' : '#9ca3af',
          }}>{score}</span>
          <button
            onClick={(e) => handleVote('down', e)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
              fontSize: 14, lineHeight: 1,
              color: userVote === 'down' ? '#ef4444' : '#d1d5db',
              transition: 'color 0.15s',
            }}
            title="Not helpful"
          >▼</button>
        </div>

        {/* Tip content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, margin: 0, flex: 1 }}>
              &ldquo;{tip.text}&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {response && <span style={{ fontSize: 10, color: '#3b82f6' }}>💬</span>}
              <span style={{
                fontSize: 10, color: '#9ca3af',
                transform: expanded ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s', display: 'inline-block',
              }}>
                ▸
              </span>
            </div>
          </div>
          {expanded && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{
                  fontSize: 10, fontWeight: 500, padding: '2px 8px',
                  borderRadius: 10,
                  background: isLocal ? '#eff6ff' : '#faf5ff',
                  color: isLocal ? '#2563eb' : '#7c3aed',
                }}>
                  {isLocal ? 'Plays here regularly' : 'Visiting parent'}
                </span>
                {tip.context && (
                  <span style={{
                    fontSize: 10, fontWeight: 500, padding: '2px 8px',
                    borderRadius: 10,
                    background: tip.context === 'tournament' ? '#fffbeb' : '#f0fdf4',
                    color: tip.context === 'tournament' ? '#d97706' : '#16a34a',
                  }}>
                    {tip.context === 'tournament' ? '🏆 Tournament' : '📅 Regular season'}
                  </span>
                )}
                <span style={{ fontSize: 10, color: '#9ca3af' }}>{timeAgo(tip.created_at)}</span>
              </div>
              {response && (
                <div style={{
                  marginTop: 8, padding: '8px 10px',
                  background: '#eff6ff', border: '1px solid #bfdbfe',
                  borderRadius: 8, borderLeft: '3px solid #3b82f6',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                      background: '#3b82f6', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>
                      Verified
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#1e40af' }}>{response.name}</span>
                    <span style={{ fontSize: 10, color: '#6b7280' }}>· {response.role}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.45, margin: 0 }}>
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
