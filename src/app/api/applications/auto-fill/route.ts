import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { autoFillApplicationForm, type FormFillRequest } from '@/lib/form-automation';
import { checkQuota, incrementUsage, getUserPlan } from '@/lib/quota-service';
import { DEMO_USER_ID } from '@/lib/demo-user';
import { PLANS } from '@/lib/plans';

/** POST /api/applications/auto-fill — auto-fill an online application form */
export async function POST(req: NextRequest) {
  let userId: string;
  try { userId = requireAuth(req); } catch { return NextResponse.json({ error: 'Non authentifié' }, { status: 401 }); }

  // Feature gate: auto_apply must be enabled for the user's plan
  const plan = await getUserPlan(userId);
  const planConfig = PLANS[plan] ?? PLANS.FREE;
  if (!planConfig.features.auto_apply) {
    return NextResponse.json(
      { error: 'La candidature automatique n\'est pas disponible sur votre plan. Passez au Pro ou Expert.' },
      { status: 403 },
    );
  }

  // Quota check
  const quota = userId === DEMO_USER_ID
    ? { allowed: true, used: 0, max: 10, remaining: 10 }
    : await checkQuota(userId, plan, 'auto_apply');
  if (!quota.allowed) {
    return NextResponse.json(
      { error: `Limite quotidienne atteinte (${quota.max} candidatures auto/jour). Réessayez demain ou passez au plan supérieur.` },
      { status: 429 },
    );
  }

  const body: FormFillRequest = await req.json();
  if (!body.applicationUrl || !body.firstName || !body.lastName || !body.email) {
    return NextResponse.json({ error: 'Champs requis manquants (applicationUrl, firstName, lastName, email)' }, { status: 400 });
  }

  const result = await autoFillApplicationForm(body);

  // Only increment if actually submitted
  if (result.success && userId !== DEMO_USER_ID) {
    await incrementUsage(userId, 'auto_apply');
  }

  return NextResponse.json(result, { status: result.success ? 200 : 501 });
}
