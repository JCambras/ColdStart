'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageShell } from '../../../components/PageShell';
import { RinkSummary, RinkDetail, Tip } from '../../../lib/rinkTypes';
import { timeAgo } from '../../../lib/rinkHelpers';
import { BASEBALL_SIGNAL_META, BASEBALL_SIGNAL_ICONS } from '../../../lib/baseballConfig';
import { getVenueConfig } from '../../../lib/venueConfig';
import { apiGet, apiPost } from '../../../lib/api';
import { LoadingSkeleton } from '../../../components/LoadingSkeleton';
import { colors, text } from '../../../lib/theme';

const config = getVenueConfig('baseball');

function getBarColor(value: number): string {
  if (value >= 4.0) return colors.success;
  if (value >= 3.0) return colors.amber;
  return colors.error;
}

export default function FieldPage() {
  const params = useParams();
  const router = useRouter();
  const fieldId = params.id as string;

  const [detail, setDetail] = useState<RinkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await apiGet<RinkDetail>(`/rinks/${fieldId}`);
      if (data) {
        setDetail(data);
        setLoading(false);
        return;
      }
      setError('Field not found');
      setLoading(false);
    }
    load();
  }, [fieldId]);

  if (loading) {
    return <PageShell><LoadingSkeleton variant="page" /></PageShell>;
  }

  if (error || !detail) {
    return (
      <PageShell>
        <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#9918;</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Field not found</h2>
          <p style={{ fontSize: 14, color: colors.textTertiary, marginTop: 8 }}>{error || "This field doesn't exist or has been removed."}</p>
          <button onClick={() => router.push('/')} style={{ marginTop: 24, fontSize: 14, fontWeight: 600, color: colors.textInverse, background: colors.textPrimary, borderRadius: 10, padding: '12px 28px', border: 'none', cursor: 'pointer' }}>
            &#8592; Back to search
          </button>
        </div>
      </PageShell>
    );
  }

  const { rink: field, summary } = detail;
  const hasData = summary.contribution_count > 0;

  // Build signals from config
  const displaySignals = config.signals.map(key => {
    const existing = summary.signals.find(s => s.signal === key);
    return existing && existing.count > 0 ? existing : null;
  }).filter(Boolean) as { signal: string; value: number; count: number; confidence: number }[];

  return (
    <PageShell>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
        {/* Field header */}
        <section style={{ paddingTop: 24 }}>
          <div style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 1.5,
            color: colors.amber, background: colors.bgWarning,
            padding: '3px 10px', borderRadius: 6, marginBottom: 12,
          }}>
            &#9918; Baseball Field
          </div>
          <h1 style={{
            fontSize: 'clamp(22px, 5vw, 36px)',
            fontWeight: 700, color: colors.textPrimary,
            lineHeight: 1.15, letterSpacing: -0.5, margin: 0,
          }}>
            {field.name}
          </h1>
          <a
            href={`https://maps.apple.com/?address=${encodeURIComponent(`${field.address}, ${field.city}, ${field.state}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 13, color: colors.textTertiary, marginTop: 4, display: 'block', textDecoration: 'underline', textDecorationColor: colors.borderMedium, textUnderlineOffset: 2 }}
          >
            {field.address}, {field.city}, {field.state}
          </a>

          {hasData && (
            <p style={{ fontSize: 12, color: colors.textTertiary, marginTop: 10, margin: '10px 0 0' }}>
              From {summary.contribution_count} baseball parent{summary.contribution_count !== 1 ? 's' : ''}
            </p>
          )}

          {/* Verdict */}
          {hasData && (
            <div style={{
              marginTop: 12, padding: '12px 16px', borderRadius: 12,
              background: summary.verdict.includes('Great') ? colors.bgSuccess
                : summary.verdict.includes('Mixed') ? colors.bgWarning : colors.bgSubtle,
              border: `1px solid ${summary.verdict.includes('Great') ? colors.successBorder
                : summary.verdict.includes('Mixed') ? colors.warningBorder : colors.borderLight}`,
            }}>
              <span style={{
                fontSize: 15, fontWeight: 700,
                color: summary.verdict.includes('Great') ? colors.success
                  : summary.verdict.includes('Mixed') ? colors.amber : colors.textMuted,
              }}>
                {summary.verdict}
              </span>
            </div>
          )}

          {/* Share */}
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => {
                const shareUrl = new URL(window.location.href);
                shareUrl.searchParams.set('ref', 'share');
                const url = shareUrl.toString();
                const shareText = `${field.name}\n${field.city}, ${field.state}\nField info from baseball parents: ${url}`;
                if (navigator.share) {
                  navigator.share({ title: `${field.name} — ColdStart Baseball`, text: shareText, url }).catch(() => {});
                } else {
                  const fallbackCopy = (t: string) => { if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(t); const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); return Promise.resolve(); };
                  fallbackCopy(shareText).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }).catch(() => {});
                }
              }}
              style={{
                fontSize: 12, fontWeight: 500,
                color: shareCopied ? colors.success : colors.brand,
                background: shareCopied ? colors.bgSuccess : colors.bgInfo,
                border: `1px solid ${shareCopied ? colors.successBorder : colors.brandLight}`,
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
              }}
            >
              {shareCopied ? 'Copied!' : 'Share with team'}
            </button>
          </div>
        </section>

        {/* Signals */}
        {displaySignals.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h3 style={{
              fontSize: 13, fontWeight: 600, color: colors.textMuted,
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
            }}>
              Ratings
            </h3>
            {displaySignals.map(s => {
              const meta = BASEBALL_SIGNAL_META[s.signal];
              if (!meta) return null;
              return (
                <div key={s.signal} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', marginBottom: 6,
                  background: colors.surface, border: `1px solid ${colors.borderLight}`, borderRadius: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{meta.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: colors.textPrimary }}>{meta.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 80, height: 6, background: colors.borderLight, borderRadius: 3, overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        background: getBarColor(s.value),
                        width: `${(s.value / 5) * 100}%`,
                      }} />
                    </div>
                    <span style={{
                      fontSize: 14, fontWeight: 700, minWidth: 32, textAlign: 'right',
                      color: getBarColor(s.value),
                    }}>
                      {s.value.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 11, color: colors.textMuted }}>({s.count})</span>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* No data state */}
        {!hasData && (
          <section style={{ background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 16, padding: 32, marginTop: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>&#9918;</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Be the first to report</p>
            <p style={{ fontSize: 14, color: colors.textTertiary, marginTop: 6, lineHeight: 1.5 }}>
              No one has shared info about this field yet. How&apos;s parking? Is it hot? Any shade?
            </p>
          </section>
        )}

        {/* Tips */}
        {summary.tips.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h3 style={{
              fontSize: 13, fontWeight: 600, color: colors.textMuted,
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
            }}>
              Things to know ({summary.tips.length})
            </h3>
            {summary.tips.map((tip, i) => (
              <div key={i} style={{
                padding: '10px 14px', marginBottom: 6,
                background: colors.surface, border: `1px solid ${colors.borderLight}`, borderRadius: 10,
              }}>
                <p style={{ fontSize: 14, color: colors.textSecondary, margin: 0, lineHeight: 1.5 }}>
                  &ldquo;{tip.text}&rdquo;
                </p>
                <span style={{ fontSize: 11, color: colors.textMuted }}>
                  {tip.contributor_type === 'local_parent' ? 'Local' : 'Visitor'} &middot; {timeAgo(tip.created_at)}
                </span>
              </div>
            ))}
          </section>
        )}

        <section style={{ marginTop: 24, paddingBottom: 60 }}>
          <div
            onClick={() => router.push('/')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/'); } }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', background: colors.surface, border: `1px solid ${colors.borderDefault}`, borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 13, color: colors.textSecondary }}>&#8592; Browse all venues</span>
          </div>
        </section>
      </div>

      <footer style={{
        maxWidth: 680, margin: '0 auto', padding: '28px 24px',
        borderTop: `1px solid ${colors.borderLight}`,
      }}>
        <span style={{ fontSize: 12, color: colors.textMuted }}>Built by sports parents, for sports parents.</span>
      </footer>
    </PageShell>
  );
}
