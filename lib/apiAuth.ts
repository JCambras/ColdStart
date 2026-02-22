import { NextResponse } from 'next/server';
import { auth } from '../auth';

/**
 * Require an authenticated session for an API route.
 * Returns the session if valid, or a 401 NextResponse if not.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }
  return { session, error: null };
}
