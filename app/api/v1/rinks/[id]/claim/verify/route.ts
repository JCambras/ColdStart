import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../../../lib/db';
import { requireAuth } from '../../../../../../../lib/apiAuth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const userEmail = session!.user!.email;

  if (!userEmail) {
    return NextResponse.json({ error: 'No email on session' }, { status: 403 });
  }

  const result = await pool.query(
    `SELECT id FROM rink_claims WHERE rink_id = $1 AND email = $2 AND status = 'approved'`,
    [id, userEmail.toLowerCase()]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'No approved claim for this rink' }, { status: 403 });
  }

  return NextResponse.json({ verified: true });
}
