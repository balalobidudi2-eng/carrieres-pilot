'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Users, UserPlus, TrendingUp, CreditCard, FileText, Mail, Send, Search } from 'lucide-react';
import type { AdminStats } from '@/types';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  sublabel?: string;
}

function StatCard({ label, value, icon: Icon, color, bg, sublabel }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[#64748B] dark:text-white/60 font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon size={18} className={color} />
        </div>
      </div>
      <div className="text-2xl font-bold text-[#1E293B] dark:text-white">{value}</div>
      {sublabel && <div className="text-xs text-[#94A3B8] mt-1">{sublabel}</div>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const planCards = [
    { label: 'Plan GRATUIT', value: stats?.planDistribution?.FREE ?? '—', color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: 'Plan PRO', value: stats?.planDistribution?.PRO ?? '—', color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Plan EXPERT', value: stats?.planDistribution?.EXPERT ?? '—', color: 'text-violet-600', bg: 'bg-violet-100' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-[#1E293B] dark:text-white">Dashboard Administrateur</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-xl font-bold text-[#1E293B] dark:text-white">Dashboard Administrateur</h1>
        <p className="text-sm text-[#64748B] mt-1">Vue d'ensemble de la plateforme</p>
      </div>

      {/* Statistiques utilisateurs */}
      <div>
        <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3">Utilisateurs</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total utilisateurs" value={stats?.totalUsers ?? '—'} icon={Users} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="Nouveaux (30j)" value={stats?.newUsersLast30Days ?? '—'} icon={UserPlus} color="text-emerald-600" bg="bg-emerald-50" sublabel="Derniers 30 jours" />
          <StatCard label="Actifs (30j)" value={stats?.activeUsersLast30Days ?? '—'} icon={TrendingUp} color="text-orange-600" bg="bg-orange-50" sublabel="Derniers 30 jours" />
          <StatCard label="Abonnements payants" value={(stats?.planDistribution?.PRO ?? 0) + (stats?.planDistribution?.EXPERT ?? 0)} icon={CreditCard} color="text-violet-600" bg="bg-violet-50" />
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3">Répartition des plans</h2>
        <div className="grid grid-cols-3 gap-4">
          {planCards.map((c) => (
            <div key={c.label} className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
              <div className={`text-2xl font-bold mb-1 ${c.color}`}>{c.value}</div>
              <div className="text-sm text-[#64748B]">{c.label}</div>
              {stats && stats.totalUsers > 0 && (
                <div className="mt-2 h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.bg.replace('bg-', 'bg-').replace('-100', '-400')}`}
                    style={{ width: `${Math.round(((Number(c.value) || 0) / stats.totalUsers) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activité plateforme */}
      <div>
        <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3">Activité plateforme (total)</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="CV importés/générés" value={stats?.totalCVs ?? '—'} icon={FileText} color="text-cyan-600" bg="bg-cyan-50" />
          <StatCard label="Lettres générées" value={stats?.totalLetters ?? '—'} icon={Mail} color="text-pink-600" bg="bg-pink-50" />
          <StatCard label="Candidatures" value={stats?.totalApplications ?? '—'} icon={Send} color="text-amber-600" bg="bg-amber-50" />
          <StatCard label="Recherches d'offres" value={stats?.totalSearches ?? '—'} icon={Search} color="text-indigo-600" bg="bg-indigo-50" />
        </div>
      </div>
    </div>
  );
}
