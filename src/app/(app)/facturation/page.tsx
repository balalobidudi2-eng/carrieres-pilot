'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  CreditCard,
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Crown,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import toast from 'react-hot-toast';

const PLAN_ICONS = { FREE: Zap, PRO: Sparkles, EXPERT: Crown };
const PLAN_COLORS = { FREE: '#64748B', PRO: '#7C3AED', EXPERT: '#D97706' };
const PLAN_LABELS = { FREE: 'Gratuit', PRO: 'Pro', EXPERT: 'Expert' };

function formatCents(amount: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function FacturationPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: () => api.get('/billing/invoices').then((r) => r.data),
    staleTime: 60_000,
    retry: false,
  });

  const portalMutation = useMutation({
    mutationFn: () => api.post('/billing/portal').then((r) => r.data.url),
    onSuccess: (url: string) => window.open(url, '_blank', 'noopener'),
    onError: () => toast.error('Portail Stripe non disponible — configurez STRIPE_SECRET_KEY'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post('/billing/cancel'),
    onSuccess: () => {
      toast.success('Abonnement annulé — actif jusqu\'à la fin de la période');
      setCancelConfirm(false);
      qc.invalidateQueries({ queryKey: ['billing-invoices'] });
    },
    onError: () => toast.error('Erreur lors de l\'annulation'),
  });

  const reactivateMutation = useMutation({
    mutationFn: () => api.delete('/billing/cancel'),
    onSuccess: () => {
      toast.success('Abonnement réactivé !');
      qc.invalidateQueries({ queryKey: ['billing-invoices'] });
    },
    onError: () => toast.error('Erreur lors de la réactivation'),
  });

  const plan = (data?.plan ?? user?.plan ?? 'FREE') as 'FREE' | 'PRO' | 'EXPERT';
  const PlanIcon = PLAN_ICONS[plan];
  const planColor = PLAN_COLORS[plan];
  const invoices: {
    id: string; number: string | null; amount: number; currency: string;
    status: string | null; date: number; pdfUrl: string | null; hostedUrl: string | null; description: string | null;
  }[] = data?.invoices ?? [];

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6 max-w-[800px]">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center gap-3">
        <Link href="/abonnement" className="p-2 rounded-lg hover:bg-[#F7F8FC] text-[#64748B] hover:text-[#1E293B] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#1E293B]">Facturation</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Vos factures, historique de paiements et abonnement</p>
        </div>
      </motion.div>

      {/* Plan actuel */}
      <motion.div
        variants={fadeInUp}
        className="bg-white rounded-card border border-[#E2E8F0] p-6"
        style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
      >
        <h3 className="font-heading font-semibold text-[#1E293B] mb-4 border-b border-[#E2E8F0] pb-3">Plan actuel</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${planColor}18` }}
          >
            <PlanIcon size={22} style={{ color: planColor }} />
          </div>
          <div>
            <p className="font-heading font-bold text-lg text-[#1E293B]">{PLAN_LABELS[plan]}</p>
            {data?.nextRenewal && !data.cancelAtPeriodEnd && (
              <p className="text-sm text-[#64748B]">
                Prochain renouvellement : <strong>{new Date(data.nextRenewal).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </p>
            )}
            {data?.cancelAtPeriodEnd && data.nextRenewal && (
              <p className="text-sm text-amber-600 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                Annulation prévue le {new Date(data.nextRenewal).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            {plan === 'FREE' && <p className="text-sm text-[#64748B]">Gratuit · sans engagement</p>}
          </div>
          <div className="ml-auto flex gap-2 flex-wrap">
            <Link href="/abonnement">
              <Button variant="outline" size="sm">
                <Sparkles size={14} />
                Changer de plan
              </Button>
            </Link>
            {plan !== 'FREE' && (
              <Button variant="outline" size="sm" onClick={() => portalMutation.mutate()} loading={portalMutation.isPending}>
                <CreditCard size={14} />
                Moyen de paiement
              </Button>
            )}
          </div>
        </div>

        {/* Cancel / Reactivate */}
        {plan !== 'FREE' && (
          <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
            {data?.cancelAtPeriodEnd ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#64748B]">Vous pouvez annuler la résiliation et continuer à utiliser votre plan.</p>
                <Button variant="outline" size="sm" onClick={() => reactivateMutation.mutate()} loading={reactivateMutation.isPending}>
                  <RefreshCw size={13} />
                  Réactiver
                </Button>
              </div>
            ) : !cancelConfirm ? (
              <button
                className="text-xs text-[#94A3B8] hover:text-red-500 underline transition-colors"
                onClick={() => setCancelConfirm(true)}
              >
                Annuler mon abonnement
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                <p className="text-sm text-[#1E293B] flex-1">
                  Votre abonnement sera actif jusqu&apos;à la fin de la période en cours, puis repassera en Gratuit.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCancelConfirm(false)}>Non</Button>
                  <Button size="sm" onClick={() => cancelMutation.mutate()} loading={cancelMutation.isPending}
                    className="bg-red-500 hover:bg-red-600 text-white border-red-500">
                    Confirmer
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Factures */}
      <motion.div
        variants={fadeInUp}
        className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
        style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <FileText size={16} className="text-violet-600" />
          </div>
          <h3 className="font-heading font-semibold text-[#1E293B]">Historique des paiements</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-[#94A3B8]">Chargement…</div>
        ) : data?.stripeNotConfigured ? (
          <div className="p-8 text-center">
            <Shield size={32} className="text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#1E293B]">Stripe non configuré</p>
            <p className="text-xs text-[#94A3B8] mt-1">Configurez STRIPE_SECRET_KEY pour voir les factures.</p>
          </div>
        ) : data?.isDemo ? (
          <div className="p-8 text-center">
            <FileText size={32} className="text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#1E293B]">Mode démo</p>
            <p className="text-xs text-[#94A3B8] mt-1">Aucune facture pour le compte démo.</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={32} className="text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#1E293B]">Aucune facture</p>
            <p className="text-xs text-[#94A3B8] mt-1">Vos factures apparaîtront ici après votre premier paiement.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0]">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#F7F8FC] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <CheckCircle size={16} className="text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1E293B] truncate">
                    {inv.description ?? `Facture ${inv.number ?? inv.id.slice(-8)}`}
                  </p>
                  <p className="text-xs text-[#64748B]">{formatDate(inv.date)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#1E293B]">{formatCents(inv.amount, inv.currency)}</p>
                  <Badge
                    variant={inv.status === 'paid' ? 'success' : inv.status === 'open' ? 'warning' : 'default'}
                    className="text-[10px]"
                  >
                    {inv.status === 'paid' ? 'Payée' : inv.status === 'open' ? 'En attente' : inv.status ?? 'Inconnue'}
                  </Badge>
                </div>
                <div className="flex gap-2 shrink-0">
                  {inv.pdfUrl && (
                    <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" title="Télécharger PDF">
                        <Download size={13} />
                        PDF
                      </Button>
                    </a>
                  )}
                  {inv.hostedUrl && (
                    <a href={inv.hostedUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" title="Voir en ligne">
                        <ExternalLink size={13} />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Trust footer */}
      <motion.div variants={fadeInUp} className="text-center text-xs text-[#94A3B8] flex items-center justify-center gap-1.5">
        <Shield size={12} />
        Paiement sécurisé par Stripe · Données chiffrées · Annulation à tout moment
      </motion.div>
    </motion.div>
  );
}
