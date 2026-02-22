import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../lib/db';
import { buildSummary } from '../../../../../lib/dbSummary';
import { logger, generateRequestId } from '../../../../../lib/logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  const logCtx = { requestId, method: 'GET', path: '/api/v1/rinks/[id]' };
  const { id } = await params;

  try {
    const { rows } = await pool.query(
      'SELECT id, name, city, state, address, latitude, longitude, created_at FROM rinks WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 });
    }

    const rink = rows[0];
    const [summary, teamResult, photoResult, nearbyResult, metaResult] = await Promise.all([
      buildSummary(id),
      pool.query('SELECT team_name FROM home_teams WHERE rink_id = $1 ORDER BY id', [id]),
      pool.query(
        `SELECT rp.id, rp.url, rp.caption, rp.created_at, u.name AS contributor_name
         FROM rink_photos rp LEFT JOIN users u ON rp.user_id = u.id
         WHERE rp.rink_id = $1 ORDER BY rp.created_at DESC LIMIT 10`,
        [id]
      ),
      pool.query(
        `SELECT category, name, distance, url, is_partner, partner_note, is_far
         FROM nearby_places WHERE rink_id = $1 ORDER BY category, id`,
        [id]
      ),
      pool.query(
        `SELECT streaming_type, streaming_url, facility_details
         FROM venue_metadata WHERE rink_id = $1`,
        [id]
      ),
    ]);
    const home_teams = teamResult.rows.map((r: { team_name: string }) => r.team_name);
    const photos = photoResult.rows;

    // Group nearby places by category
    const nearby: Record<string, unknown[]> = {};
    for (const row of nearbyResult.rows) {
      if (!nearby[row.category]) nearby[row.category] = [];
      nearby[row.category].push({
        name: row.name,
        distance: row.distance,
        url: row.url,
        isPartner: row.is_partner,
        partnerNote: row.partner_note,
        isFar: row.is_far,
      });
    }

    const venue_metadata = metaResult.rows[0] || null;

    return NextResponse.json({ rink, summary, home_teams, photos, nearby, venue_metadata });
  } catch (err) {
    logger.error('Rink detail failed', { ...logCtx, error: err, rinkId: id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
