import { ImageResponse } from 'next/og';
import { pool } from '../../../lib/db';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const SIGNAL_DISPLAY: Record<string, { icon: string; label: string }> = {
  parking: { icon: '🅿️', label: 'Parking' },
  heat: { icon: '☀️', label: 'Heat' },
  food_nearby: { icon: '🍔', label: 'Food' },
  chaos: { icon: '🌀', label: 'Chaos' },
  family_friendly: { icon: '👨‍👩‍👧', label: 'Family' },
  dugouts: { icon: '🏟️', label: 'Dugouts' },
  batting_cages: { icon: '⚾', label: 'Cages' },
};

function getScoreColor(value: number): string {
  if (value >= 4.0) return '#16a34a';
  if (value >= 3.0) return '#d97706';
  return '#dc2626';
}

function getScoreBg(value: number): string {
  if (value >= 4.0) return '#f0fdf4';
  if (value >= 3.0) return '#fffbeb';
  return '#fef2f2';
}

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let fieldName = 'Baseball Field';
  let city = '';
  let state = '';
  let verdict = '';
  let topSignals: { signal: string; value: number; count: number }[] = [];

  try {
    const rinkResult = await pool.query(
      'SELECT name, city, state FROM rinks WHERE id = $1',
      [id]
    );
    if (rinkResult.rows.length > 0) {
      const field = rinkResult.rows[0];
      fieldName = field.name;
      city = field.city;
      state = field.state;
    }

    const signalResult = await pool.query(
      `SELECT signal, AVG(value) AS value, COUNT(*)::int AS count
       FROM signal_ratings WHERE rink_id = $1
       GROUP BY signal ORDER BY count DESC LIMIT 3`,
      [id]
    );
    topSignals = signalResult.rows.map((r: { signal: string; value: string; count: number }) => ({
      signal: r.signal,
      value: Math.round(parseFloat(r.value) * 10) / 10,
      count: r.count,
    }));

    if (topSignals.length > 0) {
      const avg = topSignals.reduce((sum, s) => sum + s.value, 0) / topSignals.length;
      if (avg >= 3.8) verdict = 'Great field overall';
      else if (avg >= 3.0) verdict = 'Mixed reviews';
      else verdict = 'Heads up — some issues reported';
    }
  } catch {
    // Render with defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          background: 'linear-gradient(135deg, #451a03 0%, #78350f 50%, #92400e 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: 28 }}>&#9918;</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#fbbf24', letterSpacing: '-0.5px' }}>
            ColdStart Baseball
          </span>
        </div>

        {/* Middle: Field info + signals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span
              style={{
                fontSize: fieldName.length > 35 ? 40 : 48,
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.1,
                letterSpacing: '-1px',
              }}
            >
              {fieldName}
            </span>
            {city && (
              <span style={{ fontSize: 24, color: '#d6d3d1', fontWeight: 500 }}>
                {city}, {state}
              </span>
            )}
          </div>

          {verdict && (
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: verdict.includes('Great') ? '#4ade80' : verdict.includes('Mixed') ? '#fbbf24' : '#f87171',
                display: 'flex',
              }}
            >
              {verdict}
            </span>
          )}

          {topSignals.length > 0 && (
            <div style={{ display: 'flex', gap: '16px' }}>
              {topSignals.map((s) => {
                const meta = SIGNAL_DISPLAY[s.signal];
                if (!meta) return null;
                return (
                  <div
                    key={s.signal}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: getScoreBg(s.value),
                      border: `2px solid ${getScoreColor(s.value)}33`,
                      borderRadius: '12px',
                      padding: '10px 20px',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{meta.icon}</span>
                    <span style={{ fontSize: 20, fontWeight: 600, color: '#334155' }}>
                      {meta.label}
                    </span>
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: getScoreColor(s.value),
                      }}
                    >
                      {s.value.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom: CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, color: '#a8a29e' }}>
            Scout this field &#8594; coldstarthockey.com
          </span>
          {topSignals.length > 0 && (
            <span style={{ fontSize: 16, color: '#78716c' }}>
              Based on {topSignals.reduce((sum, s) => sum + s.count, 0)} ratings
            </span>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
