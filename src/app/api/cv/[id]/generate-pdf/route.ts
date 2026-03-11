import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** POST /api/cv/[id]/generate-pdf — generate printable HTML for a CV */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let userId: string;
  try {
    userId = requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  // Read body once — includes content sent by CVEditor for fake-ID CVs
  let bodyContent: Record<string, unknown> | null = null;
  try {
    const body = await req.json();
    if (body?.content && typeof body.content === 'object') bodyContent = body.content as Record<string, unknown>;
  } catch { /* body is optional */ }

  const isFakeId = /^cv(-import)?-\d+$/.test(params.id);

  let cvName = 'Curriculum Vitae';
  let content: Record<string, unknown> | undefined;

  if (isFakeId) {
    if (!bodyContent) return NextResponse.json({ error: 'Contenu manquant pour un CV local' }, { status: 400 });
    content = bodyContent;
  } else {
    let cv: { id: string; userId: string; name: string; content: unknown } | null = null;
    try {
      cv = await prisma.cV.findUnique({ where: { id: params.id } });
    } catch (dbErr: unknown) {
      // P1001: DB unreachable — fall back to body content if available
      const code = (dbErr as { code?: string })?.code;
      if (code === 'P1001' && bodyContent) { content = bodyContent; }
      else return NextResponse.json({ error: 'Base de donn\u00e9es inaccessible' }, { status: 503 });
    }

    if (!content) {
      if (!cv || cv.userId !== userId) {
        if (bodyContent) { content = bodyContent; }
        else return NextResponse.json({ error: 'CV non trouve' }, { status: 404 });
      } else {
        cvName = cv.name;
        content = cv.content as Record<string, unknown>;
      }
    }
  }
  if (!content) return NextResponse.json({ error: 'CV non trouvé' }, { status: 404 });
  try {
  const p = (content.personal ?? {}) as Record<string, string | undefined>;
  const summary = content.summary as string | undefined;
  const experiences = (content.experiences ?? []) as Array<Record<string, unknown>>;
  const education = (content.education ?? []) as Array<Record<string, unknown>>;
  const skills = (content.skills ?? []) as Array<Record<string, unknown>>;
  const languages = (content.languages ?? []) as Array<Record<string, unknown>>;

  const esc = (s: string | undefined | null): string =>
    (s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const expHtml = experiences
    .map(
      (e) =>
        `<div class="exp-item"><div class="exp-header"><span class="exp-title">${esc(e.title as string)}</span><span class="exp-date">${esc(e.startDate as string)}${e.endDate ? ' - ' + esc(e.endDate as string) : ' - Present'}</span></div><div class="exp-company">${esc(e.company as string)}</div></div>`,
    )
    .join('');

  const eduHtml = education
    .map(
      (e) =>
        `<div class="exp-item"><div class="exp-header"><span class="exp-title">${esc(e.degree as string)}</span><span class="exp-date">${esc(e.startDate as string)}</span></div><div class="exp-company">${esc(e.institution as string)}</div></div>`,
    )
    .join('');

  const skillsHtml = skills.map((s) => `<span class="skill-tag">${esc(s.name as string)}</span>`).join('');

  const langHtml = languages
    .map((l) => `<div>${esc(l.language as string)} &mdash; ${l.level === 'native' ? 'Natif' : esc(l.level as string)}</div>`)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${esc(cvName)}</title>
<style>
  @page { margin: 18mm; size: A4; }
  body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #1E293B; font-size: 11pt; line-height: 1.5; margin: 0; padding: 0; }
  h1 { margin: 0 0 2px; font-size: 22pt; }
  h2 { font-size: 12pt; text-transform: uppercase; letter-spacing: 2px; color: #7C3AED; border-bottom: 2px solid #7C3AED; padding-bottom: 4px; margin: 16px 0 8px; }
  .subtitle { color: #7C3AED; font-weight: 600; margin-bottom: 4px; }
  .contact { color: #64748B; font-size: 9pt; margin-bottom: 12px; }
  .summary { color: #475569; font-size: 10pt; margin-bottom: 12px; }
  .exp-item { margin-bottom: 10px; }
  .exp-header { display: flex; justify-content: space-between; }
  .exp-title { font-weight: 700; }
  .exp-company { color: #7C3AED; font-size: 10pt; }
  .exp-date { color: #94A3B8; font-size: 9pt; }
  .skills-list { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag { background: #EDE9FE; color: #7C3AED; padding: 2px 10px; border-radius: 12px; font-size: 9pt; font-weight: 600; }
</style>
</head>
<body>
  <h1>${esc(p.firstName)} ${esc(p.lastName)}</h1>
  ${p.title ? '<div class="subtitle">' + esc(p.title) + '</div>' : ''}
  <div class="contact">${[p.email, p.phone, p.city].filter(Boolean).map(esc).join(' &middot; ')}</div>
  ${summary ? '<h2>Resume</h2><div class="summary">' + esc(summary) + '</div>' : ''}
  ${experiences.length > 0 ? '<h2>Experiences</h2>' + expHtml : ''}
  ${education.length > 0 ? '<h2>Formation</h2>' + eduHtml : ''}
  ${skills.length > 0 ? '<h2>Competences</h2><div class="skills-list">' + skillsHtml + '</div>' : ''}
  ${languages.length > 0 ? '<h2>Langues</h2>' + langHtml : ''}
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
  } catch (err: unknown) {
    console.error('[POST /api/cv/id/generate-pdf]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
