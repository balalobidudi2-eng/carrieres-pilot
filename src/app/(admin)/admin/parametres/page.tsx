'use client';

import { useAuthStore } from '@/stores/authStore';
import { Shield, Lock, Info } from 'lucide-react';

export default function AdminParametresPage() {
  const { user } = useAuthStore();
  const adminLevel = user?.adminLevel ?? 0;

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
    <div className="space-y-6 max-w-[800px]">
      <div>
        <h1 className="text-xl font-bold text-[#1E293B] dark:text-white">Paramètres système</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Configuration avancée de la plateforme</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={18} className="text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <strong>Accès Super Admin uniquement.</strong> Les modifications ici affectent l'ensemble de la plateforme.
        </div>
      </div>

      {/* Section niveaux admin */}
      <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
        <h2 className="text-sm font-semibold text-[#1E293B] dark:text-white mb-4 flex items-center gap-2">
          <Shield size={16} className="text-red-500" />
          Gestion des administrateurs
        </h2>
        <p className="text-sm text-[#64748B] mb-4">
          Pour promouvoir un utilisateur en administrateur, modifiez son niveau depuis la page
          <strong> Utilisateurs</strong> (colonne Actions).
        </p>
        <div className="space-y-3">
          {[
            { level: 1, name: 'Admin Niveau 1', perms: 'Lecture seule : statistiques, utilisateurs, abonnements' },
            { level: 2, name: 'Admin Niveau 2', perms: 'Lecture + modération : modifier comptes, suspendre utilisateurs' },
            { level: 3, name: 'Super Admin', perms: 'Accès complet : tous les droits, logs, paramètres, rôles' },
          ].map((l) => (
            <div key={l.level} className="flex items-start gap-3 p-3 rounded-lg border border-[#E2E8F0] dark:border-white/10">
              <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600 shrink-0">
                L{l.level}
              </div>
              <div>
                <div className="text-sm font-medium text-[#1E293B] dark:text-white">{l.name}</div>
                <div className="text-xs text-[#64748B] mt-0.5">{l.perms}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variables d'environnement (info only) */}
      <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-5">
        <h2 className="text-sm font-semibold text-[#1E293B] dark:text-white mb-3">Variables d'environnement</h2>
        <p className="text-sm text-[#64748B]">
          Les clés API (OpenAI, Stripe, SMTP, France Travail) sont gérées via les variables d'environnement Vercel.
          Elles ne peuvent pas être modifiées depuis cette interface pour des raisons de sécurité.
        </p>
      </div>
    </div>
  );
}
