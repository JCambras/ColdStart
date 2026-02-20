'use client';

import { useState, useEffect } from 'react';
import { NearbyPlace } from '../../lib/seedData';
import { storage, FanFavorite, PlaceSuggestion } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import { colors, text, radius } from '../../lib/theme';

const FAN_FAV_CATEGORIES = ['Quick bite', 'Coffee', 'Team Restaurants', 'Other'] as const;

export interface NearbyCategory {
  label: string;
  icon: string;
  description: string;
  places: NearbyPlace[];
  partnerPlaces?: NearbyPlace[];
}

// Sanitize place names for storage keys
function cleanName(name: string) {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
}

// ── Compact vote buttons for a place ──
function PlaceVoteButtons({ rinkSlug, placeName, score, userVote, onVote }: {
  rinkSlug: string;
  placeName: string;
  score: number;
  userVote: 'up' | 'down' | null;
  onVote: (direction: 'up' | 'down') => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }} onClick={(e) => e.preventDefault()}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onVote('up'); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
          fontSize: 12, lineHeight: 1,
          color: userVote === 'up' ? colors.brand : colors.textDisabled,
          transition: 'color 0.15s',
        }}
        title="Thumbs up"
      >👍</button>
      <span style={{
        fontSize: text.xs, fontWeight: 700, lineHeight: 1, minWidth: 16, textAlign: 'center',
        color: score > 0 ? colors.textPrimary : score < 0 ? colors.error : colors.textMuted,
      }}>{score}</span>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onVote('down'); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
          fontSize: 12, lineHeight: 1,
          color: userVote === 'down' ? colors.error : colors.textDisabled,
          transition: 'color 0.15s',
        }}
        title="Thumbs down"
      >👎</button>
    </div>
  );
}

// ── Suggest a place form ──
function SuggestPlaceForm({ rinkSlug, categoryKey, onSubmit }: {
  rinkSlug: string;
  categoryKey: string;
  onSubmit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');

  const { currentUser } = useAuth();

  function handleSubmit() {
    if (!name.trim()) return;
    const suggestion: PlaceSuggestion = {
      name: name.trim(),
      comment: comment.trim(),
      author: currentUser?.name || 'Hockey parent',
      date: new Date().toISOString(),
    };
    const existing = storage.getPlaceSuggestions(rinkSlug, categoryKey);
    storage.setPlaceSuggestions(rinkSlug, categoryKey, [...existing, suggestion]);
    setName('');
    setComment('');
    setOpen(false);
    onSubmit();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          marginTop: 10, fontSize: text.sm, fontWeight: 500,
          color: colors.brand, background: 'none', border: `1px dashed ${colors.brandLight}`,
          borderRadius: radius.md, padding: '8px 14px', cursor: 'pointer',
          width: '100%',
        }}
      >
        + Suggest a place
      </button>
    );
  }

  return (
    <div style={{
      marginTop: 10, padding: '12px', borderRadius: radius.lg,
      background: colors.white, border: `1px solid ${colors.borderMedium}`,
    }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Tony's Pizza"
        autoFocus
        style={{
          width: '100%', padding: '8px 10px', fontSize: text.sm,
          border: `1px solid ${colors.borderDefault}`, borderRadius: radius.md,
          outline: 'none', boxSizing: 'border-box',
        }}
      />
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 140))}
        placeholder="What makes it great? (optional)"
        style={{
          width: '100%', padding: '8px 10px', fontSize: text.sm, marginTop: 8,
          border: `1px solid ${colors.borderDefault}`, borderRadius: radius.md,
          outline: 'none', boxSizing: 'border-box',
        }}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          style={{
            fontSize: text.sm, fontWeight: 600, color: colors.white,
            background: name.trim() ? colors.brand : colors.textDisabled,
            border: 'none', borderRadius: radius.md, padding: '8px 16px',
            cursor: name.trim() ? 'pointer' : 'default',
          }}
        >
          Submit
        </button>
        <button
          onClick={() => { setOpen(false); setName(''); setComment(''); }}
          style={{ fontSize: text.sm, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function FanFavoritesCategory({ rinkSlug, expanded, onToggle }: { rinkSlug: string; expanded: boolean; onToggle: () => void }) {
  const [favorites, setFavorites] = useState<FanFavorite[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [review, setReview] = useState('');
  const [category, setCategory] = useState<string>(FAN_FAV_CATEGORIES[0]);

  useEffect(() => {
    setFavorites(storage.getFanFavorites(rinkSlug));
  }, [rinkSlug]);

  const { currentUser } = useAuth();

  function handleSubmit() {
    if (!name.trim() || !review.trim()) return;
    const newFav: FanFavorite = {
      name: name.trim(),
      review: review.trim(),
      category,
      author: currentUser?.name || 'Hockey parent',
      date: new Date().toISOString(),
    };
    const updated = [...favorites, newFav];
    storage.setFanFavorites(rinkSlug, updated);
    setFavorites(updated);
    setName('');
    setReview('');
    setCategory(FAN_FAV_CATEGORIES[0]);
    setShowForm(false);
  }

  return (
    <div>
      <div
        onClick={onToggle}
        style={{
          padding: '14px 20px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'background 0.1s',
          background: expanded ? '#f8fafc' : colors.white,
        }}
        onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.background = colors.bgPage; }}
        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.background = colors.white; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⭐</span>
          <div>
            <div style={{ fontSize: text.base, fontWeight: 600, color: colors.textPrimary }}>
              Fan Favorites
              <span style={{ fontSize: text.sm, fontWeight: 400, color: colors.textMuted, marginLeft: 6 }}>
                {favorites.length} spot{favorites.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ fontSize: text.sm, color: colors.textMuted, marginTop: 1 }}>Parent-recommended spots</div>
          </div>
        </div>
        <span style={{
          fontSize: text.sm, color: colors.textMuted,
          transform: expanded ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.2s',
        }}>
          ▸
        </span>
      </div>
      {expanded && (
        <div style={{ padding: '0 20px 16px', background: '#f8fafc' }}>
          {favorites.map((fav, i) => (
            <div key={i} style={{
              marginTop: 8, padding: '10px 12px', borderRadius: radius.lg,
              background: colors.white, border: `1px solid ${colors.borderDefault}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: text.md, fontWeight: 500, color: colors.textPrimary }}>{fav.name}</div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                  background: colors.brandBg, color: colors.brandDark, textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {fav.category}
                </span>
              </div>
              <div style={{ fontSize: text.sm, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' }}>
                &ldquo;{fav.review}&rdquo;
              </div>
              <div style={{ fontSize: text.xs, color: colors.textMuted, marginTop: 4 }}>
                — {fav.author}
              </div>
            </div>
          ))}
          {showForm ? (
            <div style={{
              marginTop: 8, padding: '12px', borderRadius: radius.lg,
              background: colors.white, border: `1px solid ${colors.borderMedium}`,
            }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tony's Pizza"
                autoFocus
                style={{
                  width: '100%', padding: '8px 10px', fontSize: text.sm,
                  border: `1px solid ${colors.borderDefault}`, borderRadius: radius.md,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value.slice(0, 140))}
                placeholder="What makes it great?"
                rows={2}
                style={{
                  width: '100%', padding: '8px 10px', fontSize: text.sm, marginTop: 8,
                  border: `1px solid ${colors.borderDefault}`, borderRadius: radius.md,
                  outline: 'none', resize: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ fontSize: text.xs, color: colors.textMuted, textAlign: 'right', marginTop: 2 }}>
                {review.length}/140
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', fontSize: text.sm, marginTop: 4,
                  border: `1px solid ${colors.borderDefault}`, borderRadius: radius.md,
                  outline: 'none', background: colors.white, boxSizing: 'border-box',
                }}
              >
                {FAN_FAV_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={handleSubmit}
                  disabled={!name.trim() || !review.trim()}
                  style={{
                    fontSize: text.sm, fontWeight: 600, color: colors.white,
                    background: name.trim() && review.trim() ? colors.brand : colors.textDisabled,
                    border: 'none', borderRadius: radius.md, padding: '8px 16px',
                    cursor: name.trim() && review.trim() ? 'pointer' : 'default',
                  }}
                >
                  Submit
                </button>
                <button
                  onClick={() => { setShowForm(false); setName(''); setReview(''); setCategory(FAN_FAV_CATEGORIES[0]); }}
                  style={{ fontSize: text.sm, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              style={{
                marginTop: 8, fontSize: text.sm, fontWeight: 500,
                color: colors.brand, background: 'none', border: `1px dashed ${colors.brandLight}`,
                borderRadius: radius.md, padding: '8px 14px', cursor: 'pointer',
                width: '100%',
              }}
            >
              + Add your favorite
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Unified type for rendering both data places and community suggestions
interface PlaceEntry {
  name: string;
  distance?: string;
  url?: string;
  isPartner?: boolean;
  partnerNote?: string;
  isFar?: boolean;
  isSuggestion?: boolean;
  suggestionComment?: string;
  suggestionAuthor?: string;
}

export function NearbySection({ title, icon, categories, rinkSlug, fanFavorites }: { title: string; icon: string; categories: NearbyCategory[]; rinkSlug: string; fanFavorites?: boolean }) {
  const { isLoggedIn, openAuth, currentUser } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tipOpen, setTipOpen] = useState<string | null>(null);
  const [tipText, setTipText] = useState('');
  const [tipSaved, setTipSaved] = useState<string | null>(null);
  const [placeTips, setPlaceTips] = useState<Record<string, { text: string; author: string; date: string }[]>>({});
  // Vote state: keyed by sanitized place name
  const [placeVotes, setPlaceVotes] = useState<Record<string, { vote: string | null; score: number }>>({});
  // Suggestion refresh counter
  const [suggestRefresh, setSuggestRefresh] = useState(0);

  useEffect(() => {
    setPlaceTips(storage.getAllPlaceTips(rinkSlug));
  }, [rinkSlug, tipSaved]);

  // Load votes for all places across all categories + suggestions
  useEffect(() => {
    const votes: Record<string, { vote: string | null; score: number }> = {};
    categories.forEach((cat, catIdx) => {
      // Load votes for data places
      cat.places.forEach((p, j) => {
        const key = cleanName(p.name);
        const saved = storage.getPlaceVote(rinkSlug, key);
        if (saved.vote !== null || saved.score !== 0) {
          votes[key] = saved;
        } else {
          // Seed default scores
          const seeded = j === 0 ? 5 : j === 1 ? 3 : Math.floor(Math.random() * 3) + 1;
          votes[key] = { vote: null, score: seeded };
        }
      });
      // Load votes for suggestions
      const catKey = cleanName(cat.label);
      const suggestions = storage.getPlaceSuggestions(rinkSlug, catKey);
      suggestions.forEach((s) => {
        const key = cleanName(s.name);
        const saved = storage.getPlaceVote(rinkSlug, key);
        if (saved.vote !== null || saved.score !== 0) {
          votes[key] = saved;
        } else {
          votes[key] = { vote: null, score: 1 };
        }
      });
    });
    setPlaceVotes(votes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rinkSlug, suggestRefresh]);

  function handlePlaceVote(placeName: string, direction: 'up' | 'down') {
    if (!isLoggedIn) { openAuth(); return; }
    const key = cleanName(placeName);
    const current = placeVotes[key] || { vote: null, score: 0 };
    let newVote: string | null = direction;
    let newScore = current.score;

    if (current.vote === direction) {
      newVote = null;
      newScore += direction === 'up' ? -1 : 1;
    } else if (current.vote === null) {
      newScore += direction === 'up' ? 1 : -1;
    } else {
      newScore += direction === 'up' ? 2 : -2;
    }

    const updated = { vote: newVote, score: newScore };
    storage.setPlaceVote(rinkSlug, key, updated);
    setPlaceVotes(prev => ({ ...prev, [key]: updated }));
  }

  function getVoteData(placeName: string) {
    const key = cleanName(placeName);
    return placeVotes[key] || { vote: null, score: 0 };
  }

  function submitPlaceTip(placeName: string) {
    if (!isLoggedIn) { openAuth(); return; }
    if (!tipText.trim()) return;
    const cn = cleanName(placeName);
    const existing = storage.getPlaceTips(rinkSlug, cn);
    existing.push({
      text: tipText.trim(),
      author: currentUser?.name || 'Hockey parent',
      date: new Date().toISOString(),
    });
    storage.setPlaceTips(rinkSlug, cn, existing);
    setTipText('');
    setTipOpen(null);
    setTipSaved(placeName + Date.now());
  }

  function getPlaceTipsFor(placeName: string): { text: string; author: string; date: string }[] {
    const cn = cleanName(placeName);
    return placeTips[cn] || [];
  }

  // Build sorted place list for a category (data places + suggestions, sorted by votes)
  function getSortedEntries(cat: NearbyCategory): PlaceEntry[] {
    const catKey = cleanName(cat.label);
    const suggestions = storage.getPlaceSuggestions(rinkSlug, catKey);

    const entries: PlaceEntry[] = [
      ...cat.places.map(p => ({
        name: p.name,
        distance: p.distance,
        url: p.url,
        isPartner: p.isPartner,
        partnerNote: p.partnerNote,
        isFar: p.isFar,
      })),
      ...suggestions.map(s => ({
        name: s.name,
        isSuggestion: true,
        suggestionComment: s.comment,
        suggestionAuthor: s.author,
      })),
    ];

    // Sort by vote score descending
    entries.sort((a, b) => {
      const scoreA = getVoteData(a.name).score;
      const scoreB = getVoteData(b.name).score;
      return scoreB - scoreA;
    });

    return entries;
  }

  return (
    <section style={{ marginTop: 24 }}>
      <h3 style={{
        fontSize: text.md, fontWeight: 600, color: colors.textMuted,
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>{icon}</span> {title}
      </h3>
      <div style={{
        background: colors.white, border: `1px solid ${colors.borderDefault}`,
        borderRadius: 16, overflow: 'hidden',
      }}>
        {fanFavorites && (
          <>
            <FanFavoritesCategory
              rinkSlug={rinkSlug}
              expanded={expanded === '__fan_favorites__'}
              onToggle={() => setExpanded(expanded === '__fan_favorites__' ? null : '__fan_favorites__')}
            />
            <div style={{ height: 1, background: colors.borderLight }} />
          </>
        )}
        {categories.map((cat, i) => {
          const sortedEntries = expanded === cat.label ? getSortedEntries(cat) : [];
          const catKey = cleanName(cat.label);
          const suggestionCount = expanded === cat.label ? storage.getPlaceSuggestions(rinkSlug, catKey).length : 0;
          const totalCount = cat.places.length + suggestionCount;

          return (
          <div key={cat.label}>
            <div
              onClick={() => setExpanded(expanded === cat.label ? null : cat.label)}
              style={{
                padding: '14px 20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'background 0.1s',
                background: expanded === cat.label ? '#f8fafc' : colors.white,
              }}
              onMouseEnter={(e) => { if (expanded !== cat.label) e.currentTarget.style.background = colors.bgPage; }}
              onMouseLeave={(e) => { if (expanded !== cat.label) e.currentTarget.style.background = colors.white; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <div>
                  <div style={{ fontSize: text.base, fontWeight: 600, color: colors.textPrimary }}>
                    {cat.label}
                    <span style={{ fontSize: text.sm, fontWeight: 400, color: colors.textMuted, marginLeft: 6 }}>
                      {totalCount} spot{totalCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: text.sm, color: colors.textMuted, marginTop: 1 }}>{cat.description}</div>
                </div>
              </div>
              <span style={{
                fontSize: text.sm, color: colors.textMuted,
                transform: expanded === cat.label ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s',
              }}>
                ▸
              </span>
            </div>
            {expanded === cat.label && (
              <div style={{ padding: '0 20px 16px', background: '#f8fafc' }}>
                {cat.places.every(p => p.isFar) && (
                  <div style={{
                    padding: '8px 12px', marginTop: 8, borderRadius: radius.md,
                    background: colors.bgError, border: '1px solid #fecaca',
                    fontSize: text.xs, color: '#991b1b',
                  }}>
                    ⚠️ Limited options nearby — these are further from the rink
                  </div>
                )}
                {sortedEntries.map((entry, j) => {
                  const placeKey = `${cat.label}::${entry.name}`;
                  const tips = getPlaceTipsFor(entry.name);
                  const voteData = getVoteData(entry.name);

                  return (
                  <div key={`${entry.name}-${j}`} style={{ marginTop: 8 }}>
                    {entry.isSuggestion ? (
                      // Community suggestion card (no maps link)
                      <div style={{
                        padding: '10px 12px', borderRadius: radius.lg,
                        background: colors.white, border: `1px solid ${colors.borderDefault}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ fontSize: text.md, fontWeight: 500, color: colors.textPrimary }}>{entry.name}</div>
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                              background: colors.brandBg, color: colors.brandDark, textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>
                              Community pick
                            </span>
                          </div>
                          <PlaceVoteButtons
                            rinkSlug={rinkSlug}
                            placeName={entry.name}
                            score={voteData.score}
                            userVote={voteData.vote as 'up' | 'down' | null}
                            onVote={(dir) => handlePlaceVote(entry.name, dir)}
                          />
                        </div>
                        {entry.suggestionComment && (
                          <div style={{ fontSize: text.sm, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' }}>
                            &ldquo;{entry.suggestionComment}&rdquo;
                          </div>
                        )}
                        {entry.suggestionAuthor && (
                          <div style={{ fontSize: text.xs, color: colors.textMuted, marginTop: 2 }}>
                            — {entry.suggestionAuthor}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Standard place card with maps link
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          padding: '10px 12px', borderRadius: radius.lg,
                          background: entry.isPartner ? colors.bgWarning : colors.white,
                          border: `1px solid ${entry.isPartner ? colors.warningBorder : colors.borderDefault}`,
                          textDecoration: 'none',
                          transition: 'border-color 0.15s', cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = colors.brand; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = entry.isPartner ? colors.warningBorder : colors.borderDefault; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ fontSize: text.md, fontWeight: 500, color: colors.textPrimary }}>{entry.name}</div>
                            {entry.isPartner && (
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                                background: '#fef3c7', color: colors.amberDark, textTransform: 'uppercase', letterSpacing: 0.5,
                              }}>
                                Rink pick
                              </span>
                            )}
                            {entry.isFar && !entry.isPartner && (
                              <span style={{
                                fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 4,
                                background: colors.bgError, color: '#991b1b',
                              }}>
                                drive
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {entry.distance && <span style={{ fontSize: text.xs, color: entry.isFar ? colors.amber : colors.textMuted }}>{entry.distance}</span>}
                            <PlaceVoteButtons
                              rinkSlug={rinkSlug}
                              placeName={entry.name}
                              score={voteData.score}
                              userVote={voteData.vote as 'up' | 'down' | null}
                              onVote={(dir) => handlePlaceVote(entry.name, dir)}
                            />
                            <span style={{ fontSize: text.xs, color: colors.brand, fontWeight: 500 }}>→</span>
                          </div>
                        </div>
                        {entry.isPartner && entry.partnerNote && (
                          <div style={{ fontSize: text.xs, color: colors.amberDark, marginTop: 4, fontStyle: 'italic' }}>
                            {entry.partnerNote}
                          </div>
                        )}
                      </a>
                    )}
                    {/* Parent comments for this place */}
                    {tips.length > 0 && (
                      <div style={{ marginTop: 4, marginLeft: 8 }}>
                        {tips.map((tip, ti) => (
                          <div key={ti} style={{
                            fontSize: text.sm, color: colors.textSecondary, padding: '6px 10px',
                            background: colors.brandBg, borderRadius: radius.md, marginTop: 4,
                            borderLeft: `3px solid ${colors.brand}`,
                          }}>
                            <span style={{ fontStyle: 'italic' }}>&ldquo;{tip.text}&rdquo;</span>
                            <span style={{ fontSize: text.xs, color: colors.textMuted, marginLeft: 6 }}>— {tip.author}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Add a comment button */}
                    {tipOpen === placeKey ? (
                      <div style={{ marginTop: 6, marginLeft: 8, display: 'flex', gap: 6 }}>
                        <input
                          value={tipText}
                          onChange={(e) => setTipText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && submitPlaceTip(entry.name)}
                          placeholder='E.g. "Great for big groups"'
                          autoFocus
                          style={{
                            flex: 1, padding: '6px 10px', fontSize: text.sm,
                            border: `1px solid ${colors.borderMedium}`, borderRadius: radius.md, outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => submitPlaceTip(entry.name)}
                          style={{
                            fontSize: text.xs, fontWeight: 600, color: colors.white,
                            background: tipText.trim() ? colors.brand : colors.textDisabled,
                            border: 'none', borderRadius: radius.md, padding: '6px 12px', cursor: 'pointer',
                          }}
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setTipOpen(null); setTipText(''); }}
                          style={{ fontSize: text.xs, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.preventDefault(); if (!isLoggedIn) { openAuth(); return; } setTipOpen(placeKey); setTipText(''); }}
                        style={{
                          marginTop: 4, marginLeft: 8, fontSize: text.xs, fontWeight: 500,
                          color: colors.brand, background: 'none', border: 'none',
                          cursor: 'pointer', padding: '2px 0',
                        }}
                      >
                        💬 Add a comment
                      </button>
                    )}
                  </div>
                  );
                })}
                {/* Suggest a place */}
                <SuggestPlaceForm
                  rinkSlug={rinkSlug}
                  categoryKey={catKey}
                  onSubmit={() => setSuggestRefresh(prev => prev + 1)}
                />
              </div>
            )}
            {i < categories.length - 1 && <div style={{ height: 1, background: colors.borderLight }} />}
          </div>
          );
        })}
      </div>
    </section>
  );
}
