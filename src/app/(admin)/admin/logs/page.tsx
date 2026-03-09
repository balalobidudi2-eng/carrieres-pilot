'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { Lock, UserPlus, Send } from 'lucide-react';

interface LogsData {
  recentRegistrations: { id: string; email: string; plan: string; createdAt: string; lastLoginAt: string | null }[];
  recentApplications: { id: string; company: string; jobTitle: string; status: string; appliedAt: string; userId: string }[];
}

export default function AdminLogsPage() {
  const { user } = useAuthStore();
  const adminLevel = user?.adminLevel ?? 0;

  const { data, isLoading } = useQuery<LogsData>({
    queryKey: ['admin-logs'],
    queryFn: () => api.get('/admin/logs').then((r) => r.data),
    staleTime: 30 * 1000,
    enabled: adminLevel >= 3,
  });

  if (adminLevel < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <Lock size={28} className="text-red-400" />
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-[#1E293B] dark:text-white">Accès réservé au Super Admin</h2>
          <p className="text-sm text-[#64748B] mt-1">Cette section requiert le niveau d'accès 3 (Super Admin).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1100px]">
      <div>
        <h1 className="text-xl font-bold text-[#1E293B] dark:text-white">Logs système</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Dernières activités de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières inscriptions */}
        <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10">
          <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-white/10 flex items-center gap-2">
            <UserPlus size={16} className="text-emerald-500" />
            <h2 className="text-sm font-semibold text-[#1E293B] dark:text-white">Dernières inscriptions</h2>
          </div>
          <div className="divide-y divide-[#E2E8F0] dark:divide-white/10">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex gap-3 items-center">
                    <div className="w-full h-4 bg-[#F1F5F9] rounded animate-pulse" />
                  </div>
                ))
              : (data?.recentRegistrations ?? []).slice(0, 10).map((u) => (
                  <div key={u.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                      {u.email[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[#1E293B] dark:text-white truncate">{u.email}</div>
                      <div className="text-xs text-[#94A3B8]">
                        {new Date(u.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        <span className={u.plan === 'FREE' ? 'text-slate-500' : u.plan === 'PRO' ? 'text-blue-500' : 'text-violet-500'}>
                          {u.plan}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Dernières candidatures */}
        <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10">
          <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-white/10 flex items-center gap-2">
            <Send size={16} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-[#1E293B] dark:text-white">Dernières candidatures</h2>
          </div>
          <div className="divide-y divide-[#E2E8F0] dark:divide-white/10">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex gap-3 items-center">
                    <div className="w-full h-4 bg-[#F1F5F9] rounded animate-pulse" />
                  </div>
                ))
              : (data?.recentApplications ?? []).slice(0, 10).map((a) => (
                  <div key={a.id} className="px-5 py-3">
                    <div className="text-sm font-medium text-[#1E293B] dark:text-white">{a.jobTitle}</div>
                    <div className="text-xs text-[#94A3B8]">
                      {a.company} · {new Date(a.appliedAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
