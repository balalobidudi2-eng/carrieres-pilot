'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
} from 'lucide-react';
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
    emailNewOffer: user?.notifEmailNewOffer ?? true,
    emailApplicationStatus: user?.notifEmailApplicationStatus ?? true,
    emailWeeklyDigest: user?.notifEmailWeeklyDigest ?? false,
    pushNewOffer: false,
    pushApplicationStatus: true,
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
            { key: 'emailNewOffer', label: 'Nouvelles offres matchées', sublabel: 'Email' },
            { key: 'emailApplicationStatus', label: 'Mise à jour candidatures', sublabel: 'Email' },
            { key: 'emailWeeklyDigest', label: 'Résumé hebdomadaire', sublabel: 'Email' },
            { key: 'pushNewOffer', label: 'Nouvelles offres', sublabel: 'Push' },
            { key: 'pushApplicationStatus', label: 'Mise à jour candidatures', sublabel: 'Push' },
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
              {(['light', 'system', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    theme === t
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-[#E2E8F0] text-[#64748B] hover:border-accent'
                  }`}
                >
                  {t === 'light' ? <Sun size={14} /> : t === 'dark' ? <Moon size={14} /> : <Globe size={14} />}
                  {t === 'light' ? 'Clair' : t === 'dark' ? 'Sombre' : 'Système'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

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
