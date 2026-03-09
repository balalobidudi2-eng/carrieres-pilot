'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { FileText, Mail, Send, Search, Cpu, MessageSquare } from 'lucide-react';

interface ActivityData {
  daily: {
    date: string;
    cvGeneration: number;
    coverLetter: number;
    jobSearch: number;
    application: number;
    aiMatching: number;
    interviewQuestions: number;
  }[];
  totals: {
    cvGeneration: number;
    coverLetter: number;
    jobSearch: number;
    application: number;
    aiMatching: number;
    interviewQuestions: number;
  };
}

export default function AdminActivitePage() {
  const { data, isLoading } = useQuery<ActivityData>({
    queryKey: ['admin-activity'],
    queryFn: () => api.get('/admin/activity').then((r) => r.data),
    staleTime: 60 * 1000,
  });

  const totals = data?.totals;
  const totalCards = [
    { label: 'Générations CV', value: totals?.cvGeneration ?? 0, icon: FileText, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Lettres générées', value: totals?.coverLetter ?? 0, icon: Mail, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Recherches d\'offres', value: totals?.jobSearch ?? 0, icon: Search, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Candidatures', value: totals?.application ?? 0, icon: Send, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Matching IA', value: totals?.aiMatching ?? 0, icon: Cpu, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Questions entretien', value: totals?.interviewQuestions ?? 0, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const chartData = (data?.daily ?? []).map((d) => ({
    ...d,
    label: d.date.slice(5), // MM-DD
  }));

  return (
    <div className="space-y-6 max-w-[1100px]">
      <div>
        <h1 className="text-xl font-bold text-[#1E293B] dark:text-white">Activité plateforme</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Utilisation des fonctionnalités (30 derniers jours)</p>
      </div>

      {/* Totaux */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {totalCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
              {isLoading ? (
                <div className="h-16 bg-[#F1F5F9] rounded animate-pulse" />
              ) : (
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={c.color} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#1E293B] dark:text-white">{c.value.toLocaleString()}</div>
                    <div className="text-sm text-[#64748B]">{c.label}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Graphique activité quotidienne */}
      <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
        <h2 className="text-sm font-semibold text-[#1E293B] dark:text-white mb-4">
          Activité quotidienne — 30 derniers jours
        </h2>
        {isLoading ? (
          <div className="h-56 bg-[#F1F5F9] rounded animate-pulse" />
        ) : chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-[#94A3B8] text-sm">
            Aucune donnée disponible
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cvGeneration" name="CV" stroke="#06B6D4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="coverLetter" name="Lettres" stroke="#EC4899" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="jobSearch" name="Recherches" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="application" name="Candidatures" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
