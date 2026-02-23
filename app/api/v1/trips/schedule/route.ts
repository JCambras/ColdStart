import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/apiAuth';
import { rateLimit } from '../../../../../lib/rateLimit';

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 10, 60_000);
  if (limited) return limited;

  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { trip_id, rink_id, rink_name, team_name, games } = body;

    if (!trip_id || !rink_id || !rink_name || !team_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!Array.isArray(games) || games.length === 0) {
      return NextResponse.json({ error: 'games array is required' }, { status: 400 });
    }

    const userId = session!.user!.id;

    // Idempotent: delete existing schedule for this trip+user, then insert
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'DELETE FROM trip_schedules WHERE trip_id = $1 AND user_id = $2',
        [trip_id, userId],
      );

      for (const game of games) {
        if (!game.game_time) continue;
        await client.query(
          `INSERT INTO trip_schedules (user_id, rink_id, rink_name, trip_id, team_name, opponent, game_time)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, rink_id, rink_name, trip_id, team_name, game.opponent || null, game.game_time],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json({ data: { scheduled: true } });
  } catch (err) {
    console.error('Trip schedule save failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
