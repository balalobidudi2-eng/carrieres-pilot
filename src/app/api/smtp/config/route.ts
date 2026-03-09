import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptPassword } from '@/lib/smtp';

/** POST /api/smtp/config — save user SMTP credentials */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  const body = await req.json();
  const { host, port, user: smtpUser, password, from } = body as Record<string, string>;

  if (!host || !smtpUser || !password) {
    return NextResponse.json({ error: 'Hôte, email et mot de passe sont requis' }, { status: 400 });
  }

  const smtpPassEnc = encryptPassword(password);
  const smtpPort = port ? parseInt(port, 10) : 587;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { smtpHost: host, smtpPort, smtpUser, smtpPassEnc, smtpFrom: from || smtpUser },
    });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P1001') {
      return NextResponse.json({ error: 'Base de données inaccessible. Réessayez dans quelques instants.' }, { status: 503 });
    }
    console.error('[POST /api/smtp/config]', err);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }
}

/** GET /api/smtp/config — returns current user SMTP config (password masked) */
export async function GET(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { smtpHost: true, smtpPort: true, smtpUser: true, smtpPassEnc: true, smtpFrom: true },
    });
    return NextResponse.json({
      host: user?.smtpHost ?? '',
      port: user?.smtpPort ?? 587,
      user: user?.smtpUser ?? '',
      from: user?.smtpFrom ?? '',
      hasPassword: !!user?.smtpPassEnc,
    });
  } catch {
    return NextResponse.json({ host: '', port: 587, user: '', from: '', hasPassword: false });
  }
}
