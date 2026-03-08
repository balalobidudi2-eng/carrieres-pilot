'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { fadeInUp, floatAnimation, staggerContainer } from '@/lib/animations';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-mesh pt-32 pb-24">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/6 rounded-full blur-3xl" />
      </div>

      <div className="container-app">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="space-y-8"
          >
            {/* Animated badge */}
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 rounded-full px-4 py-2 text-sm font-semibold">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                🚀 IA Powered — Candidatures automatiques
              </span>
            </motion.div>

            {/* H1 */}
            <motion.div variants={fadeInUp}>
              <h1 className="font-heading text-[56px] font-extrabold leading-[1.1] text-[#1E293B] md:text-6xl">
                Votre copilote pour{' '}
                <span className="text-gradient">décrocher le job</span> de vos rêves
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p variants={fadeInUp} className="text-lg text-[#64748B] leading-relaxed max-w-lg">
              Créez un CV optimisé, générez vos lettres de motivation et postulez automatiquement
              grâce à l&apos;intelligence artificielle.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
              <Link href="/inscription">
                <Button size="lg">
                  Créer mon CV gratuitement
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <button className="inline-flex items-center gap-2.5 h-12 px-5 rounded-btn border border-[#E2E8F0] text-[#1E293B] text-sm font-semibold bg-white hover:border-accent hover:text-accent transition-all duration-250">
                <span className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-full">
                  <Play size={14} className="text-accent fill-current ml-0.5" />
                </span>
                Voir une démo
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={fadeInUp} className="flex items-center gap-6 pt-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white text-xs font-bold"
                  >
                    {['A', 'B', 'C', 'D'][i - 1]}
                  </div>
                ))}
              </div>
              <div className="text-sm text-[#64748B]">
                <div className="flex items-center gap-1 text-amber-500 mb-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={12} className="fill-current" />
                  ))}
                </div>
                <span className="font-semibold text-[#1E293B]">12 000+</span> candidats accompagnés · 4.9/5
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Dashboard mockup */}
          <motion.div
            className="hidden lg:flex items-center justify-center"
            animate={floatAnimation.animate}
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  const stats = [
    { label: 'Candidatures', value: '47', change: '+12%', color: 'text-emerald-600' },
    { label: 'Taux réponse', value: '34%', change: '+8%', color: 'text-emerald-600' },
    { label: 'Entretiens', value: '8', change: '+3', color: 'text-emerald-600' },
  ];

  const applications = [
    { company: 'Doctolib', role: 'Product Designer', status: 'Entretien', color: 'bg-emerald-100 text-emerald-700' },
    { company: 'Qonto', role: 'UX Writer', status: 'En attente', color: 'bg-amber-100 text-amber-700' },
    { company: 'Alan', role: 'Product Manager', status: 'Envoyée', color: 'bg-blue-100 text-blue-700' },
  ];

  return (
    <div className="w-[480px] bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden">
      {/* Header */}
      <div className="h-10 bg-[#F7F8FC] flex items-center px-4 gap-2 border-b border-[#E2E8F0]">
        {['#FF5F57', '#FFBD2E', '#28CA41'].map((c) => (
          <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
        ))}
        <div className="ml-4 h-5 bg-[#E2E8F0] rounded w-52 text-xs flex items-center justify-center text-[#94A3B8]">
          carrierepilot.fr/app/dashboard
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Greeting */}
        <div>
          <p className="text-xs text-[#64748B]">Bonjour Sophie 👋</p>
          <p className="font-heading font-bold text-[#1E293B] text-base">Tableau de bord</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#F7F8FC] rounded-xl p-3">
              <p className="text-xs text-[#64748B]">{s.label}</p>
              <p className="font-heading font-bold text-[#1E293B] text-lg">{s.value}</p>
              <p className={`text-xs font-semibold ${s.color}`}>{s.change}</p>
            </div>
          ))}
        </div>

        {/* Applications */}
        <div>
          <p className="text-xs font-semibold text-[#64748B] mb-2">Dernières candidatures</p>
          <div className="space-y-2">
            {applications.map((a) => (
              <div key={a.company} className="flex items-center justify-between bg-[#F7F8FC] rounded-xl px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-[#1E293B]">{a.company}</p>
                  <p className="text-xs text-[#64748B]">{a.role}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.color}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI match card */}
        <div className="bg-gradient-brand rounded-xl p-3 text-white">
          <p className="text-xs font-semibold opacity-80 mb-1">✨ Match IA du jour</p>
          <p className="text-sm font-semibold">Lead UX Designer chez Stripe — 94% de compatibilité</p>
        </div>
      </div>
    </div>
  );
}
