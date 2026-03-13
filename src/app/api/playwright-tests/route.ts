import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { runAllPlaywrightTests } from '@/lib/playwright-tests';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let _userId: string;
  try {
    _userId = requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const results = await runAllPlaywrightTests();
  const passed = results.filter((r) => r.passed).length;

  return NextResponse.json({
    results,
    summary: `${passed}/${results.length} tests passés`,
  });
}
