import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rink_id, source } = body;

    if (!source) {
      return NextResponse.json({ error: 'source is required' }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO referral_visits (rink_id, source) VALUES ($1, $2)`,
      [rink_id || null, source]
    );

    return NextResponse.json({ logged: true });
  } catch (err) {
    console.error('POST /api/v1/referrals error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
