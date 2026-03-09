'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { LogOut, Shield, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AdminHeader() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const LEVEL_COLORS: Record<number, string> = {
    1: 'bg-blue-100 text-blue-700',
    2: 'bg-orange-100 text-orange-700',
    3: 'bg-red-100 text-red-700',
  };
  const LEVEL_LABELS: Record<number, string> = {
    1: 'Niveau 1',
    2: 'Niveau 2',
    3: 'Super Admin',
  };

  const level = user?.adminLevel ?? 1;

  return (
    <header className="h-14 bg-white dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-white/10 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <Shield size={18} className="text-red-500" />
        <span className="font-semibold text-sm text-[#1E293B] dark:text-white">Interface Administrateur</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[level] ?? 'bg-gray-100 text-gray-600'}`}>
          {LEVEL_LABELS[level] ?? 'Admin'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="gap-2 text-sm"
        >
          <ExternalLink size={15} />
          Vue utilisateur
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout()}
          className="gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut size={15} />
          Déconnexion
        </Button>
      </div>
    </header>
  );
}
