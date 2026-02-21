import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';
import { buildSummary } from '../../../../lib/dbSummary';
import { getVenueConfig } from '../../../../lib/venueConfig';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rink_id, kind, contributor_type, context, user_id, sport } = body;

    if (!rink_id || !kind) {
      return NextResponse.json({ error: 'rink_id and kind are required' }, { status: 400 });
    }

    // Verify rink exists
    const rinkCheck = await pool.query('SELECT id FROM rinks WHERE id = $1', [rink_id]);
    if (rinkCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Rink not found' }, { status: 404 });
    }

    if (kind === 'signal_rating') {
      const { signal_rating } = body;
      if (!signal_rating?.signal || !signal_rating?.value) {
        return NextResponse.json({ error: 'signal_rating.signal and signal_rating.value are required' }, { status: 400 });
      }
      if (!getVenueConfig(sport).signals.includes(signal_rating.signal)) {
        return NextResponse.json({ error: `Invalid signal: ${signal_rating.signal}` }, { status: 400 });
      }
      const value = Number(signal_rating.value);
      if (value < 1 || value > 5 || !Number.isInteger(value)) {
        return NextResponse.json({ error: 'value must be an integer between 1 and 5' }, { status: 400 });
      }

      if (user_id) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(
            `INSERT INTO signal_ratings (rink_id, signal, value, contributor_type, context, user_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [rink_id, signal_rating.signal, value, contributor_type || 'visiting_parent', context || null, user_id]
          );
          await client.query(
            `UPDATE users SET "rinksRated" = COALESCE("rinksRated", 0) + 1 WHERE id = $1`,
            [user_id]
          );
          await client.query('COMMIT');
        } catch (txErr) {
          await client.query('ROLLBACK');
          throw txErr;
        } finally {
          client.release();
        }
      } else {
        await pool.query(
          `INSERT INTO signal_ratings (rink_id, signal, value, contributor_type, context, user_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [rink_id, signal_rating.signal, value, contributor_type || 'visiting_parent', context || null, null]
        );
      }
    } else if (kind === 'one_thing_tip' || kind === 'tip') {
      const tipData = body.one_thing_tip || body.tip;
      if (!tipData?.text?.trim()) {
        return NextResponse.json({ error: 'tip text is required' }, { status: 400 });
      }
      if (tipData.text.trim().length > 140) {
        return NextResponse.json({ error: 'tip text must be 140 characters or fewer' }, { status: 400 });
      }

      if (user_id) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(
            `INSERT INTO tips (rink_id, text, contributor_type, context, user_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [rink_id, tipData.text.trim(), contributor_type || 'visiting_parent', context || null, user_id]
          );
          await client.query(
            `UPDATE users SET "tipsSubmitted" = COALESCE("tipsSubmitted", 0) + 1 WHERE id = $1`,
            [user_id]
          );
          await client.query('COMMIT');
        } catch (txErr) {
          await client.query('ROLLBACK');
          throw txErr;
        } finally {
          client.release();
        }
      } else {
        await pool.query(
          `INSERT INTO tips (rink_id, text, contributor_type, context, user_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [rink_id, tipData.text.trim(), contributor_type || 'visiting_parent', context || null, null]
        );
      }
    } else {
      return NextResponse.json({ error: `Unknown kind: ${kind}` }, { status: 400 });
    }

    // Return updated summary wrapped in { data: { summary } }
    const summary = await buildSummary(rink_id, sport);
    return NextResponse.json({ data: { summary } });
  } catch (err) {
    console.error('POST /api/v1/contributions error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
