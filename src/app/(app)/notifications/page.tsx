'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, BellOff, ExternalLink, CheckCheck, Briefcase, Bot, Plus, Tag, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

interface JobNotification {
  id: string;
  offerId: string;
  title: string;
  company: string;
  location: string;
  url: string | null;
  matchScore: number | null;
  read: boolean;
  detectedAt: string;
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  // P5 — keyword watch state
  const [watchKeyword, setWatchKeyword] = useState('');

  const { data: notifications = [], isLoading } = useQuery<JobNotification[]>({
    queryKey: ['job-notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    staleTime: 30_000,
  });

  // P5 — load existing keyword alerts
  const { data: alerts = [] } = useQuery<{ id: string; keywords: string; isActive: boolean }[]>({
    queryKey: ['job-alerts'],
    queryFn: () => api.get('/offers/alerts').then((r) => r.data),
    staleTime: 60_000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-notifications'] });
      qc.invalidateQueries({ queryKey: ['job-notifications-unread'] });
      toast.success('Toutes les notifications marquées comme lues');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  // P5 — create keyword alert
  const createAlertMutation = useMutation({
    mutationFn: (keywords: string) => api.post('/offers/alerts', { keywords, frequency: 'daily' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-alerts'] });
      setWatchKeyword('');
      toast.success('Surveillance activée — vous serez notifié pour ce poste !');
    },
    onError: () => toast.error('Erreur lors de la création de l\'alerte'),
  });

  // P5 — delete keyword alert
  const deleteAlertMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/offers/alerts?id=${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-alerts'] });
      toast.success('Surveillance désactivée');
    },
  });

  // P7 — auto-apply mutation for notification offers
  const autoApplyMutation = useMutation({
    mutationFn: (n: JobNotification) =>
      api.post('/applications/auto-fill', {
        applicationUrl: n.url,
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        email: user?.email ?? '',
        offerTitle: n.title,
        offerCompany: n.company,
      }).then((r) => r.data as { success: boolean; message: string }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Candidature envoyée automatiquement !');
        qc.invalidateQueries({ queryKey: ['user-usage'] });
        qc.invalidateQueries({ queryKey: ['application-stats'] });
      } else {
        toast(data.message, { icon: '⚠️' });
      }
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erreur lors de la candidature automatique';
      toast.error(msg);
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-6 max-w-[720px]"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1E293B]">Notifications</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Offres d&apos;emploi détectées correspondant à votre profil
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            loading={markAllReadMutation.isPending}
          >
            <CheckCheck size={14} />
            Tout marquer comme lu
          </Button>
        )}
      </motion.div>

      {/* P5 — Surveiller un poste */}
      <motion.div variants={fadeInUp} className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,52,96,0.05)' }}>
        <div className="px-5 py-4 border-b border-[#E2E8F0]">
          <p className="text-sm font-semibold text-[#1E293B] flex items-center gap-2">
            <Bell size={14} className="text-accent" />
            Me notifier pour un poste spécifique
          </p>
          <p className="text-xs text-[#64748B] mt-0.5">Recevez des notifications dès que de nouvelles offres pour ce poste sont détectées.</p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={watchKeyword}
              onChange={(e) => setWatchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && watchKeyword.trim() && createAlertMutation.mutate(watchKeyword.trim())}
              placeholder="Ex : Développeur React, Plombier, Commercial…"
              className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-btn text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 bg-white"
            />
            <Button
              size="sm"
              onClick={() => watchKeyword.trim() && createAlertMutation.mutate(watchKeyword.trim())}
              loading={createAlertMutation.isPending}
              disabled={!watchKeyword.trim()}
            >
              <Plus size={13} />
              Surveiller
            </Button>
          </div>
          {alerts.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {alerts.map((a) => (
                <span key={a.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
                  <Tag size={10} />
                  {a.keywords}
                  <button
                    onClick={() => deleteAlertMutation.mutate(a.id)}
                    className="ml-0.5 hover:text-red-500 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats banner */}
      {notifications.length > 0 && (
        <motion.div
          variants={fadeInUp}
          className="bg-accent/5 border border-accent/20 rounded-xl px-5 py-3 flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shrink-0">
            <Bell size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">
              {notifications.length} offre{notifications.length > 1 ? 's' : ''} détectée{notifications.length > 1 ? 's' : ''}
              {unreadCount > 0 && (
                <span className="ml-2 bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </p>
            <p className="text-xs text-[#64748B]">Basé sur vos compétences et préférences de profil</p>
          </div>
        </motion.div>
      )}

      {/* List */}
      <motion.div variants={fadeInUp} className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-5 animate-pulse">
              <div className="h-4 bg-[#F1F5F9] rounded w-2/3 mb-2" />
              <div className="h-3 bg-[#F1F5F9] rounded w-1/3" />
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div
            className="bg-white rounded-card border border-[#E2E8F0] p-12 text-center"
            style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
          >
            <BellOff size={40} className="mx-auto text-[#CBD5E1] mb-3" />
            <p className="font-heading font-semibold text-[#1E293B]">Aucune notification</p>
            <p className="text-sm text-[#64748B] mt-1 max-w-xs mx-auto">
              Les offres correspondant à votre profil apparaîtront ici dès leur détection.
            </p>
            <div className="mt-4">
              <Link href="/offres">
                <Button variant="secondary" size="sm">
                  <Briefcase size={14} />
                  Explorer les offres
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-xl border transition-colors ${
                !n.read ? 'border-accent/30 shadow-sm' : 'border-[#E2E8F0]'
              }`}
              style={!n.read ? { boxShadow: '0 2px 12px rgba(124,58,237,0.08)' } : undefined}
            >
              <div className="p-4 sm:p-5 flex items-start gap-4">
                {/* Unread dot */}
                <div className="mt-1 shrink-0">
                  {!n.read ? (
                    <span className="block w-2.5 h-2.5 rounded-full bg-accent" />
                  ) : (
                    <span className="block w-2.5 h-2.5 rounded-full bg-[#E2E8F0]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1E293B] text-sm leading-tight">{n.title}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {n.company}
                        {n.location && ` · ${n.location}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {n.matchScore !== null && n.matchScore !== undefined && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {n.matchScore}%
                        </span>
                      )}
                      <span className="text-xs text-[#94A3B8] whitespace-nowrap">
                        {new Date(n.detectedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {n.url ? (
                      <a
                        href={n.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors"
                      >
                        <ExternalLink size={12} />
                        Voir l&apos;offre
                      </a>
                    ) : (
                      <Link
                        href={`/offres?q=${encodeURIComponent(n.title)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors"
                      >
                        <Briefcase size={12} />
                        Trouver cette offre
                      </Link>
                    )}
                    {/* P7 — Candidature auto (remplace le bouton Postuler) */}
                    {n.url && (
                      <button
                        onClick={() => autoApplyMutation.mutate(n)}
                        disabled={autoApplyMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] text-[#475569] text-xs font-semibold rounded-lg hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                      >
                        <Bot size={12} />
                        Candidature auto 🤖
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </motion.div>

      {/* Footer link */}
      {notifications.length > 0 && (
        <motion.div variants={fadeInUp} className="text-center">
          <Link href="/offres?tab=recommended" className="text-sm text-accent hover:underline font-medium">
            Explorer toutes les offres recommandées →
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
