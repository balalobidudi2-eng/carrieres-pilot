'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Sparkles, Target, Compass, Shield, Bell, CheckCircle, Plane, Zap, FileText, Calendar, ArrowDown, Star, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

const features = [
  {
    icon: Target,
    title: 'Matching intelligent d\'offres',
    description: 'Notre algorithme analyse votre profil, vos compétences et vos ambitions pour vous proposer uniquement les offres qui vous correspondent vraiment.',
    gradient: 'from-blue-500 to-cyan-400',
    tag: 'IA & Machine Learning',
  },
  {
    icon: Compass,
    title: 'Copilote de carrière',
    description: 'Un tableau de bord complet pour piloter vos candidatures, vos entretiens et votre progression vers votre prochain poste — en temps réel.',
    gradient: 'from-violet-500 to-purple-400',
    tag: 'Suivi & Analyse',
  },
  {
    icon: Shield,
    title: 'Outils premium exclusifs',
    description: 'Générateur de CV optimisé ATS, lettres de motivation IA personnalisées, coaching d\'entretien et suivi automatisé de vos candidatures.',
    gradient: 'from-amber-500 to-orange-400',
    tag: 'Productivité',
  },
];

const discover = [
  { icon: Zap, title: 'Automatisation totale', desc: 'Postulez sur Indeed sans lever le petit doigt. Votre profil travaille pour vous.' },
  { icon: FileText, title: 'CV & Lettres sur mesure', desc: 'Générez des documents professionnels adaptés à chaque offre en quelques secondes.' },
  { icon: Calendar, title: 'Suivi des entretiens', desc: 'Rappels, notes, scores — tout votre pipeline de recrutement dans un seul endroit.' },
  { icon: TrendingUp, title: 'Score de carrière', desc: 'Un indicateur unique qui mesure votre progression et vous guide vers vos objectifs.' },
  { icon: Users, title: 'Réseau & opportunités', desc: 'Découvrez des offres cachées grâce à notre réseau et nos partenariats exclusifs.' },
  { icon: Star, title: 'Accès prioritaire', desc: 'En tant que membre fondateur, vous débloquez l\'accès avant tout le monde.' },
];

const timeline = [
  { label: 'Lancement Bêta', desc: 'Premier accès pour les membres fondateurs', status: 'done' },
  { label: 'Matching IA avancé', desc: 'Algorithme de recommandation de nouvelle génération', status: 'current' },
  { label: 'Ouverture publique', desc: 'CarrièrePilot accessible à tous', status: 'upcoming' },
];

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function ComingSoonPage() {
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#060B18] text-white overflow-x-hidden">

      {/* ─── Fixed background glows ────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/4 rounded-full blur-[100px]" />
      </div>

      {/* ─── HERO — full viewport ───────────────────────────── */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-16"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Plane size={20} className="text-white" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">CarrièrePilot</span>
        </motion.div>

        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2 mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-sm text-white/70 font-medium">Accès anticipé en cours</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-extrabold leading-[1.05] tracking-tight mb-6 max-w-5xl"
        >
          <span className="bg-gradient-to-br from-white via-blue-100 to-white/70 bg-clip-text text-transparent">
            Carrière Pilote
          </span>
          <br />
          <span className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white/40">
            arrive bientôt
          </span>
        </motion.h1>

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10 max-w-2xl"
        >
          <p className="text-xl sm:text-2xl text-white/80 font-medium mb-2">
            Bienvenue{user?.firstName ? ` ${user.firstName}` : ''} 👋
          </p>
          <p className="text-white/45 text-base sm:text-lg">
            Votre inscription est confirmée. Vous faites partie des premiers à rejoindre l&apos;aventure.
          </p>
        </motion.div>

        {/* Premium gift badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="relative group mb-14"
        >
          <div className="absolute -inset-px bg-gradient-to-r from-amber-400/40 via-yellow-300/40 to-amber-400/40 rounded-2xl blur-sm opacity-60 group-hover:opacity-90 transition-opacity" />
          <div className="relative flex items-center gap-3 bg-amber-400/10 border border-amber-400/25 rounded-2xl px-6 py-4">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-heading font-bold text-amber-200 text-sm mb-0.5">Cadeau de bienvenue</p>
              <p className="text-amber-100/65 text-sm">
                <strong className="text-amber-200">7 jours Premium offerts</strong> dès le lancement officiel
              </p>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col items-center gap-2 text-white/20"
        >
          <span className="text-xs uppercase tracking-widest">Découvrir</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <ArrowDown size={16} />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── FEATURES — full width ──────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-blue-400 font-semibold text-sm uppercase tracking-widest mb-4">Fonctionnalités</p>
            <h2 className="text-4xl sm:text-5xl font-heading font-extrabold text-white/90 mb-4">
              Ce qui vous attend
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              Des outils pensés pour accélérer votre recherche d&apos;emploi
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.1}>
                <div className="group relative h-full">
                  <div className={`absolute -inset-px rounded-3xl bg-gradient-to-b ${feature.gradient} opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500`} />
                  <div className="relative h-full bg-white/[0.03] border border-white/[0.07] rounded-3xl p-8 hover:bg-white/[0.05] transition-colors duration-300">
                    <span className="inline-block text-xs font-semibold uppercase tracking-wider text-white/30 bg-white/5 rounded-full px-3 py-1 mb-6">
                      {feature.tag}
                    </span>
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-xl`}>
                      <feature.icon size={24} className="text-white" />
                    </div>
                    <h3 className="font-heading font-bold text-xl text-white/90 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-white/40 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DISCOVER — alternating full width ──────────────── */}
      <section className="relative z-10 py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-violet-400 font-semibold text-sm uppercase tracking-widest mb-4">Plateforme</p>
            <h2 className="text-4xl sm:text-5xl font-heading font-extrabold text-white/90 mb-4">
              Ce que vous allez découvrir
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              Une suite complète d&apos;outils pensés pour votre succès
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {discover.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="flex items-start gap-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-violet-500/30 group-hover:to-blue-500/30 transition-all">
                    <item.icon size={20} className="text-violet-300" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white/85 mb-1">{item.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROADMAP ─────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-cyan-400 font-semibold text-sm uppercase tracking-widest mb-4">Roadmap</p>
            <h2 className="text-4xl sm:text-5xl font-heading font-extrabold text-white/90 mb-4">
              Notre feuille de route
            </h2>
            <p className="text-white/40 text-lg">Où on en est, et où on va.</p>
          </FadeIn>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-8 left-[calc(50%/3+50%/6)] right-[calc(50%/3+50%/6)] h-px bg-gradient-to-r from-emerald-500/30 via-blue-500/30 to-white/10" style={{ left: '16.67%', right: '16.67%' }} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {timeline.map((step, i) => (
                <FadeIn key={step.label} delay={i * 0.15}>
                  <div className={`relative flex flex-col items-center text-center p-8 rounded-3xl border transition-colors
                    ${step.status === 'done' ? 'bg-emerald-500/5 border-emerald-500/20' :
                      step.status === 'current' ? 'bg-blue-500/5 border-blue-500/20' :
                      'bg-white/[0.02] border-white/[0.06]'}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold mb-5
                      ${step.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                        step.status === 'current' ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/20 animate-pulse' :
                        'bg-white/5 text-white/25'}`}
                    >
                      {step.status === 'done' ? <CheckCircle size={28} /> : `0${i + 1}`}
                    </div>
                    <h3 className={`font-heading font-bold text-lg mb-2
                      ${step.status === 'done' ? 'text-emerald-300' :
                        step.status === 'current' ? 'text-blue-300' :
                        'text-white/35'}`}
                    >
                      {step.label}
                    </h3>
                    <p className={`text-sm leading-relaxed
                      ${step.status === 'done' ? 'text-emerald-400/50' :
                        step.status === 'current' ? 'text-blue-400/50' :
                        'text-white/25'}`}
                    >
                      {step.desc}
                    </p>
                    {step.status === 'current' && (
                      <span className="mt-4 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
                        En cours
                      </span>
                    )}
                    {step.status === 'done' && (
                      <span className="mt-4 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                        Terminé ✓
                      </span>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── NOTIFICATION ────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 border-t border-white/[0.04]">
        <FadeIn className="max-w-2xl mx-auto text-center">
          <div className="relative group">
            <div className="absolute -inset-px bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-violet-600/20 rounded-3xl blur-sm" />
            <div className="relative bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.08] rounded-3xl p-10 sm:p-14">
              {!subscribed ? (
                <>
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/20">
                    <Bell size={26} className="text-white" />
                  </div>
                  <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white mb-3">
                    Soyez le premier informé
                  </h2>
                  <p className="text-white/45 mb-8 text-lg">
                    Recevez un email le jour du lancement et accédez en priorité absolue.
                  </p>
                  <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-base text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-colors"
                    />
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 whitespace-nowrap"
                    >
                      Me notifier
                    </button>
                  </form>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
                  <p className="font-heading font-bold text-2xl text-emerald-300 mb-2">C&apos;est noté !</p>
                  <p className="text-emerald-400/60">
                    Vous serez notifié à <strong className="text-emerald-300">{email}</strong> dès l&apos;ouverture.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="relative z-10 py-10 px-6 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/20">
            <Plane size={14} />
            <span className="text-xs">© {new Date().getFullYear()} CarrièrePilot · Tous droits réservés</span>
          </div>
          <div className="flex gap-6">
            <Link href="/cgu" className="text-white/20 text-xs hover:text-white/50 transition-colors">CGU</Link>
            <Link href="/confidentialite" className="text-white/20 text-xs hover:text-white/50 transition-colors">Confidentialité</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
