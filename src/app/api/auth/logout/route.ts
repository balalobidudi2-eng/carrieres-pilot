import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId, revokeUserTokens, clearAuthCookies } from '@/lib/auth';
import { clearAdminCookie } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthUserId(req);
    if (userId) {
      await revokeUserTokens(userId);
    }
  } catch {
    // Ignore auth errors during logout — we still need to clear cookies
  }
  clearAuthCookies();
  clearAdminCookie();
  return NextResponse.json({ ok: true });
}
