'use client';

import { useState, useEffect } from 'react';
import { NearbyPlace } from '../../lib/seedData';
import { storage } from '../../lib/storage';
import { colors, text, radius } from '../../lib/theme';

export interface NearbyCategory {
  label: string;
  icon: string;
  description: string;
  places: NearbyPlace[];
  partnerPlaces?: NearbyPlace[];
}

export function NearbySection({ title, icon, categories, rinkSlug }: { title: string; icon: string; categories: NearbyCategory[]; rinkSlug: string }) {
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
