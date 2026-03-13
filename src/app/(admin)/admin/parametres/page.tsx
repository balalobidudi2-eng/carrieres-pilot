'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/axios';
import { Shield, Lock, Info, Key, Server, Users, CheckCircle, XCircle, RefreshCw, Database } from 'lucide-react';

interface PlatformConfig {
  envStatus: {
    openai: boolean;
    stripe: boolean;
    smtp: boolean;
    franceTravail: boolean;
    jwtSecret: boolean;
    databaseUrl: boolean;
  };
  adminCount: number;
  totalUsers: number;
  dbReachable: boolean;
}

const ADMIN_LEVELS = [
  { level: 1, tag: 'L1', name: 'Admin Niveau 1', perms: 'Lecture seule : statistiques, utilisateurs, abonnements', color: 'bg-slate-100 text-slate-600' },
  { level: 2, tag: 'L2', name: 'Admin Niveau 2', perms: 'Lecture + modération : modifier comptes, suspendre utilisateurs', color: 'bg-blue-100 text-blue-600' },
  { level: 3, tag: 'L3', name: 'Admin Niveau 3', perms: 'Accès étendu : logs système, statistiques avancées', color: 'bg-violet-100 text-violet-600' },
  { level: 4, tag: 'SA', name: 'Super Admin', perms: 'Accès total : tous les droits, paramètres, attribution des rôles', color: 'bg-red-100 text-red-600' },
];

export default function AdminParametresPage() {
  const { user } = useAuthStore();
  const adminLevel = user?.adminLevel ?? 0;

  const { data: config, isLoading, refetch, isFetching } = useQuery<PlatformConfig>({
    queryKey: ['admin-platform-config'],
    queryFn: () => api.get('/admin/platform-config').then((r) => r.data),
    enabled: adminLevel >= 4,
    staleTime: 5 * 60 * 1000,
  });

  const [apiSource, setApiSource] = useState<'both' | 'france_travail' | 'adzuna'>('both');
  useEffect(() => {
    const saved = localStorage.getItem('cp_api_source');
    if (saved === 'france_travail' || saved === 'adzuna' || saved === 'both') setApiSource(saved);
  }, []);
  function handleApiSourceChange(value: 'both' | 'france_travail' | 'adzuna') {
    setApiSource(value);
    localStorage.setItem('cp_api_source', value);
  }

  if (adminLevel < 4) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <Lock size={28} className="text-red-400" />
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-[#1E293B] dark:text-white">Accès réservé au Super Admin</h2>
          <p className="text-sm text-[#64748B] mt-1">Cette section est réservée au Super Admin (niveau 4).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[900px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B] dark:text-white">Paramètres système</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Configuration et état de la plateforme — Super Admin uniquement</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1E293B] dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#112240] disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={18} className="text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <strong>Zone Super Admin.</strong> Les modifications de rôles s&apos;effectuent depuis la page{' '}
          <strong>Utilisateurs</strong>.
        </div>
      </div>

      {/* Variables d'environnement */}
      <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
        <h2 className="text-sm font-semibold text-[#1E293B] dark:text-white mb-4 flex items-center gap-2">
          <Key size={16} className="text-indigo-500" />
          Variables d&apos;environnement
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-[#F8FAFC] dark:bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {config && Object.entries({
              'OpenAI API Key': config.envStatus.openai,
              'Stripe': config.envStatus.stripe,
              'SMTP Email': config.envStatus.smtp,
              'France Travail API': config.envStatus.franceTravail,
              'JWT Secret': config.envStatus.jwtSecret,
              'Database URL': config.envStatus.databaseUrl,
            }).map(([label, ok]) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/5">
                <span className="text-sm text-[#1E293B] dark:text-white">{label}</span>
                <span className={`flex items-center gap-1 text-xs font-medium ${ok ? 'text-green-600' : 'text-red-500'}`}>
                  {ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
                  {ok ? 'Configuré' : 'Manquant'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* État de la base de données */}
      <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
        <h2 className="text-sm font-semibold text-[#1E293B] dark:text-white mb-4 flex items-center gap-2">
          <Server size={16} className="text-cyan-500" />
          État de la base de données
        </h2>
        {isLoading ? (
          <div className="h-12 bg-[#F8FAFC] dark:bg-white/5 rounded-lg animate-pulse" />
        ) : config ? (
          <div className="flex items-center gap-4 p-3 rounded-lg border border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/5">
            <span className={`flex items-center gap-1.5 text-sm font-medium ${config.dbReachable ? 'text-green-600' : 'text-red-500'}`}>
              {config.dbReachable ? <CheckCircle size={15} /> : <XCircle size={15} />}
              {config.dbReachable ? 'Base de données accessible' : 'Base de données inaccessible'}
            </span>
            <span className="text-sm text-[#64748B]">·</span>
            <span className="text-sm text-[#64748B]">{config.totalUsers} utilisateurs</span>
            <span className="text-sm text-[#64748B]">·</span>
            <span className="text-sm text-[#64748B]">{config.adminCount} administrateurs</span>
          </div>
        ) : null}
      </div>

      {/* Niveaux admin */}
      <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
        <h2 className="text-sm font-semibold text-[#1E293B] dark:text-white mb-4 flex items-center gap-2">
          <Users size={16} className="text-red-500" />
          Niveaux d&apos;accès administrateur
        </h2>
        <div className="space-y-3">
          {ADMIN_LEVELS.map((l) => (
            <div key={l.level} className="flex items-start gap-3 p-3 rounded-lg border border-[#E2E8F0] dark:border-white/10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${l.color}`}>
                {l.tag}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[#1E293B] dark:text-white">{l.name}</div>
                <div className="text-xs text-[#64748B] mt-0.5">{l.perms}</div>
              </div>
              {adminLevel === l.level && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">Vous</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-[#94A3B8] mt-4">
          Pour modifier le niveau d&apos;un utilisateur, allez dans <strong>Utilisateurs</strong> → colonne Actions → sélecteur de niveau.
        </p>
      </div>

      {/* Source des offres d'emploi */}
      <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
        <h2 className="text-sm font-semibold text-[#1E293B] dark:text-white mb-1 flex items-center gap-2">
          <Database size={16} className="text-emerald-500" />
          Source des offres d&apos;emploi
        </h2>
        <p className="text-xs text-[#64748B] mb-4">
          Choisissez quelle(s) API utiliser pour les recherches d&apos;offres. Ce réglage s&apos;applique uniquement pendant votre session admin.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { value: 'both', label: 'France Travail + Adzuna', desc: '10 offres de chaque (recommandé)' },
            { value: 'france_travail', label: 'France Travail uniquement', desc: 'API officielle Pôle Emploi' },
            { value: 'adzuna', label: 'Adzuna uniquement', desc: 'Agrégateur international' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleApiSourceChange(opt.value)}
              className={`text-left p-3 rounded-lg border transition-all ${
                apiSource === opt.value
                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-[#E2E8F0] dark:border-white/10 hover:border-emerald-300'
              }`}
            >
              <div className={`text-sm font-semibold ${apiSource === opt.value ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#1E293B] dark:text-white'}`}>
                {opt.label}
              </div>
              <div className="text-xs text-[#64748B] mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-[#94A3B8] mt-3">
          La sélection est sauvegardée localement dans votre navigateur. Les utilisateurs non-admin utilisent toujours le mode <strong>France Travail + Adzuna</strong>.
        </p>
      </div>

      {/* Security note */}
      <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
        <h2 className="text-sm font-semibold text-[#1E293B] dark:text-white mb-3 flex items-center gap-2">
          <Shield size={16} className="text-slate-500" />
          Règles de sécurité
        </h2>
        <ul className="space-y-1.5 text-sm text-[#64748B]">
          <li>• Le Super Admin ne peut pas modifier son propre rôle d&apos;administrateur.</li>
          <li>• Un seul Super Admin peut exister simultanément sur la plateforme.</li>
          <li>• La promotion au niveau Super Admin est réservée à l&apos;email <code className="bg-[#F1F5F9] dark:bg-white/10 px-1 rounded text-xs">ghilesaimeur951@gmail.com</code>.</li>
          <li>• Les clés API ne sont jamais exposées en clair via cette interface.</li>
        </ul>
      </div>
    </div>
  );
}
