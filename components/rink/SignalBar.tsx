'use client';

import { useState } from 'react';
import { SIGNAL_META } from '../../lib/constants';
import { Signal } from '../../lib/rinkTypes';
import { FACILITY_DETAILS } from '../../lib/seedData';
import { getBarColor } from '../../lib/rinkHelpers';

export function SignalBar({ signal, rinkSlug }: { signal: Signal; rinkSlug: string }) {
  const meta = SIGNAL_META[signal.signal] || { label: signal.signal, icon: '', lowLabel: '1', highLabel: '5', info: '' };
  const pct = Math.round(((signal.value - 1) / 4) * 100);
  const color = getBarColor(signal.value);
  const [expanded, setExpanded] = useState(false);
  const facilityDetail = FACILITY_DETAILS[rinkSlug]?.[signal.signal];

  return (
    <div
      style={{ padding: '14px 0', cursor: 'pointer' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
            {meta.icon} {meta.label}
          </span>
          <span style={{
            fontSize: 10, color: '#9ca3af',
            transform: expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s', display: 'inline-block',
          }}>
            ▸
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color }}>{signal.value.toFixed(1)}</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>/5</span>
        </div>
      </div>
      <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 5,
          background: color,
          transition: 'width 0.8s ease',
        }} />
      </div>
      {!expanded && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>{meta.lowLabel}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
            {signal.count} rating{signal.count !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>{meta.highLabel}</span>
        </div>
      )}
      {expanded && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>← {meta.lowLabel}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
              {signal.count} rating{signal.count !== 1 ? 's' : ''}
              <span style={{ fontSize: 10, fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>
                {Math.round(signal.confidence * 100)}% confident
              </span>
            </span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{meta.highLabel} →</span>
          </div>
          {meta.info && (
            <div style={{
              fontSize: 12, color: '#6b7280', lineHeight: 1.5,
              background: '#f8fafc', border: '1px solid #e5e7eb',
              borderRadius: 8, padding: '8px 12px', marginTop: 4,
            }}>
              {meta.info}
            </div>
          )}
          {facilityDetail && (
            <div style={{
              marginTop: 6, padding: '8px 12px',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 8, borderLeft: '3px solid #3b82f6',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                <span style={{
                  fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                  background: '#3b82f6', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  Verified
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#1e40af' }}>
                  {facilityDetail.name}, Rink Manager
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#1e40af', lineHeight: 1.4, margin: 0 }}>
                {facilityDetail.text}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
