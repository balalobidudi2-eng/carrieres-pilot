import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Compte démo désactivé.' }, { status: 410 });
}

