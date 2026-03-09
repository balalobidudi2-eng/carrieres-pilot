import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifi\u00e9' }, { status: 401 }); }

  // TODO: persist saved offers in a SavedOffer model
  return NextResponse.json({ ok: true, saved: true, offerId: params.id });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifi\u00e9' }, { status: 401 }); }

  // TODO: remove from SavedOffer model
  return NextResponse.json({ ok: true, saved: false, offerId: params.id });
}
