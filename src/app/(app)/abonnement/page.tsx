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
    price: 19.99,
    priceAnnual: 15.99,
    description: 'Pour maximiser vos chances de décrocher le job idéal',
    icon: Sparkles,
    color: '#7C3AED',
    highlighted: true,
    features: [
      '5 CV IA / jour',
      '5 lettres IA / jour',
      '100 recherches / jour',
      '50 matchings IA / jour',
      '10 candidatures auto / jour',
      'Envoi email SMTP',
      'Automatisation formulaires',
      'Support prioritaire',
    ],
    limits: { cvs: 5, letters: 5, applications: 100 },
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
  {
    id: 'EXPERT',
    name: 'Expert',
    price: 34.99,
    priceAnnual: 27.99,
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
      'Analytics avancées + Support dédié',
    ],
    limits: { cvs: 50, letters: 50, applications: 500 },
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_EXPERT_PRICE_ID,
  },
];

export default function AbonnementPage() {
  const { user } = useAuthStore();
  const currentPlan = (user?.plan ?? 'FREE') as 'FREE' | 'PRO' | 'EXPERT';

  const { data: billingStatus } = useQuery({
    queryKey: ['billing-status'],
    queryFn: () => api.get('/billing/status').then((r) => r.data),
    retry: false,
  });

  const checkoutMutation = useMutation({
    mutationFn: (plan: 'PRO' | 'EXPERT') =>
      api.post('/billing/checkout', { plan }).then((r) => r.data.url),
    onSuccess: (url: string) => window.location.href = url,
    onError: () => toast.error('Erreur lors de la redirection vers le paiement'),
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
        <motion.div variants={fadeInUp} className="bg-accent/5 border border-accent/20 rounded-card p-4 flex items-center gap-3">
          <Shield size={18} className="text-accent shrink-0" />
          <div>
            <p className="font-semibold text-sm text-[#1E293B]">Plan {currentPlan} actif</p>
            <p className="text-xs text-[#64748B]">
              Prochain renouvellement : {new Date(billingStatus.nextRenewal).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => router.push('/facturation')}
          >
            <CreditCard size={14} />
            Gérer
          </Button>
        </motion.div>
      )}

      {/* Plans grid */}
      <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-5">
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
        <motion.div variants={fadeInUp} className="bg-white rounded-card border border-[#E2E8F0] p-5 flex items-center justify-between" style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}>
          <div>
            <p className="font-semibold text-sm text-[#1E293B]">Gérer votre abonnement</p>
            <p className="text-xs text-[#64748B] mt-0.5">Modifier votre moyen de paiement, télécharger vos factures, annuler</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/facturation')}>
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
    </motion.div>
  );
}
