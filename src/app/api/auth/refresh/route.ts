import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { rotateRefreshToken, setRefreshCookie } from '@/lib/auth';

export async function POST(_req: NextRequest) {
  const cookieStore = cookies();
  const oldToken = cookieStore.get('cp_refresh')?.value;

  if (!oldToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  const result = await rotateRefreshToken(oldToken);
  if (!result) {
    return NextResponse.json({ error: 'Token expiré ou invalide' }, { status: 401 });
  }

  setRefreshCookie(result.refreshToken);
  return NextResponse.json({ accessToken: result.accessToken });
}

