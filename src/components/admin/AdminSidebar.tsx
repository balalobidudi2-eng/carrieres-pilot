'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Activity,
  Settings,
  FileText,
  Zap,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', minLevel: 1 },
  { href: '/admin/utilisateurs', icon: Users, label: 'Utilisateurs', minLevel: 1 },
  { href: '/admin/abonnements', icon: CreditCard, label: 'Abonnements', minLevel: 1 },
  { href: '/admin/activite', icon: Activity, label: 'Activité', minLevel: 1 },
  { href: '/admin/parametres', icon: Settings, label: 'Paramètres système', minLevel: 3 },
  { href: '/admin/logs', icon: FileText, label: 'Logs système', minLevel: 3 },
];

const LEVEL_LABELS: Record<number, string> = {
  1: 'Admin Niveau 1',
  2: 'Admin Niveau 2',
  3: 'Super Admin',
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const adminLevel = user?.adminLevel ?? 1;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0F172A] text-white h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
          <Shield size={15} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-sm leading-tight">Administration</div>
          <div className="text-xs text-white/50">CarrièrePilot</div>
        </div>
      </div>

      {/* Admin badge */}
      <div className="px-5 py-3 border-b border-white/10">
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
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition-colors"
        >
          <LayoutDashboard size={17} />
          Voir comme utilisateur
        </Link>
      </div>
    </aside>
  );
}
