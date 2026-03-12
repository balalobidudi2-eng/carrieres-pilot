import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { supabaseAdmin, supabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { firstName, lastName, email, password } = body;

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: 'Email et mot de passe (8 car. min) requis' }, { status: 400 });
  }

  const normalizedEmail = (email as string).toLowerCase();

  // Check if email already used (in Prisma)
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 });
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || `${req.headers.get('x-forwarded-proto') ?? 'http'}://${req.headers.get('host')}`).trim();

  // Step 1: signUp via Supabase — this automatically sends the confirmation email
  // The emailRedirectTo must also be listed in Supabase dashboard >
  // Auth > URL Configuration > Redirect URLs
  const { data: sbData, error: sbError } = await supabaseServer.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: `${baseUrl}/api/auth/callback`,
      data: { firstName: firstName ?? '', lastName: lastName ?? '' },
    },
  });

  if (sbError) {
    console.error('[register] Supabase signUp error:', sbError.message);
    return NextResponse.json({ error: sbError.message }, { status: 400 });
  }

  if (!sbData.user) {
    return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 });
  }

  const supabaseId = sbData.user.id;

  // Step 2: create the Prisma user linked to the Supabase user
  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      supabaseId,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      emailVerified: false,
    },
  });

  // Do NOT issue tokens — user must verify email first
  return NextResponse.json({ emailPending: true }, { status: 201 });
}
