'use client';

import { useState, useEffect } from 'react';
import { NearbyPlace } from '../../lib/seedData';
import { storage, FanFavorite } from '../../lib/storage';
import { colors, text, radius } from '../../lib/theme';

const FAN_FAV_CATEGORIES = ['Quick bite', 'Coffee', 'Team lunch', 'Dinner', 'Other'] as const;

export interface NearbyCategory {
  label: string;
  icon: string;
  description: string;
  places: NearbyPlace[];
  partnerPlaces?: NearbyPlace[];
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

  function handleSubmit() {
    if (!name.trim() || !review.trim()) return;
    const user = storage.getCurrentUser();
    const newFav: FanFavorite = {
      name: name.trim(),
      review: review.trim(),
      category,
      author: user?.name || 'Hockey parent',
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
                  fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
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

export function NearbySection({ title, icon, categories, rinkSlug, fanFavorites }: { title: string; icon: string; categories: NearbyCategory[]; rinkSlug: string; fanFavorites?: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tipOpen, setTipOpen] = useState<string | null>(null);
  const [tipText, setTipText] = useState('');
  const [tipSaved, setTipSaved] = useState<string | null>(null);
  const [placeTips, setPlaceTips] = useState<Record<string, { text: string; author: string; date: string }[]>>({});

  useEffect(() => {
    setPlaceTips(storage.getAllPlaceTips(rinkSlug));
  }, [rinkSlug, tipSaved]);

  function submitPlaceTip(placeName: string) {
    if (!tipText.trim()) return;
    const cleanName = placeName.replace(/[^a-zA-Z0-9]/g, '_');
    const existing = storage.getPlaceTips(rinkSlug, cleanName);
    const user = storage.getCurrentUser();
    existing.push({
      text: tipText.trim(),
      author: user?.name || 'Hockey parent',
      date: new Date().toISOString(),
    });
    storage.setPlaceTips(rinkSlug, cleanName, existing);
    setTipText('');
    setTipOpen(null);
    setTipSaved(placeName + Date.now());
  }

  function getPlaceTips(placeName: string): { text: string; author: string; date: string }[] {
    const cleanName = placeName.replace(/[^a-zA-Z0-9]/g, '_');
    return placeTips[cleanName] || [];
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
        {categories.map((cat, i) => (
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
                      {cat.places.length} spot{cat.places.length !== 1 ? 's' : ''}
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
                {cat.places.map((place, j) => {
                  const placeKey = `${cat.label}::${place.name}`;
                  const tips = getPlaceTips(place.name);
                  return (
                  <div key={j} style={{ marginTop: 8 }}>
                    <a
                      href={place.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        padding: '10px 12px', borderRadius: radius.lg,
                        background: place.isPartner ? colors.bgWarning : colors.white,
                        border: `1px solid ${place.isPartner ? colors.warningBorder : colors.borderDefault}`,
                        textDecoration: 'none',
                        transition: 'border-color 0.15s', cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = colors.brand; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = place.isPartner ? colors.warningBorder : colors.borderDefault; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontSize: text.md, fontWeight: 500, color: colors.textPrimary }}>{place.name}</div>
                          {place.isPartner && (
                            <span style={{
                              fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                              background: '#fef3c7', color: colors.amberDark, textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>
                              Rink pick
                            </span>
                          )}
                          {place.isFar && !place.isPartner && (
                            <span style={{
                              fontSize: 9, fontWeight: 500, padding: '2px 6px', borderRadius: 4,
                              background: colors.bgError, color: '#991b1b',
                            }}>
                              drive
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {place.distance && <span style={{ fontSize: text.xs, color: place.isFar ? colors.amber : colors.textMuted }}>{place.distance}</span>}
                          <span style={{ fontSize: text.xs, color: colors.brand, fontWeight: 500 }}>→</span>
                        </div>
                      </div>
                      {place.isPartner && place.partnerNote && (
                        <div style={{ fontSize: text.xs, color: colors.amberDark, marginTop: 4, fontStyle: 'italic' }}>
                          {place.partnerNote}
                        </div>
                      )}
                    </a>
                    {/* Parent tips for this place */}
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
                    {/* Add a tip button */}
                    {tipOpen === placeKey ? (
                      <div style={{ marginTop: 6, marginLeft: 8, display: 'flex', gap: 6 }}>
                        <input
                          value={tipText}
                          onChange={(e) => setTipText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && submitPlaceTip(place.name)}
                          placeholder="E.g. &quot;Call ahead for 20+&quot;"
                          autoFocus
                          style={{
                            flex: 1, padding: '6px 10px', fontSize: text.sm,
                            border: `1px solid ${colors.borderMedium}`, borderRadius: radius.md, outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => submitPlaceTip(place.name)}
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
                        onClick={(e) => { e.preventDefault(); setTipOpen(placeKey); setTipText(''); }}
                        style={{
                          marginTop: 4, marginLeft: 8, fontSize: text.xs, fontWeight: 500,
                          color: colors.brand, background: 'none', border: 'none',
                          cursor: 'pointer', padding: '2px 0',
                        }}
                      >
                        💬 Add a tip
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
            {i < categories.length - 1 && <div style={{ height: 1, background: colors.borderLight }} />}
          </div>
        ))}
      </div>
    </section>
  );
}
