'use client';

import { motion } from 'framer-motion';
import { Check, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { staggerContainer, fadeInUp } from '@/lib/animations';

const plans = [
  {
    name: 'Gratuit',
    price: '0',
    period: '',
    description: 'Pour commencer votre recherche',
    badge: null,
    features: [
      { label: '1 CV', included: true },
      { label: '3 lettres / mois', included: true },
      { label: '10 offres / jour', included: true },
      { label: 'Suivi 5 candidatures', included: true },
      { label: 'Matching IA', included: false },
      { label: 'Score ATS', included: false },
      { label: 'Candidatures automatiques', included: false },
      { label: 'Support prioritaire', included: false },
    ],
    cta: 'Commencer gratuitement',
    ctaHref: '/inscription',
    variant: 'outline' as const,
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '9,99',
    period: '/mois',
    description: 'Pour maximiser vos candidatures',
    badge: 'Populaire',
    features: [
      { label: 'CV illimités', included: true },
      { label: 'Lettres illimitées', included: true },
      { label: 'Offres illimitées', included: true },
      { label: 'Suivi illimité', included: true },
      { label: 'Matching IA', included: true },
      { label: 'Score ATS', included: true },
      { label: 'Candidatures automatiques', included: false },
      { label: 'Support prioritaire', included: false },
    ],
    cta: 'Passer au Pro',
    ctaHref: '/inscription?plan=pro',
    variant: 'primary' as const,
    highlighted: true,
  },
  {
    name: 'Expert',
    price: '24,99',
    period: '/mois',
    description: 'Pour les candidats les plus ambitieux',
    badge: null,
    features: [
      { label: 'Tout Pro inclus', included: true },
      { label: 'Candidatures auto (50/jour)', included: true },
      { label: 'Préparation entretien IA', included: true },
      { label: 'Support prioritaire', included: true },
      { label: 'Statistiques avancées', included: true },
      { label: 'Coach IA personnalisé', included: true },
      { label: 'API access', included: true },
      { label: 'Onboarding dédié', included: true },
    ],
    cta: 'Passer Expert',
    ctaHref: '/inscription?plan=expert',
    variant: 'secondary' as const,
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section className="section-padding bg-[#F7F8FC]" id="tarifs">
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
              Tarifs
            </span>
            <h2 className="font-heading font-bold text-[#1E293B]">
              Simple, transparent,{' '}
              <span className="text-gradient">sans surprise</span>
            </h2>
          </motion.div>
          <motion.p variants={fadeInUp} className="text-[#64748B] text-lg max-w-xl mx-auto">
            Commencez gratuitement. Passez au premium quand vous êtes prêt.
          </motion.p>
        </motion.div>

        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6 items-start"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeInUp}
              whileHover={plan.highlighted ? {} : { y: -4 }}
              className={`relative rounded-card p-7 ${
                plan.highlighted
                  ? 'bg-gradient-brand text-white shadow-2xl scale-105 border-0'
                  : 'bg-white border border-[#E2E8F0] shadow-card'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Zap size={10} />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`font-heading text-lg font-bold mb-1 ${
                    plan.highlighted ? 'text-white' : 'text-[#1E293B]'
                  }`}
                >
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-white/70' : 'text-[#64748B]'}`}>
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-extrabold font-heading ${
                      plan.highlighted ? 'text-white' : 'text-[#1E293B]'
                    }`}
                  >
                    {plan.price === '0' ? 'Gratuit' : `${plan.price}€`}
                  </span>
                  {plan.period && (
                    <span className={plan.highlighted ? 'text-white/60 text-sm' : 'text-[#64748B] text-sm'}>
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-2.5 mb-7">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm">
                    {f.included ? (
                      <Check
                        size={16}
                        className={`shrink-0 ${plan.highlighted ? 'text-white' : 'text-emerald-500'}`}
                      />
                    ) : (
                      <X
                        size={16}
                        className={`shrink-0 ${plan.highlighted ? 'text-white/30' : 'text-gray-300'}`}
                      />
                    )}
                    <span
                      className={
                        f.included
                          ? plan.highlighted
                            ? 'text-white'
                            : 'text-[#1E293B]'
                          : plan.highlighted
                          ? 'text-white/40'
                          : 'text-[#CBD5E1]'
                      }
                    >
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={plan.ctaHref} className="block">
                <Button
                  variant={plan.highlighted ? 'outline' : plan.variant}
                  fullWidth
                  className={
                    plan.highlighted
                      ? 'bg-white text-accent hover:bg-white/90 border-white font-bold'
                      : ''
                  }
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-[#64748B] mt-8"
        >
          Paiement sécurisé par Stripe · Annulation à tout moment · Sans engagement
        </motion.p>
      </div>
    </section>
  );
}
