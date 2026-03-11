'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { Search, ChevronLeft, ChevronRight, Shield, Ban, CheckCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { AdminUser } from '@/types';

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-600',
  PRO: 'bg-blue-100 text-blue-600',
  EXPERT: 'bg-violet-100 text-violet-600',
};

const LEVEL_LABELS: Record<number, string> = { 1: 'L1', 2: 'L2', 3: 'L3', 4: 'SA' };

export default function AdminUsersPage() {
  const { user: adminUser } = useAuthStore();
  const adminLevel = adminUser?.adminLevel ?? 1;
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const { data, isLoading } = useQuery<{ users: AdminUser[]; total: number; page: number; limit: number }>({
    queryKey: ['admin-users', page, search, planFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (planFilter) params.set('plan', planFilter);
      return api.get(`/admin/users?${params}`).then((r) => r.data);
    },
    staleTime: 30 * 1000,
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api.patch(`/admin/users/${id}`, patch).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B] dark:text-white">Utilisateurs</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{total} utilisateurs au total</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Rechercher par email, nom..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] text-sm bg-white dark:bg-[#112240] dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm bg-white dark:bg-[#112240] dark:border-white/10 focus:outline-none"
        >
          <option value="">Tous les plans</option>
          <option value="FREE">Gratuit</option>
          <option value="PRO">Pro</option>
          <option value="EXPERT">Expert</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/5">
              <th className="text-left px-4 py-3 font-medium text-[#64748B]">Utilisateur</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748B]">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748B]">Activité</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748B]">Inscription</th>
              <th className="text-left px-4 py-3 font-medium text-[#64748B]">Statut</th>
              {adminLevel >= 2 && <th className="text-left px-4 py-3 font-medium text-[#64748B]">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] dark:divide-white/10">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-[#F1F5F9] dark:bg-white/10 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#1E293B] dark:text-white">
                        {u.firstName} {u.lastName}
                        {u.adminLevel && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                            <Shield size={10} /> {LEVEL_LABELS[u.adminLevel]}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#94A3B8]">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${PLAN_COLORS[u.plan] ?? ''}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">
                      <div className="text-xs">{u._count?.cvs ?? 0} CV · {u._count?.letters ?? 0} lettres · {u._count?.applications ?? 0} candidatures</div>
                      <div className="text-xs text-[#94A3B8]">
                        {u.lastLoginAt ? `Connexion ${new Date(u.lastLoginAt).toLocaleDateString('fr-FR')}` : 'Jamais connecté'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">
                      {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      {u.deletionScheduledAt ? (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">Suspendu</span>
                      ) : u.emailVerified ? (
                        <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full font-medium">Actif</span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full font-medium">Non vérifié</span>
                      )}
                    </td>
                    {adminLevel >= 2 && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {u.deletionScheduledAt ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-50"
                              onClick={() => patchMutation.mutate({ id: u.id, patch: { suspended: false } })}
                            >
                              <CheckCircle size={13} className="mr-1" /> Réactiver
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
                              onClick={() => patchMutation.mutate({ id: u.id, patch: { suspended: true } })}
                            >
                              <Ban size={13} className="mr-1" /> Suspendre
                            </Button>
                          )}
                          {/* Admin level selector for Super Admin (L4) only */}
                          {adminLevel >= 4 && (
                            <div className="relative">
                              <select
                                value={u.adminLevel ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : parseInt(e.target.value);
                                  patchMutation.mutate({ id: u.id, patch: { adminLevel: val } });
                                }}
                                className="h-7 pl-2 pr-6 text-xs border border-[#E2E8F0] dark:border-white/10 rounded-lg bg-white dark:bg-[#0D1B2A] text-[#475569] dark:text-white/60 focus:outline-none focus:border-amber-400 appearance-none cursor-pointer"
                              >
                                <option value="">Aucun rôle admin</option>
                                <option value="1">Admin L1</option>
                                <option value="2">Admin L2</option>
                                <option value="3">Admin L3</option>
                                <option value="4">Super Admin</option>
                              </select>
                              <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0] dark:border-white/10">
            <span className="text-sm text-[#64748B]">Page {page} / {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={15} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
