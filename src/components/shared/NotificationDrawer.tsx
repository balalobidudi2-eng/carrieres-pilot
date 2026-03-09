'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { X, Bell, Mail, Sparkles, User, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/axios';

interface Props {
  open: boolean;
  onClose: () => void;
}

type NotifLevel = 'info' | 'warning' | 'success';

interface Notif {
  id: string;
  title: string;
  body: string;
  level: NotifLevel;
  icon: React.ElementType;
  action?: { label: string; href: string };
}

const LEVEL_STYLES: Record<NotifLevel, { bg: string; icon: string; badge: string }> = {
  info:    { bg: 'bg-blue-50',  icon: 'text-blue-500',  badge: 'bg-blue-100 text-blue-600' },
  warning: { bg: 'bg-amber-50', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
  success: { bg: 'bg-green-50', icon: 'text-green-500', badge: 'bg-green-100 text-green-600' },
};

export function NotificationDrawer({ open, onClose }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: smtpStatus } = useQuery({
    queryKey: ['smtp-status'],
    queryFn: () => api.get('/smtp/status').then((r) => r.data as { configured: boolean }),
    staleTime: 60_000,
    retry: false,
    enabled: open,
  });

  const { data: quotaData } = useQuery({
    queryKey: ['quota-status'],
    queryFn: () => api.get('/quota/status').then((r) => r.data),
    staleTime: 30_000,
    retry: false,
    enabled: open,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Build notifications list from app state
  const notifications: Notif[] = [];

  // Welcome notification
  notifications.push({
    id: 'welcome',
    title: `Bienvenue, ${user?.firstName ?? 'vous'} !`,
    body: 'CarrièrePilot est prêt à booster votre recherche d\'emploi.',
    level: 'success',
    icon: Sparkles,
  });

  // Profile completion
  const profileFields = [
    user?.firstName, user?.lastName, user?.phone, user?.location,
    user?.currentTitle, user?.bio, user?.linkedinUrl, user?.targetSalary,
  ].filter(Boolean).length;
  if (profileFields < 6) {
    notifications.push({
      id: 'profile',
      title: 'Complétez votre profil',
      body: 'Un profil complet améliore la qualité des recommandations IA.',
      level: 'warning',
      icon: User,
      action: { label: 'Compléter', href: '/profil' },
    });
  }

  // SMTP not configured
  if (smtpStatus && !smtpStatus.configured) {
    notifications.push({
      id: 'smtp',
      title: 'Email non configuré',
      body: 'Configurez votre SMTP pour recevoir les alertes emploi et envoyer vos candidatures.',
      level: 'warning',
      icon: Mail,
      action: { label: 'Configurer', href: '/parametres/smtp' },
    });
  }

  // Quota warning
  if (quotaData?.job_search?.remaining <= 2 && quotaData?.job_search?.remaining >= 0) {
    notifications.push({
      id: 'quota',
      title: 'Quota de recherches limité',
      body: `Il vous reste ${quotaData.job_search.remaining} recherche(s) aujourd'hui. Passez au plan supérieur pour continuer.`,
      level: 'warning',
      icon: AlertTriangle,
      action: { label: 'Voir les plans', href: '/abonnement' },
    });
  }

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-50 w-80 bg-white border-l border-[#E2E8F0] flex flex-col shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <Bell size={17} className="text-[#1E293B]" />
            <h2 className="font-heading font-semibold text-[#1E293B]">Notifications</h2>
            {notifications.filter((n) => n.level === 'warning').length > 0 && (
              <span className="ml-1 min-w-[18px] h-[18px] bg-accent rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1">
                {notifications.filter((n) => n.level === 'warning').length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#F7F8FC] hover:text-[#1E293B] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.map((n) => {
            const Icon = n.icon;
            const styles = LEVEL_STYLES[n.level];
            return (
              <div key={n.id} className={`rounded-xl p-3.5 ${styles.bg}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${styles.icon} shrink-0`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1E293B]">{n.title}</p>
                    <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{n.body}</p>
                    {n.action && (
                      <button
                        onClick={() => navigate(n.action!.href)}
                        className="mt-2 text-xs font-semibold text-accent hover:underline"
                      >
                        {n.action.label} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E2E8F0] text-center">
          <p className="text-[11px] text-[#94A3B8]">Les notifications sont calculées en temps réel</p>
        </div>
      </div>
    </>
  );
}
