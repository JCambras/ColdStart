import { pool } from '../../../lib/db';
import { colors, spacing, pad } from '../../../lib/theme';
import Link from 'next/link';
import { PushPreferences } from '../../../components/PushPreferences';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch user
  const userResult = await pool.query(
    `SELECT id, name, email, image, "createdAt", "rinksRated", "tipsSubmitted"
     FROM users WHERE id = $1`,
    [id]
  );

  if (userResult.rows.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: pad(0, spacing[24]), textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: spacing[16] }}>👤</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Profile not found</h2>
        <p style={{ fontSize: 14, color: colors.textTertiary, marginTop: spacing[8] }}>This user doesn&apos;t exist.</p>
        <Link href="/" style={{ marginTop: spacing[24], display: 'inline-block', fontSize: 14, fontWeight: 600, color: colors.brand }}>
          Back to home
        </Link>
      </div>
    );
  }

  const user = userResult.rows[0];
  const rinksRated = user.rinksRated ?? 0;
  const tipsSubmitted = user.tipsSubmitted ?? 0;
  const isTrusted = rinksRated >= 10;
  const badgeProgress = Math.min(100, (rinksRated / 10) * 100);
  const initials = (user.name || user.email || '??').slice(0, 2).toUpperCase();
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  // Fetch rinks they've rated (grouped)
  const ratedRinks = await pool.query(
    `SELECT r.id, r.name, r.city, r.state, COUNT(sr.id)::int AS rating_count
     FROM signal_ratings sr
     JOIN rinks r ON r.id = sr.rink_id
     WHERE sr.user_id = $1 AND r.venue_type != 'non_ice'
     GROUP BY r.id, r.name, r.city, r.state
     ORDER BY MAX(sr.created_at) DESC
     LIMIT 20`,
    [id]
  );

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: pad(spacing[40], spacing[24]) }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[16], marginBottom: spacing[24] }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: `linear-gradient(135deg, ${colors.brand}, ${colors.brandAccent})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: colors.textInverse, fontSize: 22, fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
            {user.name || 'Anonymous'}
          </h1>
          {memberSince && (
            <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
              Member since {memberSince}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', gap: spacing[16], marginBottom: spacing[24],
      }}>
        <div style={{
          flex: 1, padding: pad(spacing[16], spacing[20]),
          background: colors.bgSubtle, borderRadius: 12,
          border: `1px solid ${colors.borderLight}`,
        }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.textPrimary }}>{rinksRated}</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>Rinks Rated</div>
        </div>
        <div style={{
          flex: 1, padding: pad(spacing[16], spacing[20]),
          background: colors.bgSubtle, borderRadius: 12,
          border: `1px solid ${colors.borderLight}`,
        }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: colors.textPrimary }}>{tipsSubmitted}</div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>Tips Shared</div>
        </div>
      </div>

      {/* Badge */}
      <div style={{
        padding: pad(spacing[16], spacing[20]), borderRadius: 12,
        background: isTrusted ? colors.bgSuccess : colors.bgSubtle,
        border: `1px solid ${isTrusted ? colors.successBorder : colors.borderLight}`,
        marginBottom: spacing[24],
      }}>
        {isTrusted ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[8] }}>
            <span style={{ fontSize: 20 }}>&#9989;</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.success }}>Trusted Reviewer</div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                Rated 10+ rinks — their ratings carry extra weight.
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.textSecondary, marginBottom: spacing[8] }}>
              Progress to Trusted Reviewer
            </div>
            <div style={{ height: 8, background: colors.borderLight, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: colors.brand,
                width: `${badgeProgress}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>
              {rinksRated} of 10 rinks rated
            </div>
          </div>
        )}
      </div>

      {/* Push notification preferences */}
      <PushPreferences />

      {/* Rinks rated */}
      {ratedRinks.rows.length > 0 && (
        <div>
          <h2 style={{
            fontSize: 13, fontWeight: 600, color: colors.textMuted,
            textTransform: 'uppercase', letterSpacing: 1.5,
            marginBottom: spacing[12],
          }}>
            Rinks Rated
          </h2>
          {ratedRinks.rows.map((r: { id: string; name: string; city: string; state: string; rating_count: number }) => (
            <Link
              key={r.id}
              href={`/rinks/${r.id}`}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: pad(spacing[12], spacing[16]), marginBottom: spacing[6],
                background: colors.surface, border: `1px solid ${colors.borderLight}`,
                borderRadius: 10, textDecoration: 'none', color: 'inherit',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>{r.name}</div>
                <div style={{ fontSize: 12, color: colors.textMuted }}>{r.city}, {r.state}</div>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 600, color: colors.brand,
                background: colors.bgInfo, padding: '4px 10px', borderRadius: 8,
              }}>
                {r.rating_count} rating{r.rating_count !== 1 ? 's' : ''}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ marginTop: spacing[32], textAlign: 'center' }}>
        <Link href="/" style={{ fontSize: 14, color: colors.brand, fontWeight: 500 }}>
          &#8592; Back to ColdStart
        </Link>
      </div>
    </div>
  );
}
