'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  CreditCard,
  ExternalLink,
  Shield,
  BarChart2,
  FileText,
  Mail,
  Search,
  Bot,
  Send,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import toast from 'react-hot-toast';

interface Plan {
  id: 'FREE' | 'PRO' | 'EXPERT';
  name: string;
  price: number;
  priceAnnual?: number;
  description: string;
  icon: typeof Zap;
  color: string;
  features: string[];
  limits: { cvs: number; letters: number; applications: number };
  highlighted?: boolean;
  stripePriceId?: string;
}

const PLANS: Plan[] = [
  {
    id: 'FREE',
    name: 'Gratuit',
    price: 0,
    description: 'Parfait pour commencer votre recherche',
    icon: Zap,
    color: '#64748B',
    features: [
      '1 CV IA / jour',
      '1 lettre IA / jour',
      '10 recherches / jour',
      '5 matchings IA / jour',
      'Tableau Kanban',
    ],
    limits: { cvs: 1, letters: 1, applications: 10 },
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 14.99,
    priceAnnual: 11.99,
    description: 'Pour maximiser vos chances de décrocher le job idéal',
    icon: Sparkles,
    color: '#7C3AED',
    highlighted: true,
    features: [
      '5 CV IA / jour',
      '5 lettres IA / jour',
      '100 recherches / jour',
      '50 matchings IA / jour',
      '50 candidatures auto / jour',
      'Envoi email SMTP',
      'Automatisation formulaires',
      'Préparation entretiens IA',
      'Support prioritaire',
    ],
    limits: { cvs: 5, letters: 5, applications: 100 },
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
  {
    id: 'EXPERT',
    name: 'Expert',
    price: 29.99,
    priceAnnual: 23.99,
    description: 'La solution complète pour les profils exigeants',
    icon: Crown,
    color: '#D97706',
    features: [
      '50 CV IA / jour',
      '50 lettres IA / jour',
      '500 recherches / jour',
      '200 matchings IA / jour',
      '100 candidatures auto / jour',
      'Envoi email SMTP',
      'Automatisation formulaires',
      'Préparation entretiens IA illimitée',
      'Analytics avancées + Support dédié',
    ],
    limits: { cvs: 50, letters: 50, applications: 500 },
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_EXPERT_PRICE_ID,
  },
];

export default function AbonnementPage() {
  const { user } = useAuthStore();
  const currentPlan = (user?.plan ?? 'FREE') as 'FREE' | 'PRO' | 'EXPERT';

  const { data: usageData } = useQuery({
    queryKey: ['user-usage'],
    queryFn: () => api.get('/users/usage').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: historyData } = useQuery({
    queryKey: ['user-usage-history'],
    queryFn: () => api.get('/users/usage/history').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: billingStatus } = useQuery({
    queryKey: ['billing-status'],
    queryFn: () => api.get('/billing/status').then((r) => r.data),
    retry: false,
  });

  const checkoutMutation = useMutation({
    mutationFn: (plan: 'PRO' | 'EXPERT') =>
      api.post('/billing/checkout', { plan }).then((r) => r.data.url),
    onSuccess: (url: string) => window.location.href = url,
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? '';
      if (msg.includes('configuré') || msg.includes('Stripe')) {
        toast.error('Le paiement en ligne n\'est pas encore disponible. Contactez-nous pour activer votre plan manuellement.');
      } else {
        toast.error('Erreur lors de la redirection vers le paiement');
      }
    },
  });

  const router = useRouter();

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-8 max-w-[1000px]">
      {/* Header */}
      <motion.div variants={fadeInUp} className="text-center">
        <h2 className="font-heading text-2xl font-bold text-[#1E293B]">Votre abonnement</h2>
        <p className="text-sm text-[#64748B] mt-1">Choisissez le plan adapté à votre recherche d&apos;emploi</p>
      </motion.div>

      {/* Current plan banner */}
      {billingStatus?.nextRenewal && (
        <motion.div variants={fadeInUp} className="bg-accent/5 border border-accent/20 rounded-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <Shield size={18} className="text-accent shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-[#1E293B]">Plan {currentPlan} actif</p>
            <p className="text-xs text-[#64748B]">
              Prochain renouvellement : {new Date(billingStatus.nextRenewal).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="self-start sm:self-auto"
            onClick={() => router.push('/facturation')}
          >
            <CreditCard size={14} />
            Gérer
          </Button>
        </motion.div>
      )}

      {/* Plans grid */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id;
          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: plan.highlighted ? -6 : -3 }}
              transition={{ duration: 0.2 }}
              className={`relative bg-white rounded-card border p-6 flex flex-col ${
                plan.highlighted
                  ? 'border-accent ring-2 ring-accent/20'
                  : 'border-[#E2E8F0]'
              }`}
              style={{ boxShadow: plan.highlighted ? '0 8px 40px rgba(124,58,237,0.15)' : '0 4px 32px rgba(15,52,96,0.08)' }}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-accent to-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    ✦ Recommandé
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${plan.color}1A` }}
                >
                  <Icon size={18} style={{ color: plan.color }} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-[#1E293B]">{plan.name}</h3>
                </div>
                {isCurrent && <Badge variant="success" className="ml-auto">Actuel</Badge>}
              </div>

              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold font-heading text-[#1E293B]">{plan.price === 0 ? 'Gratuit' : `${plan.price.toFixed(2).replace('.', ',')}€`}</span>
                  {plan.price > 0 && <span className="text-xs text-[#94A3B8]">/mois</span>}
                </div>
                {plan.priceAnnual && (
                  <p className="text-xs text-[#64748B] mt-0.5">
                    ou {plan.priceAnnual}€/mois en annuel{' '}
                    <span className="text-green-600 font-semibold">(-21%)</span>
                  </p>
                )}
              </div>

              <p className="text-xs text-[#64748B] mb-4 leading-relaxed">{plan.description}</p>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[#1E293B]">
                    <Check size={13} className="text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="outline" disabled className="w-full">
                  Plan actuel
                </Button>
              ) : plan.price === 0 ? (
                <Button variant="outline" className="w-full" disabled>
                  Gratuit
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  onClick={() => plan.id !== 'FREE' && checkoutMutation.mutate(plan.id as 'PRO' | 'EXPERT')}
                  loading={checkoutMutation.isPending}
                >
                  Choisir {plan.name}
                </Button>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Billing portal */}
      {currentPlan !== 'FREE' && (
        <motion.div variants={fadeInUp} className="bg-white rounded-card border border-[#E2E8F0] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}>
          <div>
            <p className="font-semibold text-sm text-[#1E293B]">Gérer votre abonnement</p>
            <p className="text-xs text-[#64748B] mt-0.5">Modifier votre moyen de paiement, télécharger vos factures, annuler</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/facturation')} className="self-start sm:self-auto">
            <ExternalLink size={14} />
            Facturation & factures
          </Button>
        </motion.div>
      )}

      {/* Trust */}
      <motion.div variants={fadeInUp} className="text-center text-xs text-[#94A3B8] flex items-center justify-center gap-1.5">
        <Shield size={12} />
        Paiement sécurisé par Stripe · Annulation à tout moment · Données 100% privées
      </motion.div>

      {/* Quota tracking dashboard */}
      <motion.div variants={fadeInUp} className="space-y-5">
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-accent" />
          <h2 className="font-heading text-lg font-bold text-[#1E293B]">Vos quotas journaliers</h2>
        </div>

        {/* Progress bars */}
        <div className="bg-white rounded-card border border-[#E2E8F0] p-5 space-y-4" style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}>
          {[
            { key: 'cvGeneration', limitKey: 'cv_generation', label: 'CV générés', icon: FileText, color: 'bg-cyan-500' },
            { key: 'coverLetter', limitKey: 'cover_letter', label: 'Lettres de motivation', icon: Mail, color: 'bg-pink-500' },
            { key: 'jobSearch', limitKey: 'job_search', label: "Recherches d'offres", icon: Search, color: 'bg-indigo-500' },
            { key: 'aiMatching', limitKey: 'ai_matching', label: 'Matchings IA', icon: Bot, color: 'bg-violet-500' },
            { key: 'autoApply', limitKey: 'auto_apply', label: 'Candidatures auto', icon: Send, color: 'bg-amber-500' },
            { key: 'interviewQuestions', limitKey: 'interview_questions', label: 'Simulations entretien', icon: Mic, color: 'bg-emerald-500' },
          ].map(({ key, limitKey, label, icon: Icon, color }) => {
            const limit = usageData?.limits?.dailyLimits?.[limitKey] ?? 0;
            const used = usageData?.daily?.[key] ?? 0;
            const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
            const remaining = limit > 0 ? Math.max(0, limit - used) : 0;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[#1E293B]">
                    <Icon size={14} className="text-[#64748B]" />
                    {label}
                  </div>
                  <div className="text-xs text-[#64748B]">
                    {limit > 0 ? (
                      <><span className="font-semibold text-[#1E293B]">{used}</span> / {limit} · <span className={remaining === 0 ? 'text-red-500 font-semibold' : 'text-emerald-600 font-semibold'}>{remaining} restants</span></>
                    ) : (
                      <span className="text-[#CBD5E1]">Non disponible sur ce plan</span>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  {limit > 0 && (
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-red-400' : color}`}
                      style={{ width: `${pct}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Usage history calendar */}
        {historyData?.history?.length > 0 && (
          <div className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden" style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}>
            <div className="px-5 py-3 border-b border-[#F1F5F9]">
              <h3 className="text-sm font-semibold text-[#1E293B]">Historique d&apos;utilisation (30 derniers jours)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B]">Date</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-[#64748B]">CV</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-[#64748B]">Lettres</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-[#64748B]">Recherches</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-[#64748B]">Matching</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-[#64748B]">Auto</th>
                  </tr>
                </thead>
                <tbody>
                  {(historyData.history as { date: string; cvGeneration: number; coverLetter: number; jobSearch: number; aiMatching: number; autoApply: number }[]).map((row) => (
                    <tr key={row.date} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-2.5 text-[#64748B] text-xs font-medium">
                        {new Date(row.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      </td>
                      {[row.cvGeneration, row.coverLetter, row.jobSearch, row.aiMatching, row.autoApply].map((v, i) => (
                        <td key={i} className="text-center px-3 py-2.5">
                          {v > 0 ? <span className="text-xs font-semibold text-[#1E293B]">{v}</span> : <span className="text-[#CBD5E1] text-xs">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
