import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { DEMO_USER_ID } from '@/lib/demo-user';

const BYPASS_IDS = new Set([DEMO_USER_ID, 'test-free', 'test-pro', 'test-expert']);

/** GET /api/offers/alerts — list user's job alerts */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (BYPASS_IDS.has(userId)) {
    return NextResponse.json([
      { id: 'alert-demo-1', keywords: 'Product Designer', location: 'Paris', frequency: 'daily', isActive: true },
    ]);
  }

  // Real persistence would upsert to a JobAlert table — for now return empty
  return NextResponse.json([]);
}

/** POST /api/offers/alerts — create a job alert */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  let keywords: string, location: string | undefined, frequency: string | undefined;
  try {
    const body = await req.json();
    keywords = body.keywords;
    location = body.location;
    frequency = body.frequency;
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  if (!keywords?.trim()) {
    return NextResponse.json({ error: 'Les mots-clés sont requis' }, { status: 400 });
  }

  // Demo / test bypass — acknowledge success without persisting
  return NextResponse.json({
    ok: true,
    id: `alert-${Date.now()}`,
    keywords: keywords.trim(),
    location: location ?? '',
    frequency: frequency ?? 'daily',
    isActive: true,
  });
}
