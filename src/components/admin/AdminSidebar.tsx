'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Activity,
  Settings,
  FileText,
  Zap,
  Shield,
  MessageSquare,
  TrendingDown,
  BarChart2,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', minLevel: 1 },
  { href: '/admin/utilisateurs', icon: Users, label: 'Utilisateurs', minLevel: 1 },
  { href: '/admin/abonnements', icon: CreditCard, label: 'Abonnements', minLevel: 1 },
  { href: '/admin/messages', icon: MessageSquare, label: 'Messages support', minLevel: 1 },
  { href: '/admin/activite', icon: Activity, label: 'Activité', minLevel: 1 },
  { href: '/admin/couts', icon: TrendingDown, label: 'Analyse des coûts', minLevel: 2 },
  { href: '/admin/statistiques', icon: BarChart2, label: 'Statistiques', minLevel: 3 },
  { href: '/admin/logs', icon: FileText, label: 'Logs système', minLevel: 3 },
  { href: '/admin/parametres', icon: Settings, label: 'Paramètres système', minLevel: 4 },
];

const LEVEL_LABELS: Record<number, string> = {
  1: 'Admin Niveau 1',
  2: 'Admin Niveau 2',
  3: 'Admin Niveau 3',
  4: 'Super Admin',
};

function SidebarContent({
  adminLevel,
  user,
  onClose,
}: {
  adminLevel: number;
  user: { firstName?: string | null; lastName?: string | null } | null;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
            <Shield size={15} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">Administration</div>
            <div className="text-xs text-white/50">CarrièrePilot</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fermer le menu"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Admin badge */}
      <div className="px-5 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center">
            <Zap size={12} className="text-yellow-400" />
          </div>
          <div>
            <div className="text-xs font-medium">{user?.firstName} {user?.lastName}</div>
            <div className="text-[11px] text-white/50">{LEVEL_LABELS[adminLevel] ?? 'Admin'}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => adminLevel >= item.minLevel)
          .map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                )}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
      </nav>

      {/* Bottom: switch to user view */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 shrink-0">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition-colors"
        >
          <LayoutDashboard size={17} />
          Voir comme utilisateur
        </Link>
      </div>
    </>
  );
}

export function AdminSidebar() {
  const { user } = useAuthStore();
  const { adminSidebarOpen, setAdminSidebarOpen } = useUIStore();
  const adminLevel = user?.adminLevel ?? 1;

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0F172A] text-white h-screen sticky top-0 shrink-0">
        <SidebarContent adminLevel={adminLevel} user={user} />
      </aside>

      {/* ── Mobile drawer ──────────────────────────────────────── */}
      <AnimatePresence>
        {adminSidebarOpen && (
          <>
            <motion.div
              key="admin-mob-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setAdminSidebarOpen(false)}
            />
            <motion.div
              key="admin-mob-drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-64 bg-[#0F172A] text-white z-50 md:hidden flex flex-col shadow-2xl overflow-hidden"
            >
              <SidebarContent
                adminLevel={adminLevel}
                user={user}
                onClose={() => setAdminSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
