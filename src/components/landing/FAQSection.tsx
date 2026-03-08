'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { staggerContainer, fadeInUp } from '@/lib/animations';

const faqs = [
  {
    q: 'Est-ce vraiment gratuit ?',
    a: 'Oui ! Le plan Gratuit est 100% gratuit, sans carte bancaire requise. Vous pouvez créer 1 CV, 3 lettres par mois et accéder à 10 offres par jour sans aucun engagement.',
  },
  {
    q: "Comment l'IA génère-t-elle mon CV ?",
    a: "Notre IA (GPT-4o) analyse votre profil, vos expériences et vos objectifs pour rédiger un résumé professionnel percutant, optimiser la formulation de vos expériences et suggérer des compétences pertinentes — le tout adapté aux systèmes ATS des recruteurs.",
  },
  {
    q: "Puis-je annuler mon abonnement à tout moment ?",
    a: "Absolument. Vous pouvez annuler votre abonnement à tout moment depuis votre espace \"Abonnement\". L'annulation prend effet à la fin de la période en cours. Aucun frais supplémentaire.",
  },
  {
    q: "Les recruteurs voient-ils que j'utilise une IA ?",
    a: "Non. CarrièrePilot génère du contenu qui vous ressemble — basé sur vos informations réelles. Vous restez maître du contenu final et pouvez tout personnaliser avant d'envoyer.",
  },
  {
    q: "Quels formats de CV sont supportés ?",
    a: "CarrièrePilot génère des CV en PDF haute qualité. Vous pouvez également importer un CV existant en PDF pour que l'IA l'analyse et améliore son contenu.",
  },
  {
    q: "Comment fonctionne le matching d'offres ?",
    a: "Nous utilisons les embeddings OpenAI (text-embedding-3-small) pour encoder votre profil et chaque offre d'emploi en vecteurs sémantiques. La similarité cosinus mesure la compatibilité entre votre profil et chaque offre — les résultats sont classés du plus pertinent au moins pertinent.",
  },
];

function FAQItem({ faq, isOpen, onToggle }: { faq: typeof faqs[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-[#E2E8F0] rounded-card overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#F7F8FC] transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-[#1E293B] text-sm pr-4">{faq.q}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-[#64748B]"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-6 pb-5 text-sm text-[#64748B] leading-relaxed border-t border-[#E2E8F0] pt-4">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="section-padding bg-white">
      <div className="container-app max-w-3xl mx-auto">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="text-center mb-12 space-y-4"
        >
          <motion.div variants={fadeInUp}>
            <span className="inline-block bg-accent/10 text-accent text-sm font-semibold px-4 py-1.5 rounded-full border border-accent/20 mb-4">
              FAQ
            </span>
            <h2 className="font-heading font-bold text-[#1E293B]">
              Questions fréquentes
            </h2>
          </motion.div>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="space-y-3"
        >
          {faqs.map((faq, i) => (
            <motion.div key={i} variants={fadeInUp}>
              <FAQItem
                faq={faq}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
