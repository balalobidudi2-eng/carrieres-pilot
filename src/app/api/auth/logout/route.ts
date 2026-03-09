import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId, revokeUserTokens, clearAuthCookies } from '@/lib/auth';
import { clearAdminCookie } from '@/lib/admin-auth';
import { DEMO_USER_ID } from '@/lib/demo-user';

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthUserId(req);
    // Only revoke DB tokens for real (non-demo) users
    if (userId && userId !== DEMO_USER_ID) {
      await revokeUserTokens(userId);
    }
  } catch {
    // Ignore auth errors during logout — we still need to clear cookies
  }
  clearAuthCookies();
  clearAdminCookie();
  return NextResponse.json({ ok: true });
}
