'use client';

import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useRouter } from 'next/navigation';
import { LogOut, Shield, ExternalLink, Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AdminHeader() {
  const { user, logout } = useAuthStore();
  const { toggleAdminSidebar } = useUIStore();
  const router = useRouter();

  const LEVEL_COLORS: Record<number, string> = {
    1: 'bg-blue-100 text-blue-700',
    2: 'bg-orange-100 text-orange-700',
    3: 'bg-red-100 text-red-700',
    4: 'bg-red-100 text-red-700',
  };
  const LEVEL_LABELS: Record<number, string> = {
    1: 'Niveau 1',
    2: 'Niveau 2',
    3: 'Niveau 3',
    4: 'Super Admin',
  };

  const level = user?.adminLevel ?? 1;

  return (
    <header className="h-14 bg-white dark:bg-[#0F172A] border-b border-[#E2E8F0] dark:border-white/10 flex items-center justify-between px-4 md:px-6 shrink-0 gap-2">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-[#64748B] hover:bg-gray-100 shrink-0"
          onClick={toggleAdminSidebar}
          aria-label="Menu administration"
        >
          <Menu size={18} />
        </button>

        <Shield size={18} className="text-red-500 shrink-0" />
        <span className="font-semibold text-sm text-[#1E293B] dark:text-white hidden sm:inline">Interface Administrateur</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${LEVEL_COLORS[level] ?? 'bg-gray-100 text-gray-600'}`}>
          {LEVEL_LABELS[level] ?? 'Admin'}
        </span>
      </div>

      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="gap-1.5 text-sm hidden sm:flex"
        >
          <ExternalLink size={15} />
          <span className="hidden md:inline">Vue utilisateur</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout()}
          className="gap-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Déconnexion</span>
        </Button>
      </div>
    </header>
  );
}
