'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Mail,
  Search,
  Kanban,
  MessageSquare,
  User,
  CreditCard,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { PlanBadge } from '@/components/ui/Badge';
import { SubscriptionBar } from '@/components/shared/SubscriptionBar';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/cv', icon: FileText, label: 'Mon CV' },
  { href: '/lettre', icon: Mail, label: 'Lettres' },
  { href: '/offres', icon: Search, label: 'Offres' },
  { href: '/candidatures', icon: Kanban, label: 'Candidatures' },
  { href: '/entretiens', icon: MessageSquare, label: 'Entretiens' },
];

const bottomItems = [
  { href: '/profil', icon: User, label: 'Profil' },
  { href: '/abonnement', icon: CreditCard, label: 'Abonnement' },
  { href: '/parametres', icon: Settings, label: 'Paramètres' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
    <motion.aside
      animate={{ width: sidebarOpen ? 260 : 68 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="hidden md:flex flex-col bg-white dark:bg-[#112240] border-r border-[#E2E8F0] dark:border-[#1E3350] h-screen sticky top-0 shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-[#E2E8F0] shrink-0">
        <AnimatePresence mode="wait">
          {sidebarOpen ? (
            <motion.div
              key="full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2 font-heading font-bold text-[#1E293B] text-base"
            >
              <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center shrink-0">
                <Zap size={15} className="text-white" />
              </div>
              CarrièrePilot
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center mx-auto"
            >
              <Zap size={15} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F7F8FC] transition-colors"
            aria-label="Réduire le menu"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="absolute top-[72px] -right-3 z-10 w-6 h-6 bg-white border border-[#E2E8F0] rounded-full flex items-center justify-center shadow-sm text-[#64748B] hover:text-accent"
          aria-label="Ouvrir le menu"
        >
          <ChevronRight size={12} />
        </button>
      )}

      {/* Main nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto" aria-label="Navigation principale">
        {navItems.map(({ href, icon: Icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={Icon}
            label={label}
            active={isActive(href)}
            collapsed={!sidebarOpen}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-[#E2E8F0] py-3 px-2 space-y-0.5">
        {bottomItems.map(({ href, icon: Icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={Icon}
            label={label}
            active={isActive(href)}
            collapsed={!sidebarOpen}
          />
        ))}
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#64748B] hover:bg-red-50 hover:text-red-500 transition-all duration-200',
            !sidebarOpen && 'justify-center',
          )}
        >
          <LogOut size={17} className="shrink-0" />
          {sidebarOpen && <span>Se déconnecter</span>}
        </button>
      </div>

      {/* Subscription usage bar */}
      <SubscriptionBar collapsed={!sidebarOpen} />

      {/* User info */}
      {user && sidebarOpen && (
        <div className="border-t border-[#E2E8F0] p-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#1E293B] truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-[#64748B] truncate">{user.email}</p>
            </div>
            <PlanBadge plan={user.plan} />
          </div>
        </div>
      )}
    </motion.aside>

    {/* ── Mobile drawer ──────────────────────────────────────────── */}
    <AnimatePresence>
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="mob-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggleSidebar}
          />
          {/* Slide-in drawer */}
          <motion.div
            key="mob-drawer"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#112240] border-r border-[#E2E8F0] dark:border-[#1E3350] z-50 md:hidden flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Logo */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-[#E2E8F0] dark:border-[#1E3350] shrink-0">
              <div className="flex items-center gap-2 font-heading font-bold text-[#1E293B] text-base">
                <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
                  <Zap size={15} className="text-white" />
                </div>
                CarrièrePilot
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F7F8FC] transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
            {/* Nav items */}
            <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
              {[...navItems, ...bottomItems].map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={toggleSidebar}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    (pathname === href || pathname.startsWith(href + '/'))
                      ? 'bg-accent/10 text-accent border-l-2 border-accent pl-[10px]'
                      : 'text-[#64748B] hover:bg-[#F7F8FC] hover:text-[#1E293B]',
                  )}
                >
                  <Icon size={17} className="shrink-0" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
            {/* Logout */}
            <div className="border-t border-[#E2E8F0] dark:border-[#1E3350] py-3 px-2 shrink-0">
              <button
                onClick={() => { logout(); toggleSidebar(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#64748B] hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <LogOut size={17} className="shrink-0" />
                <span>Se déconnecter</span>
              </button>
            </div>
            {/* User info */}
            {user && (
              <div className="border-t border-[#E2E8F0] dark:border-[#1E3350] p-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1E293B] truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-[#64748B] truncate">{user.email}</p>
                  </div>
                  <PlanBadge plan={user.plan} />
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        collapsed && 'justify-center',
        active
          ? 'bg-accent/10 text-accent border-l-2 border-accent pl-[10px]'
          : 'text-[#64748B] hover:bg-[#F7F8FC] hover:text-[#1E293B]',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon size={17} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
