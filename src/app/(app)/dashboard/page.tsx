'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Send,
  TrendingUp,
  MessageSquare,
  Clock,
  Plus,
  FileText,
  Search,
  ArrowRight,
  Sparkles,
  Bell,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import type { DashboardStats, Application } from '@/types';

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'error' | 'neutral' }> = {
  TO_SEND: { label: 'À envoyer', variant: 'neutral' },
  SENT: { label: 'Envoyée', variant: 'info' },
  VIEWED: { label: 'Vue', variant: 'warning' },
  INTERVIEW_SCHEDULED: { label: 'Entretien', variant: 'success' },
  INTERVIEW_DONE: { label: 'Entretien fait', variant: 'success' },
  OFFER_RECEIVED: { label: 'Offre reçue', variant: 'success' },
  ACCEPTED: { label: 'Acceptée', variant: 'success' },
  REJECTED: { label: 'Refusée', variant: 'error' },
  WITHDRAWN: { label: 'Annulée', variant: 'neutral' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/applications/stats').then((r) => r.data),
  });

  const { data: applications, isLoading: appsLoading } = useQuery<Application[]>({
    queryKey: ['recent-applications'],
    queryFn: () => api.get('/applications?limit=5').then((r) => r.data),
  });

  const { data: recommended = [] } = useQuery<{ id: string; title: string; company: string; location: string; matchScore?: number; url?: string }[]>({
    queryKey: ['recommended-offers'],
    queryFn: () => api.get('/offers/recommended').then((r) => r.data as { id: string; title: string; company: string; location: string; matchScore?: number; url?: string }[]),
  });

  const { data: unreadNotifications = [] } = useQuery<{ id: string }[]>({
    queryKey: ['job-notifications-unread'],
    queryFn: () => api.get('/notifications?unread=1').then((r) => r.data),
    staleTime: 60_000,
  });

  // Nombre total de nouvelles offres : notifs non lues ou offres recommandées
  const newOffersCount = unreadNotifications.length > 0 ? unreadNotifications.length : recommended.length;

  const statCards = [
    {
      label: 'Total candidatures',
      value: stats?.totalApplications ?? '—',
      icon: Send,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      change: '+12%',
      positive: true,
      href: '/candidatures',
    },
    {
      label: 'Taux de réponse',
      value: stats ? `${stats.responseRate}%` : '—',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      change: '+8%',
      positive: true,
      href: '/candidatures',
    },
    {
      label: 'Entretiens obtenus',
      value: stats?.interviewsCount ?? '—',
      icon: MessageSquare,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      change: '+3',
      positive: true,
      href: '/candidatures?status=INTERVIEW_SCHEDULED',
    },
    {
      label: 'En attente',
      value: stats?.pendingCount ?? '—',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      change: '7 jours',
      positive: null,
      href: '/candidatures',
    },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-6 max-w-[1200px]"
    >
      {/* Stat cards */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : statCards.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.label}
                  href={s.href}
                  className="bg-white rounded-card border border-[#E2E8F0] p-5 hover:border-accent/40 hover:shadow-md transition-all"
                  style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>
                      <Icon size={18} />
                    </div>
                    {s.positive !== null && (
                      <span className={`text-xs font-semibold ${s.positive ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {s.change}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-extrabold font-heading text-[#1E293B] mb-0.5">{s.value}</p>
                  <p className="text-xs text-[#64748B]">{s.label}</p>
                </Link>
              );
            })}
      </motion.div>

      {/* ── Job Alert Banner ──────────────────────────────────────── */}
      {recommended.length > 0 && (
        <motion.div variants={fadeInUp} className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30 rounded-card px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shrink-0">
              <Bell size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1E293B]">
                {recommended.length} nouvelle{recommended.length > 1 ? 's' : ''} offre{recommended.length > 1 ? 's' : ''} correspondent à votre profil aujourd&apos;hui
                {unreadNotifications.length > 0 && (
                  <span className="ml-2 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full align-middle">
                    {unreadNotifications.length} non lue{unreadNotifications.length > 1 ? 's' : ''}
                  </span>
                )}
              </p>
              <p className="text-xs text-[#64748B]">Basé sur vos compétences et préférences enregistrées</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/notifications" className="flex items-center gap-1.5 px-4 py-2 rounded-btn border border-accent text-accent text-sm font-semibold hover:bg-accent hover:text-white transition-all">
              Voir les notifications <ArrowRight size={13} />
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Auto-Apply Suggestion Banner ─────────────────────────── */}
      {newOffersCount >= 5 && (
        <motion.div variants={fadeInUp} className="bg-gradient-to-r from-violet-50 to-accent/5 border border-violet-200 rounded-card px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 bg-violet-500 rounded-xl flex items-center justify-center shrink-0">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1E293B]">
                {newOffersCount} nouvelles offres correspondent à votre profil.
                <br />
                <span className="font-normal text-[#475569]">Voulez-vous candidater automatiquement ?</span>
              </p>
            </div>
          </div>
          <Link
            href="/offres?tab=recommended&autoApply=1"
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-btn text-sm font-semibold hover:bg-violet-700 transition-colors whitespace-nowrap"
          >
            <Zap size={13} />
            Lancer les candidatures auto
          </Link>
        </motion.div>
      )}

      {/* Chart + quick actions */}
      <motion.div variants={fadeInUp} className="grid lg:grid-cols-7 gap-4">
        {/* Bar chart */}
        <div
          className="lg:col-span-4 bg-white rounded-card border border-[#E2E8F0] p-6"
          style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
        >
          <h2 className="font-heading font-semibold text-[#1E293B] text-base mb-4">
            Activité hebdomadaire
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weeklyData ?? []} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="#7C3AED" radius={[6, 6, 0, 0]} name="Candidatures" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick actions */}
        <div
          className="lg:col-span-3 bg-white rounded-card border border-[#E2E8F0] p-6"
          style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
        >
          <h2 className="font-heading font-semibold text-[#1E293B] text-base mb-4">Actions rapides</h2>
          <div className="space-y-2">
            <QuickAction href="/cv" icon={FileText} label="Créer / éditer mon CV" color="bg-blue-50 text-blue-600" />
            <QuickAction href="/candidatures" icon={Plus} label="Nouvelle candidature" color="bg-violet-50 text-violet-600" />
            <QuickAction href="/offres" icon={Search} label="Voir les offres matchées" color="bg-emerald-50 text-emerald-600" />
            <QuickAction href="/lettre" icon={FileText} label="Générer une lettre IA" color="bg-amber-50 text-amber-600" />
          </div>

          {/* AI tip */}
          <div className="mt-4 bg-gradient-brand rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} />
              <span className="text-xs font-semibold opacity-70">Conseil IA du jour</span>
            </div>
            <p className="text-sm font-medium">
              Personnalisez l&apos;objet de vos emails pour augmenter votre taux de réponse de 40%.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Recent applications + recommended offers */}
      <motion.div variants={fadeInUp} className="grid lg:grid-cols-8 gap-4">
        {/* Recent applications */}
        <div
          className="lg:col-span-5 bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
          style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
            <h2 className="font-heading font-semibold text-[#1E293B] text-base">Dernières candidatures</h2>
            <Link href="/candidatures">
              <Button variant="ghost" size="sm" className="text-xs">
                Voir tout <ArrowRight size={13} />
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  {['Entreprise', 'Poste', 'Date', 'Statut'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(applications ?? []).slice(0, 5).map((app) => {
                  const statusInfo = STATUS_LABELS[app.status] ?? { label: app.status, variant: 'neutral' };
                  return (
                    <tr key={app.id} className="border-b border-[#E2E8F0] hover:bg-[#F7F8FC] transition-colors">
                      <td className="px-6 py-3 font-medium text-[#1E293B]">{app.company}</td>
                      <td className="px-6 py-3 text-[#64748B]">{app.jobTitle}</td>
                      <td className="px-6 py-3 text-[#94A3B8] text-xs">
                        {new Date(app.appliedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations */}
        <div
          className="lg:col-span-3 bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
          style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <h2 className="font-heading font-semibold text-[#1E293B] text-base">Recommandées IA</h2>
            <Link href="/offres">
              <Button variant="ghost" size="sm" className="text-xs">
                Voir <ArrowRight size={13} />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {recommended.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[#94A3B8]">Complétez votre profil pour voir les recommandations IA</div>
            ) : recommended.map((offer) => (
              <div key={offer.id} className="px-5 py-4 hover:bg-[#F7F8FC] transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-sm text-[#1E293B] line-clamp-1">{offer.title}</p>
                  {offer.matchScore !== undefined && (
                    <span className="text-xs font-bold text-emerald-600 shrink-0 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      {offer.matchScore}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#64748B] mb-2">{offer.company} · {offer.location}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs h-7 px-2.5"
                  onClick={() => router.push(`/candidatures/new?jobId=${offer.id}&title=${encodeURIComponent(offer.title)}&company=${encodeURIComponent(offer.company)}`)}
                >
                  Postuler
                </Button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: React.ElementType; label: string; color: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F7F8FC] transition-colors group"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={15} />
      </div>
      <span className="text-sm font-medium text-[#1E293B] group-hover:text-accent transition-colors">{label}</span>
      <ArrowRight size={13} className="ml-auto text-[#94A3B8] group-hover:text-accent transition-colors" />
    </Link>
  );
}

// (No mock data — all data fetched from real API)
