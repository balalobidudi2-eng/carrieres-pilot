'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Lock,
  Bell,
  Shield,
  Trash2,
  Save,
  Eye,
  EyeOff,
  LogOut,
  Globe,
  Moon,
  Sun,
  MessageSquare,
  Mail,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { staggerContainer, fadeInUp } from '@/lib/animations';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
    newPassword: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

function ContactSection() {
  const qc = useQueryClient();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: myMessages = [] } = useQuery<{
    id: string;
    subject: string;
    message: string;
    adminReply: string | null;
    repliedAt: string | null;
    replyRead: boolean;
    createdAt: string;
  }[]>({
    queryKey: ['my-support-messages'],
    queryFn: () => api.get('/support/contact').then((r) => r.data),
    staleTime: 60 * 1000,
  });

  const hasUnreadReply = myMessages.some((m) => m.adminReply && !m.replyRead);

  const contactMutation = useMutation({
    mutationFn: () => api.post('/support/contact', { subject, message }),
    onSuccess: () => {
      toast.success('Message envoyé à l\'équipe CarrièrePilot !');
      setSubject('');
      setMessage('');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['my-support-messages'] });
    },
    onError: () => toast.error('Erreur lors de l\'envoi. Veuillez réessayer.'),
  });

  return (
    <motion.section
      variants={fadeInUp}
      className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
      style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center relative">
            <MessageSquare size={16} className="text-accent" />
            {hasUnreadReply && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            )}
          </div>
          <div>
            <h2 className="font-heading font-semibold text-[#1E293B]">Support &amp; messages</h2>
            <p className="text-xs text-[#94A3B8]">Historique de vos échanges avec l&apos;équipe CarrièrePilot</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-accent border border-accent/30 rounded-btn hover:bg-accent/5 transition-colors"
        >
          <MessageSquare size={13} />
          Nouveau ticket
        </button>
      </div>

      {/* New ticket form */}
      {showForm && (
        <div className="p-6 border-b border-[#E2E8F0] space-y-4 bg-[#F8FAFC]">
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Sujet</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="ex: Problème de candidature automatique"
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-btn text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Décrivez votre problème ou votre demande en détail…"
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-btn text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => contactMutation.mutate()}
              loading={contactMutation.isPending}
              disabled={!subject.trim() || !message.trim()}
            >
              <MessageSquare size={14} />
              Envoyer
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      {/* Message history */}
      <div className="divide-y divide-[#E2E8F0]">
        {myMessages.length === 0 && !showForm && (
          <div className="px-6 py-10 text-center">
            <MessageSquare size={32} className="mx-auto text-[#CBD5E1] mb-2" />
            <p className="text-sm text-[#94A3B8]">Aucun message envoyé pour le moment.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm font-semibold text-accent hover:underline"
            >
              Contacter le support →
            </button>
          </div>
        )}
        {myMessages.map((msg) => (
          <div key={msg.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">{msg.subject}</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {new Date(msg.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              {msg.adminReply ? (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium shrink-0">Répondu</span>
              ) : (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium shrink-0">En attente</span>
              )}
            </div>
            {/* User's message */}
            <div className="bg-[#F8FAFC] rounded-lg p-3">
              <p className="text-xs font-semibold text-[#94A3B8] mb-1">Votre message</p>
              <p className="text-sm text-[#475569] leading-relaxed">{msg.message}</p>
            </div>
            {/* Admin reply */}
            {msg.adminReply && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-emerald-700 mb-1">
                  Réponse de l&apos;équipe CarrièrePilot
                  {msg.repliedAt && ` — ${new Date(msg.repliedAt).toLocaleDateString('fr-FR')}`}
                </p>
                <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">{msg.adminReply}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.section>
  );
}

export default function ParametresPage() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteStep, setDeleteStep] = useState<'idle' | 'reason' | 'confirm'>('idle');
  const [deleteReason, setDeleteReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const [notifications, setNotifications] = useState({
    notifEmailNewOffer: user?.notifEmailNewOffer ?? true,
    notifEmailApplicationStatus: user?.notifEmailApplicationStatus ?? true,
    notifEmailWeeklyDigest: user?.notifEmailWeeklyDigest ?? false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      toast.success('Mot de passe mis à jour !');
      reset();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? (err instanceof Error ? err.message : null)
        ?? 'Erreur lors du changement de mot de passe';
      toast.error(msg);
    },
  });

  const notifMutation = useMutation({
    mutationFn: (prefs: typeof notifications) => api.patch('/users/me/notifications', prefs),
    onSuccess: () => toast.success('Préférences sauvegardées'),
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (reason: string) => api.delete('/users/me', { data: { reason } }),
    onSuccess: () => {
      toast.success('Votre compte sera supprimé dans 30 jours. Reconnectez-vous pour annuler.');
      logout();
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const isDeleteReady = deleteConfirm === 'irréversible';

  const { data: smtpStatus } = useQuery({
    queryKey: ['smtp-status'],
    queryFn: () => api.get('/smtp/status').then((r) => r.data as { configured: boolean; host: string | null; from: string | null }),
    staleTime: 60_000,
    retry: false,
  });

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-6 max-w-[700px]"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="font-heading text-2xl font-bold text-[#1E293B]">Paramètres</h1>
        <p className="text-sm text-[#64748B] mt-1">Gérez votre compte, sécurité et notifications</p>
      </motion.div>

      {/* ── Sécurité ─────────────────────────────────────────── */}
      <motion.section
        variants={fadeInUp}
        className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
        style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <Lock size={16} className="text-violet-600" />
          </div>
          <h2 className="font-heading font-semibold text-[#1E293B]">Sécurité</h2>
        </div>
        <form
          onSubmit={handleSubmit((d) => passwordMutation.mutate(d))}
          className="p-6 space-y-4"
        >
          <div className="relative">
            <Input
              label="Mot de passe actuel"
              type={showCurrent ? 'text' : 'password'}
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((p) => !p)}
              className="absolute right-3 top-9 text-[#94A3B8] hover:text-[#1E293B]"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="relative">
            <Input
              label="Nouveau mot de passe"
              type={showNew ? 'text' : 'password'}
              {...register('newPassword')}
              error={errors.newPassword?.message}
            />
            <button
              type="button"
              onClick={() => setShowNew((p) => !p)}
              className="absolute right-3 top-9 text-[#94A3B8] hover:text-[#1E293B]"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Input
            label="Confirmer le nouveau mot de passe"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={passwordMutation.isPending}>
              <Save size={14} />
              Changer le mot de passe
            </Button>
          </div>
        </form>
      </motion.section>

      {/* ── Notifications ──────────────────────────────────────── */}
      <motion.section
        variants={fadeInUp}
        className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
        style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Bell size={16} className="text-amber-600" />
          </div>
          <h2 className="font-heading font-semibold text-[#1E293B]">Notifications</h2>
        </div>
        <div className="p-6 space-y-4">
          {[
            { key: 'notifEmailNewOffer', label: 'Nouvelles offres matchées', sublabel: 'Email' },
            { key: 'notifEmailApplicationStatus', label: 'Mise à jour candidatures', sublabel: 'Email' },
            { key: 'notifEmailWeeklyDigest', label: 'Résumé hebdomadaire', sublabel: 'Email' },
          ].map(({ key, label, sublabel }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-[#1E293B]">{label}</p>
                <p className="text-xs text-[#94A3B8]">{sublabel}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotifications((prev) => ({ ...prev, [key]: !prev[key as keyof typeof notifications] }))
                }
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  notifications[key as keyof typeof notifications] ? 'bg-accent' : 'bg-[#E2E8F0]'
                }`}
                aria-checked={notifications[key as keyof typeof notifications]}
                role="switch"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    notifications[key as keyof typeof notifications] ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => notifMutation.mutate(notifications)}
              loading={notifMutation.isPending}
            >
              <Save size={14} />
              Sauvegarder
            </Button>
          </div>
        </div>
      </motion.section>

      {/* ── Apparence & Langue ──────────────────────────────────── */}
      <motion.section
        variants={fadeInUp}
        className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
        style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Globe size={16} className="text-blue-600" />
          </div>
          <h2 className="font-heading font-semibold text-[#1E293B]">Apparence & Langue</h2>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-[#1E293B] mb-2">Thème</p>
            <div className="flex gap-2">
              {(['light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    theme === t
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-[#E2E8F0] text-[#64748B] hover:border-accent'
                  }`}
                >
                  {t === 'light' ? <Sun size={14} /> : <Moon size={14} />}
                  {t === 'light' ? 'Clair' : 'Sombre'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Email & SMTP ─────────────────────────────────────── */}
      <motion.section
        variants={fadeInUp}
        className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
        style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
            <Mail size={16} className="text-teal-600" />
          </div>
          <h2 className="font-heading font-semibold text-[#1E293B]">Email &amp; SMTP</h2>
        </div>
        <div className="p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#1E293B]">Configuration SMTP</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {smtpStatus?.configured
                ? `Serveur : ${smtpStatus.host} · Expéditeur : ${smtpStatus.from}`
                : 'Non configuré — les emails (alertes, candidatures) ne seront pas envoyés.'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {smtpStatus?.configured ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-100 rounded-full px-2.5 py-1">
                <CheckCircle size={13} />
                Configuré
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1">
                <XCircle size={13} />
                Non configuré
              </span>
            )}
            <Link href="/parametres/smtp">
              <Button variant="outline" size="sm">
                <ExternalLink size={13} />
                Configurer
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ── Contacter le support ──────────────────────────────── */}
      <ContactSection />

      {/* ── Déconnexion + Suppression ──────────────────────────── */}
      <motion.section
        variants={fadeInUp}
        className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
        style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <Shield size={16} className="text-red-500" />
          </div>
          <h2 className="font-heading font-semibold text-[#1E293B]">Zone dangereuse</h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1E293B]">Se déconnecter</p>
              <p className="text-xs text-[#94A3B8]">Déconnecte cette session</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <LogOut size={14} />
              Déconnexion
            </Button>
          </div>
          <hr className="border-[#E2E8F0]" />
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-red-600">Supprimer mon compte</p>
              <p className="text-xs text-[#94A3B8]">
                Votre compte sera mis en attente de suppression pendant 30 jours. Reconnectez-vous avant ce délai pour l&apos;annuler.
              </p>
            </div>

            {deleteStep === 'idle' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteStep('reason')}
              >
                <Trash2 size={14} />
                Supprimer mon compte
              </Button>
            )}

            {deleteStep === 'reason' && (
              <div className="space-y-3 border border-red-100 rounded-card p-4 bg-red-50/50">
                <p className="text-sm font-semibold text-[#1E293B]">Pourquoi souhaitez-vous supprimer votre compte ?</p>
                <div className="space-y-2">
                  {[
                    'Je n\'utilise plus le service',
                    'J\'ai trouvé un emploi',
                    'Le service ne me convient pas',
                    'Problème de confidentialité',
                    'Autre',
                  ].map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm text-[#1E293B] cursor-pointer">
                      <input
                        type="radio"
                        name="deleteReason"
                        value={r}
                        checked={deleteReason === r}
                        onChange={() => setDeleteReason(r)}
                        className="accent-accent"
                      />
                      {r}
                    </label>
                  ))}
                </div>
                {deleteReason === 'Autre' && (
                  <textarea
                    placeholder="Précisez votre raison…"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={2}
                    className="w-full p-2.5 border border-[#E2E8F0] rounded-btn text-sm focus:outline-none focus:border-accent resize-none"
                  />
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => { setDeleteStep('idle'); setDeleteReason(''); setCustomReason(''); }}>
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={!deleteReason || (deleteReason === 'Autre' && !customReason.trim())}
                    onClick={() => setDeleteStep('confirm')}
                  >
                    Continuer
                  </Button>
                </div>
              </div>
            )}

            {deleteStep === 'confirm' && (
              <div className="space-y-3 border border-red-200 rounded-card p-4 bg-red-50/50">
                <p className="text-sm text-[#1E293B]">
                  Tapez <strong>irréversible</strong> pour confirmer la suppression dans 30 jours.
                </p>
                <Input
                  placeholder='Tapez "irréversible" pour confirmer'
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setDeleteStep('idle'); setDeleteConfirm(''); setDeleteReason(''); setCustomReason(''); }}>
                    Annuler
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={!isDeleteReady}
                    loading={deleteAccountMutation.isPending}
                    onClick={() => deleteAccountMutation.mutate(deleteReason === 'Autre' ? customReason : deleteReason)}
                  >
                    <Trash2 size={14} />
                    Confirmer la suppression
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
