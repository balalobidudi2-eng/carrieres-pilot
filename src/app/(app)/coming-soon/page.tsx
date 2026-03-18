'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Sparkles, Target, Compass, Shield, Bell, CheckCircle, Plane } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

const features = [
  {
    icon: Target,
    title: 'Matching intelligent',
    description: 'Notre algorithme analyse votre profil et vos compétences pour vous proposer les offres les plus pertinentes.',
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    icon: Compass,
    title: 'Parcours carrière optimisé',
    description: 'Un tableau de bord complet pour suivre vos candidatures, entretiens et progression vers votre objectif.',
    gradient: 'from-violet-500 to-purple-400',
  },
  {
    icon: Shield,
    title: 'Outils exclusifs',
    description: 'Générateur de CV, lettres de motivation IA, préparation aux entretiens et suivi automatisé.',
    gradient: 'from-amber-500 to-orange-400',
  },
];

const timeline = [
  { label: 'Lancement Beta', status: 'done' },
  { label: 'Matching IA avancé', status: 'current' },
  { label: 'App mobile', status: 'upcoming' },
  { label: 'Ouverture publique', status: 'upcoming' },
];

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
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F1C] via-[#0F1B33] to-[#0D1226] text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-3xl" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Header / Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-3 mb-16"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Plane size={20} className="text-white" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">CarrièrePilot</span>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-sm text-white/70 font-medium">Accès anticipé</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-extrabold leading-tight mb-6">
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Carrière Pilot
            </span>
            <br />
            <span className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white/60">
              arrive bientôt
            </span>
          </h1>

          {/* Personalized welcome */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="max-w-xl mx-auto"
          >
            <p className="text-lg sm:text-xl text-white/80 mb-3">
              Bienvenue{user?.firstName ? ` ${user.firstName}` : ''} 👋
            </p>
            <p className="text-white/50 text-base">
              Votre inscription est confirmée. Vous faites partie des premiers à rejoindre l&apos;aventure.
            </p>
          </motion.div>
        </motion.div>

        {/* Premium Gift Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="max-w-lg mx-auto mb-20"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-gradient-to-br from-amber-400/10 to-yellow-300/5 border border-amber-400/20 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                  <Sparkles size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-amber-200 mb-1">
                    Cadeau de bienvenue
                  </h3>
                  <p className="text-amber-100/70 text-sm leading-relaxed">
                    En tant que membre fondateur, vous bénéficierez de <strong className="text-amber-200">7 jours gratuits en mode Premium</strong> dès le lancement officiel.
                    Accès illimité à toutes les fonctionnalités.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mb-20"
        >
          <h2 className="text-center font-heading font-bold text-2xl sm:text-3xl mb-3 text-white/90">
            Ce qui vous attend
          </h2>
          <p className="text-center text-white/40 text-sm mb-10 max-w-md mx-auto">
            Des outils pensés pour accélérer votre recherche d&apos;emploi
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.15, duration: 0.5 }}
                className="group relative"
              >
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] transition-colors duration-300">
                  <div className={`w-11 h-11 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <feature.icon size={20} className="text-white" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-white/90 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline / Roadmap */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mb-20"
        >
          <h2 className="text-center font-heading font-bold text-2xl sm:text-3xl mb-10 text-white/90">
            Notre feuille de route
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0">
            {timeline.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                    ${step.status === 'done' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      step.status === 'current' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse' :
                      'bg-white/5 text-white/30 border border-white/10'}`}
                  >
                    {step.status === 'done' ? <CheckCircle size={18} /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap
                    ${step.status === 'done' ? 'text-emerald-400' :
                      step.status === 'current' ? 'text-blue-400' :
                      'text-white/30'}`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < timeline.length - 1 && (
                  <div className="hidden sm:block w-16 h-px bg-white/10 mx-3 mt-[-18px]" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Notification Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="max-w-md mx-auto text-center mb-16"
        >
          {!subscribed ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Bell size={18} className="text-violet-400" />
                <h3 className="font-heading font-semibold text-lg text-white/90">
                  Être notifié au lancement
                </h3>
              </div>
              <p className="text-white/40 text-sm mb-5">
                Recevez un email le jour J et accédez en priorité.
              </p>
              <form onSubmit={handleNotify} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 whitespace-nowrap"
                >
                  Me notifier
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6"
            >
              <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
              <p className="font-heading font-bold text-emerald-300 mb-1">C&apos;est noté !</p>
              <p className="text-emerald-400/60 text-sm">
                Vous serez notifié à <strong>{email}</strong> dès l&apos;ouverture.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="text-center"
        >
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} CarrièrePilot · Tous droits réservés
          </p>
          <div className="flex justify-center gap-4 mt-3">
            <Link href="/cgu" className="text-white/20 text-xs hover:text-white/40 transition-colors">CGU</Link>
            <Link href="/confidentialite" className="text-white/20 text-xs hover:text-white/40 transition-colors">Confidentialité</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
