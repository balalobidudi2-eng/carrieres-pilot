'use client';

import { motion } from 'framer-motion';
import { UserPlus, Sparkles, Search, Send } from 'lucide-react';
import { fadeInUp, staggerContainer } from '@/lib/animations';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Créez votre profil en 2 min',
    description: 'Renseignez vos expériences, compétences et objectifs. Notre IA s\'adapte à votre parcours.',
    color: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    number: '02',
    icon: Sparkles,
    title: "L'IA génère votre CV optimisé",
    description: 'En 5 minutes, votre CV est prêt : structuré, percutant et optimisé pour les ATS.',
    color: 'from-violet-500 to-violet-600',
    bgLight: 'bg-violet-50',
    textColor: 'text-violet-600',
  },
  {
    number: '03',
    icon: Search,
    title: 'Recevez des offres ciblées',
    description: "Nos embeddings IA analysent votre profil et matchent les meilleures opportunités du marché.",
    color: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    number: '04',
    icon: Send,
    title: 'Postulez et suivez tout',
    description: 'Générez votre lettre en 30s, postulez en un clic et suivez tout depuis le kanban.',
    color: 'from-rose-500 to-rose-600',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-600',
  },
];

export function HowItWorksSection() {
  return (
    <section className="section-padding bg-[#F7F8FC]">
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
              Comment ça marche
            </span>
            <h2 className="font-heading font-bold text-[#1E293B]">
              De zéro à votre prochain emploi
              <br />
              <span className="text-gradient">en 4 étapes simples</span>
            </h2>
          </motion.div>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative"
        >
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent z-0" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                variants={fadeInUp}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg mb-5 text-white`}
                >
                  <Icon size={24} />
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-[#E2E8F0] rounded-full flex items-center justify-center text-xs font-bold text-[#64748B]">
                  {i + 1}
                </div>
                <h3 className="font-heading text-base font-semibold text-[#1E293B] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
