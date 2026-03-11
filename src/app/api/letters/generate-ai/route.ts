import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCoverLetter } from '@/lib/openai-service';
import { checkQuota, incrementUsage, getUserPlan } from '@/lib/quota-service';

export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY non configurée' }, { status: 503 });
  }

  // Quota check
  const plan = await getUserPlan(userId).catch(() => 'FREE');
  const quota = await checkQuota(userId, plan, 'cover_letter');
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `Limite quotidienne atteinte (${quota.max} tâches/jour). Passez au plan supérieur pour continuer.` },
      { status: 429 },
    );
  }

  const { jobTitle, company, jobDescription, tone } = await req.json();
  if (!jobTitle || !jobDescription) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  // Load user profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, currentTitle: true, location: true, phone: true, bio: true, skills: true, targetSectors: true },
  });

  const content = await generateCoverLetter({
    jobTitle,
    company,
    jobDescription,
    tone: tone ?? 'professional',
    userProfile: user ?? undefined,
  });

  // Increment usage after successful generation
  await incrementUsage(userId, 'cover_letter');

  return NextResponse.json({ content });
}
