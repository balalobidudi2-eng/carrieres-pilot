'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationDrawer } from './NotificationDrawer';

const routeLabels: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/cv': 'Mon CV',
  '/lettre': 'Lettres de motivation',
  '/offres': "Offres d'emploi",
  '/candidatures': 'Mes candidatures',
  '/entretiens': 'Préparation entretiens',
  '/profil': 'Mon profil',
  '/abonnement': 'Abonnement',
  '/parametres': 'Paramètres',
  '/notifications': 'Notifications',
  '/favoris': 'Offres sauvegardées',
  '/facturation': 'Facturation',
};

export function AppHeader() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // ⌘K / Ctrl+K opens the search modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const title = routeLabels[pathname] ?? 'CarrièrePilot';
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <>
      <header className="h-14 bg-white border-b border-[#E2E8F0] flex items-center px-6 gap-4 shrink-0">
        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-[#64748B] hover:bg-gray-100"
          onClick={toggleSidebar}
          aria-label="Menu"
        >
          <Menu size={18} />
        </button>

        {/* Title area */}
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-base font-semibold text-[#1E293B] leading-tight truncate">
            {pathname === '/dashboard' ? `${greeting}, ${user?.firstName ?? ''} 👋` : title}
          </h1>
        </div>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F7F8FC] text-sm text-[#94A3B8] hover:border-accent/40 transition-colors w-52"
          aria-label="Rechercher"
        >
          <Search size={14} />
          Rechercher…
          <kbd className="ml-auto text-xs bg-white border border-[#E2E8F0] rounded px-1.5 py-0.5 font-mono hidden lg:inline">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          onClick={() => setNotifOpen((p) => !p)}
          className="relative p-2 rounded-lg text-[#64748B] hover:bg-[#F7F8FC] hover:text-[#1E293B] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {!notifOpen && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" aria-hidden="true" />
          )}
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold cursor-pointer">
          {user?.firstName?.[0]}
          {user?.lastName?.[0]}
        </div>
      </header>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
