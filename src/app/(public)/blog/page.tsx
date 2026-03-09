import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog — CarrièrePilot',
  description:
    'Conseils, guides et actualités pour optimiser votre recherche d\'emploi avec l\'intelligence artificielle.',
};

const ARTICLES = [
  {
    slug: 'cv-ats-optimise',
    category: 'CV & Candidature',
    date: '15 janvier 2025',
    readTime: '5 min',
    title: 'Comment créer un CV optimisé pour les logiciels ATS en 2025',
    excerpt:
      'Les recruteurs utilisent des logiciels ATS pour filtrer les candidatures. Découvrez comment structurer votre CV pour passer ce premier filtre automatique et atteindre la pile "à rappeler".',
    emoji: '📄',
    color: 'bg-blue-50',
    accent: 'text-blue-600',
  },
  {
    slug: 'lettre-motivation-ia',
    category: 'IA & Productivité',
    date: '8 janvier 2025',
    readTime: '4 min',
    title: "L'IA peut-elle vraiment rédiger votre lettre de motivation ?",
    excerpt:
      "Les outils IA révolutionnent la rédaction de lettres de motivation. Mais comment s'assurer que le résultat reste personnel et convaincant ? Nos conseils pour utiliser l'IA intelligemment sans perdre votre voix.",
    emoji: '✍️',
    color: 'bg-purple-50',
    accent: 'text-purple-600',
  },
  {
    slug: 'recherche-emploi-organisation',
    category: 'Méthode',
    date: '2 janvier 2025',
    readTime: '6 min',
    title: 'Organisez votre recherche d\'emploi comme un projet professionnel',
    excerpt:
      "Postuler à des dizaines d'offres sans méthode est épuisant et peu efficace. Apprenez à structurer votre recherche avec un tableau Kanban, des indicateurs de suivi et des routines hebdomadaires pour rester motivé.",
    emoji: '🗂️',
    color: 'bg-green-50',
    accent: 'text-green-600',
  },
  {
    slug: 'entretien-questions-frequentes',
    category: 'Entretien',
    date: '20 décembre 2024',
    readTime: '7 min',
    title: '15 questions d\'entretien fréquentes (et comment y répondre)',
    excerpt:
      "\"Parlez-moi de vous\", \"Quel est votre plus grand défaut ?\"... Ces classiques de l'entretien d'embauche méritent une préparation soignée. Guide complet avec des exemples de réponses structurées.",
    emoji: '🎤',
    color: 'bg-amber-50',
    accent: 'text-amber-600',
  },
];

export default function BlogPage() {
  return (
    <section className="section-padding">
      <div className="container-app">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-6">
            Conseils &amp; Guides
          </span>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-[#1E293B] leading-tight mb-4">
            Le blog{' '}
            <span className="text-gradient">CarrièrePilot</span>
          </h1>
          <p className="text-[#64748B] text-lg max-w-2xl mx-auto">
            Stratégies, outils et astuces pour décrocher votre prochain emploi plus vite.
          </p>
        </div>

        {/* Articles grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {ARTICLES.map((article) => (
            <article
              key={article.slug}
              className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden hover:shadow-card-hover transition-shadow duration-200 flex flex-col"
              style={{ boxShadow: '0 4px 24px rgba(15,52,96,0.06)' }}
            >
              {/* Card visual */}
              <div className={`${article.color} h-40 flex items-center justify-center`}>
                <span className="text-6xl">{article.emoji}</span>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-semibold ${article.accent} bg-white border border-current/20 px-2 py-0.5 rounded-full`}>
                    {article.category}
                  </span>
                  <span className="text-xs text-[#94A3B8]">{article.date}</span>
                  <span className="text-xs text-[#94A3B8]">· {article.readTime} de lecture</span>
                </div>

                <h2 className="font-heading text-lg font-bold text-[#1E293B] leading-snug mb-3">
                  {article.title}
                </h2>

                <p className="text-sm text-[#64748B] leading-relaxed flex-1">
                  {article.excerpt}
                </p>

                <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
                  <span className="text-xs text-[#94A3B8] italic">
                    Article complet bientôt disponible
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter banner */}
        <div className="mt-16 bg-gradient-to-r from-accent/10 to-blue-50 rounded-card border border-accent/20 p-8 text-center">
          <h3 className="font-heading text-2xl font-bold text-[#1E293B] mb-2">
            Recevez nos conseils par email
          </h3>
          <p className="text-[#64748B] text-sm mb-6 max-w-md mx-auto">
            Rejoignez plus de 1 200 candidats qui reçoivent chaque semaine nos meilleures astuces pour trouver un emploi plus vite.
          </p>
          <Link
            href="/inscription"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-btn hover:bg-accent/90 transition-colors"
          >
            Créer un compte gratuit
          </Link>
        </div>
      </div>
    </section>
  );
}
