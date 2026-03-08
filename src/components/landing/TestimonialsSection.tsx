'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/lib/animations';

const testimonials = [
  {
    name: 'Sophie Martin',
    role: 'Product Designer',
    company: 'Chez Doctolib — recrutée en 3 semaines',
    avatar: 'SM',
    rating: 5,
    quote:
      "CarrièrePilot a complètement changé ma façon de chercher un emploi. Mon CV a été refait par l'IA en 5 minutes et j'ai décroché 3 entretiens la première semaine !",
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    name: 'Thomas Bernard',
    role: 'Développeur Full Stack',
    company: 'Chez Qonto — recruté en 6 semaines',
    avatar: 'TB',
    rating: 5,
    quote:
      "Le matching d'offres est incroyable. Je recevais des opportunités que je n'aurais jamais trouvées seul. Le Kanban de suivi m'a permis de ne rater aucune relance.",
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'Camille Durand',
    role: 'Marketing Manager',
    company: 'Chez Alan — recrutée en 4 semaines',
    avatar: 'CD',
    rating: 5,
    quote:
      "Les lettres de motivation générées par l'IA sont bluffantes — personnalisées, jamais génériques. Mon taux de réponse est passé de 5% à 32% !",
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Alexandre Petit',
    role: 'Data Analyst',
    company: 'Chez BlaBlaCar — recruté en 2 semaines',
    avatar: 'AP',
    rating: 5,
    quote:
      "La préparation aux entretiens avec l'IA m'a donné une confiance incroyable. Les questions simulées étaient quasi identiques à celles posées en vrai entretien.",
    gradient: 'from-rose-500 to-pink-600',
  },
];

const companiesLogo = ['Doctolib', 'Qonto', 'Alan', 'BlaBlaCar', 'Ledger', 'Contentsquare'];

export function TestimonialsSection() {
  return (
    <section className="section-padding bg-white overflow-hidden">
      <div className="container-app">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="text-center mb-14 space-y-4"
        >
          <motion.div variants={fadeInUp}>
            <span className="inline-block bg-accent/10 text-accent text-sm font-semibold px-4 py-1.5 rounded-full border border-accent/20 mb-4">
              Témoignages
            </span>
            <h2 className="font-heading font-bold text-[#1E293B]">
              Ils ont décroché leur job
              <br />
              <span className="text-gradient">avec CarrièrePilot</span>
            </h2>
          </motion.div>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeInUp}
              whileHover={{ y: -4, boxShadow: '0 8px 40px rgba(124,58,237,0.15)' }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-card border border-[#E2E8F0] p-6 flex flex-col gap-4"
              style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-sm font-bold shrink-0`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-[#1E293B] text-sm">{t.name}</p>
                  <p className="text-xs text-[#64748B]">{t.role}</p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-[#475569] leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
              <p className="text-xs text-accent font-semibold">{t.company}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Company logos */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-[#94A3B8] mb-6">Nos utilisateurs ont été recrutés chez</p>
          <div className="flex flex-wrap items-center justify-center gap-6 opacity-50">
            {companiesLogo.map((company) => (
              <span key={company} className="text-[#1E293B] font-bold text-sm tracking-wide uppercase">
                {company}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
