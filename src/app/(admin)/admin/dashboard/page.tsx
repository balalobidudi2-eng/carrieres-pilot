'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Users, UserPlus, TrendingUp, CreditCard, FileText, Mail, Send, Search, Clock } from 'lucide-react';
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

      {/* Dernières inscriptions */}
      <div>
        <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3 flex items-center gap-2">
          <Clock size={14} />
          Dernières inscriptions
        </h2>
        <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/5">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Utilisateur</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Inscrit le</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Dernière connexion</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentSignups ?? []).map((u) => (
                <tr key={u.id} className="border-b border-[#F1F5F9] dark:border-white/5 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1E293B] dark:text-white">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3 text-[#64748B]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.plan === 'EXPERT' ? 'bg-amber-100 text-amber-700' :
                      u.plan === 'PRO' ? 'bg-violet-100 text-violet-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{u.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-[#64748B] text-xs">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-[#64748B] text-xs">
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                      : <span className="text-[#CBD5E1]">—</span>}
                  </td>
                </tr>
              ))}
              {(!stats?.recentSignups?.length) && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-[#94A3B8] text-sm">Aucune inscription récente</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dernières candidatures */}
      <div>
        <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-3 flex items-center gap-2">
          <Send size={14} />
          Dernières candidatures
        </h2>
        <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/5">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Poste</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Entreprise</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Candidat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentApplications ?? []).map((a) => (
                <tr key={a.id} className="border-b border-[#F1F5F9] dark:border-white/5 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1E293B] dark:text-white truncate max-w-[180px]">{a.jobTitle}</td>
                  <td className="px-4 py-3 text-[#64748B] truncate max-w-[140px]">{a.company}</td>
                  <td className="px-4 py-3 text-[#64748B] text-xs">{a.user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      a.status === 'OFFER' ? 'bg-green-100 text-green-700' :
                      a.status === 'INTERVIEW' ? 'bg-blue-100 text-blue-700' :
                      a.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                      a.status === 'APPLIED' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {a.status === 'OFFER' ? 'Offre' :
                       a.status === 'INTERVIEW' ? 'Entretien' :
                       a.status === 'REJECTED' ? 'Refusé' :
                       a.status === 'APPLIED' ? 'Postulé' :
                       a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#64748B] text-xs">
                    {new Date(a.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {(!stats?.recentApplications?.length) && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-[#94A3B8] text-sm">Aucune candidature récente</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
