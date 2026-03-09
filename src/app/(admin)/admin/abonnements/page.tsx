'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { CreditCard, TrendingUp } from 'lucide-react';

interface SubscriptionsData {
  planDistribution: { FREE: number; PRO: number; EXPERT: number };
  monthlySignups: { month: string; FREE: number; PRO: number; EXPERT: number }[];
}

const MONTH_FR: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Juin',
  '07': 'Jul', '08': 'Aoû', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
};

export default function AdminAbonnementsPage() {
  const { data, isLoading } = useQuery<SubscriptionsData>({
    queryKey: ['admin-subscriptions'],
    queryFn: () => api.get('/admin/subscriptions').then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const chartData = (data?.monthlySignups ?? []).map((m) => ({
    ...m,
    label: `${MONTH_FR[m.month.slice(5)] ?? m.month.slice(5)} ${m.month.slice(2, 4)}`,
  }));

  const dist = data?.planDistribution ?? { FREE: 0, PRO: 0, EXPERT: 0 };
  const total = dist.FREE + dist.PRO + dist.EXPERT || 1;
  const payants = dist.PRO + dist.EXPERT;

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div>
        <h1 className="text-xl font-bold text-[#1E293B] dark:text-white">Abonnements</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Répartition des plans et évolution</p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Plan GRATUIT', value: dist.FREE, pct: Math.round((dist.FREE / total) * 100), color: 'text-slate-700', bar: 'bg-slate-400' },
          { label: 'Plan PRO', value: dist.PRO, pct: Math.round((dist.PRO / total) * 100), color: 'text-blue-700', bar: 'bg-blue-500' },
          { label: 'Plan EXPERT', value: dist.EXPERT, pct: Math.round((dist.EXPERT / total) * 100), color: 'text-violet-700', bar: 'bg-violet-500' },
        ].map((c) => (
          <div key={c.label} className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
            {isLoading ? (
              <div className="h-16 bg-[#F1F5F9] rounded animate-pulse" />
            ) : (
              <>
                <div className={`text-3xl font-bold mb-1 ${c.color}`}>{c.value}</div>
                <div className="text-sm text-[#64748B] mb-3">{c.label}</div>
                <div className="h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
                  <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${c.pct}%` }} />
                </div>
                <div className="text-xs text-[#94A3B8] mt-1">{c.pct}% des utilisateurs</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* KPI payants */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <CreditCard size={20} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1E293B] dark:text-white">{payants}</div>
            <div className="text-sm text-[#64748B]">Abonnements payants</div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <TrendingUp size={20} className="text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#1E293B] dark:text-white">
              {total > 0 ? Math.round((payants / total) * 100) : 0}%
            </div>
            <div className="text-sm text-[#64748B]">Taux de conversion</div>
          </div>
        </div>
      </div>

      {/* Graphique inscriptions mensuelles */}
      <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
        <h2 className="text-sm font-semibold text-[#1E293B] dark:text-white mb-4">
          Inscriptions par mois (6 derniers mois)
        </h2>
        {isLoading ? (
          <div className="h-48 bg-[#F1F5F9] rounded animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="FREE" name="Gratuit" fill="#94A3B8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="PRO" name="Pro" fill="#3B82F6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="EXPERT" name="Expert" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
