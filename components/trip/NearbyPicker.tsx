'use client';

import { useState } from 'react';
import { colors } from '../../lib/theme';
import { NearbyPlace } from '../../types/trip';

interface NearbyPickerProps {
  label: string;
  icon: string;
  places: NearbyPlace[];
  selected: NearbyPlace | null;
  onSelect: (p: NearbyPlace) => void;
  onClear: () => void;
  costValue: string;
  onCostChange: (v: string) => void;
}

export function NearbyPicker({ label, icon, places, selected, onSelect, onClear, costValue, onCostChange }: NearbyPickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>{icon} {label}</label>
      {selected ? (
        <div style={{ border: `1px solid ${colors.brandLight}`, background: colors.bgInfo, borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.brandDeep }}>{selected.name}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                <span style={{ fontSize: 12, color: colors.textTertiary }}>{selected.distance}</span>
                <a href={selected.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: colors.brand, textDecoration: 'none', fontWeight: 500 }}>
                  Directions ↗
                </a>
              </div>
            </div>
            <button onClick={() => { onClear(); setOpen(false); }} aria-label={`Change ${label}`} style={{ fontSize: 11, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Change</button>
          </div>
          <input value={costValue} onChange={(e) => onCostChange(e.target.value)}
            placeholder="💲 Budget (optional)" aria-label={`${label} budget`}
            style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: `1px solid ${colors.borderMedium}`, borderRadius: 8, outline: 'none', boxSizing: 'border-box' as const, marginTop: 8 }} />
        </div>
      ) : places.length > 0 ? (
        <div>
          <button onClick={() => setOpen(!open)} aria-expanded={open} style={{
            width: '100%', padding: '10px 14px', fontSize: 13, color: colors.textTertiary,
            background: colors.surface, border: `1px solid ${colors.borderMedium}`, borderRadius: 10,
            cursor: 'pointer', textAlign: 'left',
          }}>
            Choose from nearby places ▾
          </button>
          {open && (
            <div role="listbox" aria-label={`Nearby ${label.toLowerCase()} options`} style={{ border: `1px solid ${colors.borderDefault}`, borderRadius: 10, overflow: 'hidden', maxHeight: 200, overflowY: 'auto', marginTop: 4 }}>
              {places.map((p, i) => (
                <div key={i} role="option" aria-selected={false} onClick={() => { onSelect(p); setOpen(false); }}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(p); setOpen(false); } }}
                  style={{ padding: '8px 14px', cursor: 'pointer', borderBottom: `1px solid ${colors.borderLight}`, background: colors.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgInfo)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = colors.surface)}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: colors.textPrimary }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: colors.textMuted, flexShrink: 0, marginLeft: 8 }}>{p.distance}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '10px 14px', fontSize: 13, color: colors.textMuted, border: `1px dashed ${colors.borderDefault}`, borderRadius: 10, textAlign: 'center' }}>
          Select a rink first to see nearby options
        </div>
      )}
    </div>
  );
}
