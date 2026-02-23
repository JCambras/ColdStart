import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';
import { buildSummary } from '../../../../lib/dbSummary';
import { VENUE_CONFIG } from '../../../../lib/venueConfig';
import { requireAuth } from '../../../../lib/apiAuth';
import { rateLimit } from '../../../../lib/rateLimit';
import { logger, generateRequestId } from '../../../../lib/logger';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const logCtx = { requestId, method: 'POST', path: '/api/v1/contributions' };

  const limited = rateLimit(request, 20, 60_000);
  if (limited) return limited;

  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { rink_id, kind } = body;
    const user_id = session!.user!.id;

    if (!rink_id || !kind) {
      return NextResponse.json({ error: 'rink_id and kind are required' }, { status: 400 });
    }

    // Validate contributor_type and context (MED-1)
    const VALID_CONTRIBUTOR_TYPES = ['local_parent', 'visiting_parent'];
    const contributor_type = VALID_CONTRIBUTOR_TYPES.includes(body.contributor_type)
      ? body.contributor_type
      : 'visiting_parent';
    const context = typeof body.context === 'string' ? body.context.slice(0, 500) : null;

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
      if (!VENUE_CONFIG.signals.includes(signal_rating.signal)) {
        return NextResponse.json({ error: `Invalid signal: ${signal_rating.signal}` }, { status: 400 });
      }
      const value = Number(signal_rating.value);
      if (value < 1 || value > 5 || !Number.isInteger(value)) {
        return NextResponse.json({ error: 'value must be an integer between 1 and 5' }, { status: 400 });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const upsertResult = await client.query(
          `INSERT INTO signal_ratings (rink_id, signal, value, contributor_type, context, user_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (rink_id, signal, user_id) WHERE user_id IS NOT NULL
           DO UPDATE SET value = EXCLUDED.value, contributor_type = EXCLUDED.contributor_type, context = EXCLUDED.context, created_at = NOW()
           RETURNING (xmax = 0) AS is_new`,
          [rink_id, signal_rating.signal, value, contributor_type || 'visiting_parent', context || null, user_id]
        );
        const isNew = upsertResult.rows[0]?.is_new;
        if (isNew) {
          await client.query(
            `UPDATE users SET "rinksRated" = COALESCE("rinksRated", 0) + 1 WHERE id = $1`,
            [user_id]
          );
        }
        await client.query('COMMIT');
      } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }
    } else if (kind === 'one_thing_tip' || kind === 'tip') {
      const tipData = body.one_thing_tip || body.tip;
      if (!tipData?.text?.trim()) {
        return NextResponse.json({ error: 'tip text is required' }, { status: 400 });
      }
      if (tipData.text.trim().length > 280) {
        return NextResponse.json({ error: 'tip text must be 280 characters or fewer' }, { status: 400 });
      }

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
    } else if (kind === 'confirm') {
      // Quick confirm — return visitor affirms current ratings are still accurate.
      // Bumps last_updated_at by touching a lightweight confirmation record.
      await pool.query(
        `INSERT INTO signal_confirmations (rink_id, user_id, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (rink_id, user_id) DO UPDATE SET created_at = NOW()`,
        [rink_id, user_id]
      );
    } else {
      return NextResponse.json({ error: `Unknown kind: ${kind}` }, { status: 400 });
    }

    // Return updated summary wrapped in { data: { summary } }
    const summary = await buildSummary(rink_id);
    logger.info('Contribution saved', { ...logCtx, rink_id, kind, user_id });
    return NextResponse.json({ data: { summary } });
  } catch (err) {
    logger.error('Contribution failed', { ...logCtx, error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
