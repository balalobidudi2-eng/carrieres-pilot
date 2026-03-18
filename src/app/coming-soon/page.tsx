'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Sparkles, Target, Compass, Shield, Bell, CheckCircle, Plane, Zap, FileText, Calendar, ArrowDown, Star, Users, TrendingUp, LogOut, Clock } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

const TIMER_KEY = 'cp_coming_soon_start';
const DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 72 heures

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

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function useCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let start = parseInt(localStorage.getItem(TIMER_KEY) ?? '', 10);
    if (!start || isNaN(start)) {
      start = Date.now();
      localStorage.setItem(TIMER_KEY, String(start));
    }

    const tick = () => {
      const diff = start + DURATION_MS - Date.now();
      setRemaining(Math.max(0, diff));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (remaining === null) return null;

  const totalSec = Math.floor(remaining / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { d, h, m, s, expired: remaining === 0 };
}

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
  const { user, logout } = useAuthStore();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const countdown = useCountdown();

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  return (
    <div className="min-h-screen w-full bg-white text-gray-900 overflow-x-hidden">

      {/* â”€â”€â”€ Subtle background tint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[700px] h-[500px] bg-blue-50 rounded-full blur-[140px] opacity-70" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-violet-50 rounded-full blur-[140px] opacity-60" />
      </div>

      {/* â”€â”€â”€ Top bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
            <Plane size={15} className="text-white" />
          </div>
          <span className="font-heading font-bold text-base tracking-tight text-gray-900">CarrièrePilot</span>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-500 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl px-4 py-2 transition-all disabled:opacity-50"
        >
          <LogOut size={15} />
          {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
        </button>
      </div>

      {/* â”€â”€â”€ HERO â€” full viewport â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center">

        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-5 py-2 mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-sm text-emerald-700 font-medium">Accès anticipé en cours</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl font-heading font-extrabold leading-[1.05] tracking-tight mb-6 max-w-4xl"
        >
          <span className="bg-gradient-to-br from-blue-600 via-violet-600 to-blue-700 bg-clip-text text-transparent">
            Carrière Pilote
          </span>
          <br />
          <span className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-400">
            arrive bientôt
          </span>
        </motion.h1>

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-10 max-w-2xl"
        >
          <p className="text-xl sm:text-2xl text-gray-700 font-medium mb-2">
            Bienvenue{user?.firstName ? ` ${user.firstName}` : ''} 👋
          </p>
          <p className="text-gray-400 text-base sm:text-lg">
            Votre inscription est confirmée. Vous faites partie des premiers à rejoindre l&apos;aventure.
          </p>
        </motion.div>

        {/* â”€â”€ TIMER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-10"
          >
            <div className="inline-flex flex-col items-center bg-gradient-to-br from-blue-600 to-violet-600 rounded-3xl px-8 py-6 shadow-xl shadow-blue-500/20">
              <div className="flex items-center gap-2 text-blue-100 mb-3">
                <Clock size={15} />
                <span className="text-xs font-semibold uppercase tracking-widest">
                  {countdown.expired ? 'Accès en cours d\'activation' : 'Accès anticipé'}
                </span>
              </div>
              {!countdown.expired ? (
                <div className="flex items-end gap-3">
                  {[
                    { value: pad(countdown.d), label: 'j' },
                    { value: pad(countdown.h), label: 'h' },
                    { value: pad(countdown.m), label: 'min' },
                    { value: pad(countdown.s), label: 'sec' },
                  ].map((unit, i) => (
                    <div key={unit.label} className="flex items-end gap-1">
                      {i > 0 && <span className="text-blue-300 text-3xl font-bold mb-1 leading-none">:</span>}
                      <div className="flex flex-col items-center">
                        <span className="text-4xl sm:text-5xl font-heading font-extrabold text-white tabular-nums leading-none">
                          {unit.value}
                        </span>
                        <span className="text-blue-200 text-xs mt-1 font-medium">{unit.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-2xl font-bold text-white">🎉 C&apos;est l&apos;heure !</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Premium gift */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="relative group mb-14"
        >
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-4 shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-400/30">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-heading font-bold text-amber-700 text-sm mb-0.5">Cadeau de bienvenue</p>
              <p className="text-amber-600/80 text-sm">
                <strong className="text-amber-700">7 jours Premium offerts</strong> dès le lancement officiel
              </p>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-col items-center gap-2 text-gray-300"
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

      {/* â”€â”€â”€ FEATURES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative z-10 py-24 px-6 bg-gray-50/60">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-4">Fonctionnalités</p>
            <h2 className="text-4xl sm:text-5xl font-heading font-extrabold text-gray-900 mb-4">
              Ce qui vous attend
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Des outils pensés pour accélérer votre recherche d&apos;emploi
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.1}>
                <div className="group relative h-full">
                  <div className="relative h-full bg-white border border-gray-100 rounded-3xl p-8 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
                    <span className="inline-block text-xs font-semibold uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3 py-1 mb-6">
                      {feature.tag}
                    </span>
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                      <feature.icon size={24} className="text-white" />
                    </div>
                    <h3 className="font-heading font-bold text-xl text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ DISCOVER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative z-10 py-24 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-violet-600 font-semibold text-sm uppercase tracking-widest mb-4">Plateforme</p>
            <h2 className="text-4xl sm:text-5xl font-heading font-extrabold text-gray-900 mb-4">
              Ce que vous allez découvrir
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Une suite complète d&apos;outils pensés pour votre succès
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {discover.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="flex items-start gap-5 bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-blue-100 border border-violet-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-violet-200 group-hover:to-blue-200 transition-all">
                    <item.icon size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ ROADMAP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative z-10 py-24 px-6 bg-gray-50/60 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-cyan-600 font-semibold text-sm uppercase tracking-widest mb-4">Roadmap</p>
            <h2 className="text-4xl sm:text-5xl font-heading font-extrabold text-gray-900 mb-4">
              Notre feuille de route
            </h2>
            <p className="text-gray-400 text-lg">Où on en est, et où on va.</p>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {timeline.map((step, i) => (
              <FadeIn key={step.label} delay={i * 0.15}>
                <div className={`relative flex flex-col items-center text-center p-8 rounded-3xl border transition-colors
                  ${step.status === 'done' ? 'bg-emerald-50 border-emerald-200' :
                    step.status === 'current' ? 'bg-blue-50 border-blue-200' :
                    'bg-white border-gray-100'}`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold mb-5
                    ${step.status === 'done' ? 'bg-emerald-100 text-emerald-600' :
                      step.status === 'current' ? 'bg-blue-100 text-blue-600 ring-4 ring-blue-100' :
                      'bg-gray-100 text-gray-400'}`}
                  >
                    {step.status === 'done' ? <CheckCircle size={28} /> : `0${i + 1}`}
                  </div>
                  <h3 className={`font-heading font-bold text-lg mb-2
                    ${step.status === 'done' ? 'text-emerald-700' :
                      step.status === 'current' ? 'text-blue-700' :
                      'text-gray-400'}`}
                  >
                    {step.label}
                  </h3>
                  <p className={`text-sm leading-relaxed
                    ${step.status === 'done' ? 'text-emerald-600/70' :
                      step.status === 'current' ? 'text-blue-600/70' :
                      'text-gray-400'}`}
                  >
                    {step.desc}
                  </p>
                  {step.status === 'current' && (
                    <span className="mt-4 text-xs font-semibold text-blue-600 bg-blue-100 border border-blue-200 rounded-full px-3 py-1">
                      En cours
                    </span>
                  )}
                  {step.status === 'done' && (
                    <span className="mt-4 text-xs font-semibold text-emerald-600 bg-emerald-100 border border-emerald-200 rounded-full px-3 py-1">
                      Terminé ✓
                    </span>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ NOTIFICATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative z-10 py-24 px-6 border-t border-gray-100">
        <FadeIn className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-3xl p-10 sm:p-14 shadow-2xl shadow-blue-500/20">
            {!subscribed ? (
              <>
                <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Bell size={26} className="text-white" />
                </div>
                <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white mb-3">
                  Soyez le premier informé
                </h2>
                <p className="text-blue-100/80 mb-8 text-lg">
                  Recevez un email le jour du lancement et accédez en priorité absolue.
                </p>
                <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="flex-1 bg-white/15 border border-white/20 rounded-xl px-5 py-4 text-base text-white placeholder:text-blue-200/60 focus:outline-none focus:border-white/50 focus:bg-white/20 transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-white hover:bg-blue-50 text-blue-700 font-bold text-base px-8 py-4 rounded-xl transition-all shadow-lg whitespace-nowrap"
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
                <CheckCircle size={48} className="text-white mx-auto mb-4" />
                <p className="font-heading font-bold text-2xl text-white mb-2">C&apos;est noté !</p>
                <p className="text-blue-100/70">
                  Vous serez notifié à <strong className="text-white">{email}</strong> dès l&apos;ouverture.
                </p>
              </motion.div>
            )}
          </div>
        </FadeIn>
      </section>

      {/* â”€â”€â”€ FOOTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <footer className="relative z-10 py-10 px-6 border-t border-gray-100 bg-gray-50/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Plane size={14} />
            <span className="text-xs">© {new Date().getFullYear()} CarrièrePilot · Tous droits réservés</span>
          </div>
          <div className="flex gap-6">
            <Link href="/cgu" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">CGU</Link>
            <Link href="/confidentialite" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">Confidentialité</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
