import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../../lib/db';
import { requireAuth } from '../../../../../../lib/apiAuth';
import { rateLimit } from '../../../../../../lib/rateLimit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(request, 10, 60_000);
  if (limited) return limited;

  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { id: rinkId } = await params;

  try {
    const [ratingsResult, tipsResult, referralsResult, weeklyResult] = await Promise.all([
      pool.query(
        `SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS last_7d,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int AS last_30d
        FROM signal_ratings WHERE rink_id = $1`,
        [rinkId]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM tips WHERE rink_id = $1 AND hidden = FALSE`,
        [rinkId]
      ),
      pool.query(
        `SELECT
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS last_7d,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int AS last_30d
        FROM referral_visits WHERE rink_id = $1`,
        [rinkId]
      ),
      pool.query(
        `SELECT
          date_trunc('week', created_at)::date AS week,
          COUNT(*)::int AS count
        FROM signal_ratings
        WHERE rink_id = $1 AND created_at > NOW() - INTERVAL '28 days'
        GROUP BY week ORDER BY week`,
        [rinkId]
      ),
    ]);

    const ratings = ratingsResult.rows[0] || { total: 0, last_7d: 0, last_30d: 0 };
    const tips = tipsResult.rows[0] || { total: 0 };
    const referrals = referralsResult.rows[0] || { last_7d: 0, last_30d: 0 };
    const weekly_ratings = weeklyResult.rows.map((r: { week: string; count: number }) => ({
      week: r.week,
      count: r.count,
    }));

    return NextResponse.json({
      ratings_total: ratings.total,
      ratings_7d: ratings.last_7d,
      ratings_30d: ratings.last_30d,
      tips_total: tips.total,
      referrals_7d: referrals.last_7d,
      referrals_30d: referrals.last_30d,
      weekly_ratings,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
