'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { Lock, BarChart2, Users, TrendingUp, FileText, Mail, Send, Search, Zap } from 'lucide-react';

interface StatsData {
  totalUsers: number;
  newUsersLast30Days: number;
  activeUsersLast30Days: number;
  planDistribution: { FREE: number; PRO: number; EXPERT: number };
  totalCVs: number;
  totalLetters: number;
  totalApplications: number;
  totalSearches: number;
}

function MetricCard({ label, value, icon: Icon, color, bg, note }: {
  label: string; value: number | string; icon: React.ElementType; color: string; bg: string; note?: string;
}) {
  return (
    <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[#64748B] dark:text-white/60 font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon size={18} className={color} />
        </div>
      </div>
      <div className="text-2xl font-bold text-[#1E293B] dark:text-white">{value}</div>
      {note && <div className="text-xs text-[#94A3B8] mt-1">{note}</div>}
    </div>
  );
}

export default function AdminStatistiquesPage() {
  const { user } = useAuthStore();
  const adminLevel = user?.adminLevel ?? 0;

  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
    staleTime: 2 * 60 * 1000,
    enabled: adminLevel >= 3,
  });

  if (adminLevel < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <Lock size={28} className="text-red-400" />
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-[#1E293B] dark:text-white">Accès insuffisant</h2>
          <p className="text-sm text-[#64748B] mt-1">Cette section requiert le niveau Admin 3 minimum.</p>
        </div>
      </div>
    );
  }

  const total = stats?.totalUsers ?? 0;

  return (
    <div className="space-y-6 max-w-[1100px]">
      <div>
        <h1 className="text-xl font-bold text-[#1E293B] dark:text-white">Statistiques plateforme</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Vue d&apos;ensemble des métriques clés</p>
      </div>

      {/* Utilisateurs */}
      <section>
        <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">Utilisateurs</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 animate-pulse" />
          )) : <>
            <MetricCard label="Total utilisateurs" value={stats?.totalUsers ?? '—'} icon={Users} color="text-blue-600" bg="bg-blue-50" />
            <MetricCard label="Nouveaux (30j)" value={stats?.newUsersLast30Days ?? '—'} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" note="Derniers 30 jours" />
            <MetricCard label="Actifs (30j)" value={stats?.activeUsersLast30Days ?? '—'} icon={Zap} color="text-orange-500" bg="bg-orange-50" note="Ont utilisé la plateforme" />
            <MetricCard
              label="Taux rétention 30j"
              value={total > 0 ? `${Math.round(((stats?.activeUsersLast30Days ?? 0) / total) * 100)}%` : '—'}
              icon={BarChart2}
              color="text-violet-600"
              bg="bg-violet-50"
              note="Actifs / total"
            />
          </>}
        </div>
      </section>

      {/* Plans */}
      <section>
        <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">Répartition des abonnements</h2>
        {isLoading ? (
          <div className="h-32 bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 animate-pulse" />
        ) : (
          <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: 'Plan GRATUIT', key: 'FREE' as const, color: 'bg-slate-400' },
                { label: 'Plan PRO', key: 'PRO' as const, color: 'bg-violet-500' },
                { label: 'Plan EXPERT', key: 'EXPERT' as const, color: 'bg-amber-500' },
              ].map(({ label, key, color }) => {
                const count = stats?.planDistribution?.[key] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#64748B]">{label}</span>
                      <span className="text-sm font-semibold text-[#1E293B] dark:text-white">{count}</span>
                    </div>
                    <div className="h-2 bg-[#F1F5F9] dark:bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-[#94A3B8] mt-1">{pct}% des utilisateurs</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Activité */}
      <section>
        <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">Activité totale (toutes périodes)</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 animate-pulse" />
          )) : <>
            <MetricCard label="CV importés / générés" value={stats?.totalCVs ?? '—'} icon={FileText} color="text-cyan-600" bg="bg-cyan-50" />
            <MetricCard label="Lettres générées" value={stats?.totalLetters ?? '—'} icon={Mail} color="text-pink-600" bg="bg-pink-50" />
            <MetricCard label="Candidatures créées" value={stats?.totalApplications ?? '—'} icon={Send} color="text-amber-600" bg="bg-amber-50" />
            <MetricCard label="Recherches d&apos;offres" value={stats?.totalSearches ?? '—'} icon={Search} color="text-indigo-600" bg="bg-indigo-50" />
          </>}
        </div>
      </section>
    </div>
  );
}
