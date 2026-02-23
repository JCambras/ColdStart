import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/apiAuth';
import { rateLimit } from '../../../../../lib/rateLimit';

// Admin emails that can manage claims
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

async function requireAdmin() {
  const { session, error } = await requireAuth();
  if (error) return { error };
  const email = session!.user!.email?.toLowerCase();
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }
  return { session, error: null };
}

export async function GET(request: NextRequest) {
  const limited = rateLimit(request, 30, 60_000);
  if (limited) return limited;

  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const status = request.nextUrl.searchParams.get('status') || 'pending';
    const result = await pool.query(
      `SELECT rc.id, rc.rink_id, rc.name, rc.email, rc.role, rc.status, rc.created_at,
              r.name AS rink_name, r.city, r.state
       FROM rink_claims rc
       JOIN rinks r ON r.id = rc.rink_id
       WHERE rc.status = $1
       ORDER BY rc.created_at DESC
       LIMIT 100`,
      [status]
    );

    return NextResponse.json({ claims: result.rows });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
