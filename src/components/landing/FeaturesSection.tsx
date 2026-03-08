'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  Mail,
  Target,
  LayoutDashboard,
  Bot,
  BarChart3,
} from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/animations';

const features = [
  {
    icon: FileText,
    color: 'bg-blue-50 text-blue-600',
    title: 'Créateur de CV IA',
    description: '15+ templates ATS-optimisés, générés en 5 minutes grâce à notre IA avancée.',
  },
  {
    icon: Mail,
    color: 'bg-violet-50 text-violet-600',
    title: 'Lettres personnalisées',
    description: 'Une lettre unique et percutante pour chaque offre, générée en 30 secondes.',
  },
  {
    icon: Target,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Matching intelligent',
    description: "L'IA analyse votre profil et trouve les meilleures offres correspondantes.",
  },
  {
    icon: LayoutDashboard,
    color: 'bg-amber-50 text-amber-600',
    title: 'Suivi Kanban',
    description: 'Visualisez toutes vos candidatures en un coup d\'œil dans un board intuitif.',
  },
  {
    icon: Bot,
    color: 'bg-pink-50 text-pink-600',
    title: 'Candidatures automatiques',
    description: 'Postulez à 50 offres par jour sans effort avec le plan Expert.',
  },
  {
    icon: BarChart3,
    color: 'bg-indigo-50 text-indigo-600',
    title: 'Statistiques avancées',
    description: 'Analysez votre taux de réponse et optimisez votre stratégie de candidature.',
  },
];

export function FeaturesSection() {
  return (
    <section className="section-padding bg-white" id="fonctionnalites">
      <div className="container-app">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="text-center mb-16 space-y-4"
        >
          <motion.div variants={fadeInUp}>
            <span className="inline-block bg-accent/10 text-accent text-sm font-semibold px-4 py-1.5 rounded-full border border-accent/20 mb-4">
              Fonctionnalités
            </span>
            <h2 className="font-heading font-bold text-[#1E293B]">
              Tout ce dont vous avez besoin
              <br />
              <span className="text-gradient">pour réussir votre recherche</span>
            </h2>
          </motion.div>
          <motion.p variants={fadeInUp} className="text-[#64748B] text-lg max-w-2xl mx-auto">
            Une suite complète d&apos;outils IA pour accélérer chaque étape de votre recherche d&apos;emploi.
          </motion.p>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                whileHover={{ y: -4, boxShadow: '0 8px 40px rgba(124,58,237,0.15)' }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-card border border-[#E2E8F0] p-6 cursor-default"
                style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${feature.color}`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-heading text-lg font-semibold text-[#1E293B] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#64748B] text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
