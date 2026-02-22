import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';
import { logger, generateRequestId } from '../../../../lib/logger';

export async function GET() {
  try {
    const result = await pool.query(`
      WITH rink_stats AS (
        SELECT
          COUNT(*)::int AS total_rinks,
          COUNT(DISTINCT state)::int AS states_covered
        FROM rinks
      ),
      rating_stats AS (
        SELECT
          COUNT(*)::int AS total_ratings,
          COUNT(DISTINCT rink_id)::int AS rinks_with_ratings,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS ratings_last_7d,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int AS ratings_last_30d
        FROM signal_ratings
      ),
      tip_stats AS (
        SELECT COUNT(*)::int AS total_tips
        FROM tips
        WHERE hidden = FALSE
      ),
      share_stats AS (
        SELECT
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS shares_last_7d,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int AS shares_last_30d
        FROM referral_visits
        WHERE source IN ('share', 'post_rate')
      ),
      top_signals AS (
        SELECT signal, COUNT(*)::int AS count
        FROM signal_ratings
        GROUP BY signal
        ORDER BY count DESC
      )
      SELECT
        rs.total_rinks,
        rs.states_covered,
        rat.total_ratings,
        rat.rinks_with_ratings,
        rat.ratings_last_7d,
        rat.ratings_last_30d,
        ts.total_tips,
        (rat.total_ratings + ts.total_tips) AS total_contributions,
        sh.shares_last_7d,
        sh.shares_last_30d,
        json_agg(json_build_object('signal', sig.signal, 'count', sig.count)) AS top_signals
      FROM rink_stats rs
      CROSS JOIN rating_stats rat
      CROSS JOIN tip_stats ts
      CROSS JOIN share_stats sh
      CROSS JOIN top_signals sig
      GROUP BY rs.total_rinks, rs.states_covered,
               rat.total_ratings, rat.rinks_with_ratings,
               rat.ratings_last_7d, rat.ratings_last_30d,
               ts.total_tips,
               sh.shares_last_7d, sh.shares_last_30d
    `);

    if (result.rows.length === 0) {
      return NextResponse.json({
        total_rinks: 0, rinks_with_ratings: 0, total_ratings: 0,
        total_tips: 0, total_contributions: 0, states_covered: 0,
        ratings_last_7d: 0, ratings_last_30d: 0,
        shares_last_7d: 0, shares_last_30d: 0, top_signals: [],
      });
    }

    const row = result.rows[0];
    return NextResponse.json({
      total_rinks: row.total_rinks,
      rinks_with_ratings: row.rinks_with_ratings,
      total_ratings: row.total_ratings,
      total_tips: row.total_tips,
      total_contributions: parseInt(row.total_contributions, 10),
      states_covered: row.states_covered,
      ratings_last_7d: row.ratings_last_7d,
      ratings_last_30d: row.ratings_last_30d,
      shares_last_7d: row.shares_last_7d,
      shares_last_30d: row.shares_last_30d,
      top_signals: row.top_signals,
    });
  } catch (err) {
    logger.error('Stats query failed', { requestId: generateRequestId(), method: 'GET', path: '/api/v1/stats', error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
