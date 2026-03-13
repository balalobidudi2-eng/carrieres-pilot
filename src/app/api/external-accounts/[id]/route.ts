import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** DELETE /api/external-accounts/[id] — remove an external account */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Verify ownership before deleting — prevents IDOR
  const account = await prisma.externalAccount.findFirst({
    where: { id: params.id, userId },
  });

  if (!account) {
    return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
  }

  await prisma.externalAccount.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
