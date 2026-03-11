'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  ExternalLink,
  Send,
  Info,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/axios';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import toast from 'react-hot-toast';

const PROVIDERS = [
  {
    name: 'Gmail',
    icon: '📧',
    host: 'smtp.gmail.com',
    port: '587',
    secure: false,
    note: "Utilisez un mot de passe d'application Google (pas votre mot de passe habituel)",
    link: 'https://myaccount.google.com/apppasswords',
    linkLabel: "Créer un mot de passe d'app Google",
  },
  {
    name: 'Outlook / Hotmail',
    icon: '📮',
    host: 'smtp-mail.outlook.com',
    port: '587',
    secure: false,
    note: "Activez l'authentification à deux facteurs pour utiliser les mots de passe d'application",
    link: 'https://account.microsoft.com/security',
    linkLabel: 'Sécurité Microsoft',
  },
  {
    name: 'Mailtrap (Test)',
    icon: '🧪',
    host: 'sandbox.smtp.mailtrap.io',
    port: '587',
    secure: false,
    note: "Idéal pour tester — les emails n'arrivent pas vraiment, ils sont interceptés dans votre inbox Mailtrap",
    link: 'https://mailtrap.io/inboxes',
    linkLabel: 'Ouvrir Mailtrap',
  },
];

type SmtpConfig = { host: string; port: number; user: string; from: string; hasPassword: boolean };

export default function SmtpConfigPage() {
  const qc = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ host: '', port: '587', user: '', password: '', from: '' });

  const { data: currentConfig } = useQuery<SmtpConfig>({
    queryKey: ['smtp-config'],
    queryFn: () => api.get('/smtp/config').then((r) => r.data as SmtpConfig),
  });

  // Populate form once config is loaded
  useEffect(() => {
    if (currentConfig) {
      setForm((prev) => {
        const loadedUser = currentConfig.user || prev.user;
        const loadedHost = currentConfig.host || prev.host;
        // Auto-detect host from email if still empty after loading config
        const detected = !loadedHost && loadedUser ? detectHostFromEmail(loadedUser) : null;
        return {
          ...prev,
          host: loadedHost || detected?.host || prev.host,
          port: String(currentConfig.port || detected?.port || 587),
          user: loadedUser,
          from: currentConfig.from || prev.from,
        };
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConfig]);

  const saveMutation = useMutation({
    mutationFn: () => api.post('/smtp/config', form).then((r) => r.data),
    onSuccess: () => {
      toast.success('Configuration SMTP sauvegardée !');
      qc.invalidateQueries({ queryKey: ['smtp-status'] });
      qc.invalidateQueries({ queryKey: ['smtp-config'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erreur lors de la sauvegarde';
      toast.error(msg);
    },
  });

  const testMutation = useMutation({
    mutationFn: () => api.post('/smtp/test').then((r) => r.data),
    onSuccess: (data: { sentTo: string }) => {
      toast.success(`Email de test envoyé à ${data.sentTo} !`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? (err instanceof Error ? err.message : null)
        ?? "Erreur lors de l'envoi du test";
      toast.error(msg);
    },
  });

  // Auto-detect SMTP host from email domain
  const detectHostFromEmail = (email: string): { host: string; port: string } | null => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;
    if (domain === 'gmail.com' || domain === 'googlemail.com') return { host: 'smtp.gmail.com', port: '587' };
    if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com' || domain === 'msn.com') return { host: 'smtp-mail.outlook.com', port: '587' };
    if (domain === 'yahoo.com' || domain === 'yahoo.fr' || domain === 'ymail.com') return { host: 'smtp.mail.yahoo.com', port: '587' };
    return null;
  };

  const handleUserChange = (email: string) => {
    setForm((prev) => {
      const detected = !prev.host ? detectHostFromEmail(email) : null;
      return { ...prev, user: email, ...(detected ?? {}) };
    });
  };

  const fillProvider = (provider: (typeof PROVIDERS)[0]) => {
    setForm((prev) => ({ ...prev, host: provider.host, port: provider.port }));
  };

  const isFormValid = !!form.host && !!form.user && (!!form.password || !!currentConfig?.hasPassword);
  const [submitted, setSubmitted] = useState(false);

  // Wizard step derivation: 0=choose provider, 1=guide, 2=config, 3=test/done
  const wizardStep = !form.host ? 0 : !form.user ? 1 : !isFormValid ? 2 : 3;

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6 max-w-[720px]">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center gap-3">
        <Link href="/parametres" className="p-2 rounded-lg hover:bg-[#F7F8FC] text-[#64748B] hover:text-[#1E293B] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#1E293B]">Configuration SMTP</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Suivez le guide ci-dessous pour connecter votre email en 5 minutes</p>
        </div>
      </motion.div>

      {/* Wizard progress */}
      <motion.div variants={fadeInUp} className="bg-white rounded-card border border-[#E2E8F0] px-6 py-4" style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}>
        <div className="flex items-center gap-2">
          {(['Choisir un fournisseur', 'Suivre le guide', 'Remplir le formulaire', 'Tester la connexion'] as const).map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                wizardStep > i ? 'bg-emerald-500 text-white' : wizardStep === i ? 'bg-accent text-white' : 'bg-[#E2E8F0] text-[#94A3B8]'
              }`}>
                {wizardStep > i ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block truncate ${
                wizardStep === i ? 'text-accent' : wizardStep > i ? 'text-emerald-600' : 'text-[#94A3B8]'
              }`}>{label}</span>
              {i < 3 && <div className={`flex-1 h-0.5 rounded-full hidden sm:block ${
                wizardStep > i ? 'bg-emerald-400' : 'bg-[#E2E8F0]'
              }`} />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Gmail step-by-step guide — moved to top */}
      <motion.div
        variants={fadeInUp}
        className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
        style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <span className="text-base">📋</span>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-[#1E293B]">Guide de configuration — étape par étape</h3>
            <p className="text-xs text-[#64748B] mt-0.5">Recommandé : Gmail (la méthode la plus simple)</p>
          </div>
        </div>

        {/* Warning box */}
        <div className="mx-6 mt-5 flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Important :</strong> N&apos;utilisez jamais votre mot de passe Gmail habituel. Vous devez créer un <strong>mot de passe d&apos;application</strong> dédié (voir étape 3). C&apos;est un mot de passe spécial à 16 caractères, différent de votre mot de passe de compte.
          </p>
        </div>

        <div className="px-6 py-5 space-y-6">
          {[
            { step: 1, title: 'Vérifiez que vous avez un compte Gmail', desc: "Vous devez disposer d'un compte Google (Gmail). Si vous n'en avez pas, créez-en un gratuitement sur accounts.google.com.", link: null, linkLabel: null, badge: 'Pré-requis' },
            { step: 2, title: 'Activez la validation en deux étapes', desc: "Connectez-vous à votre compte Google. Allez dans Sécurité → Validation en deux étapes et activez-la. Cette étape est obligatoire avant de pouvoir générer un mot de passe d'application.", link: 'https://myaccount.google.com/security', linkLabel: 'Ouvrir la sécurité Google', badge: '2 minutes' },
            { step: 3, title: "Créez un mot de passe d'application", desc: "Toujours dans Sécurité, cherchez « Mots de passe des applications ». Choisissez « Autre (nom personnalisé) », tapez « CarrièrePilot » et cliquez sur « Générer ».", link: 'https://myaccount.google.com/apppasswords', linkLabel: "Créer un mot de passe d'app", badge: '1 minute' },
            { step: 4, title: 'Copiez le mot de passe généré', desc: "Google affiche un mot de passe de 16 caractères (ex : abcd efgh ijkl mnop). Copiez-le immédiatement — il ne sera affiché qu'une seule fois. Si vous le perdez, il faudra en regénérer un.", link: null, linkLabel: null, badge: 'Important' },
            { step: 5, title: 'Remplissez le formulaire et testez', desc: "Cliquez sur « Gmail » dans les fournisseurs ci-dessous pour pré-remplir le serveur. Entrez votre adresse Gmail et le mot de passe d'application généré. Cliquez sur « Enregistrer » puis « Tester » pour vérifier que tout fonctionne.", link: null, linkLabel: null, badge: '1 minute' },
          ].map(({ step, title, desc, link, linkLabel, badge }) => (
            <div key={step} className="flex gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 font-heading font-bold text-accent text-sm">{step}</div>
                {step < 5 && <div className="w-0.5 flex-1 bg-accent/10 rounded-full" />}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-[#1E293B]">{title}</p>
                  {badge && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent/10 text-accent">{badge}</span>
                  )}
                </div>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{desc}</p>
                {link && (
                  <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent font-semibold hover:underline mt-1.5">
                    {linkLabel} <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div
        variants={fadeInUp}
        className="bg-blue-50 border border-blue-100 rounded-card p-5 flex gap-3"
      >
        <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#1E293B]">Comment ça fonctionne ?</p>
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
            CarrièrePilot peut utiliser votre propre adresse email pour envoyer les alertes emploi, les candidatures automatiques et les notifications.
            Renseignez vos paramètres SMTP ci-dessous, puis cliquez sur &ldquo;Tester&rdquo; pour vérifier la connexion.
          </p>
        </div>
      </motion.div>

      {/* SMTP Configuration Form */}
      <motion.div
        variants={fadeInUp}
        className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
        style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <Mail size={16} className="text-teal-600" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-[#1E293B]">Paramètres SMTP</h3>
              {currentConfig?.hasPassword && (
                <p className="text-xs text-green-600 font-medium mt-0.5">✓ Configuration enregistrée</p>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">
                Serveur SMTP (hôte) <span className="text-red-500">*</span>
              </label>
              <input
                placeholder="smtp.gmail.com"
                value={form.host}
                onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))}
                className={`w-full px-3 py-2.5 border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-accent/15 ${
                  submitted && !form.host ? 'border-red-400 focus:border-red-400' : 'border-[#E2E8F0] focus:border-accent'
                }`}
              />
              {submitted && !form.host && <p className="mt-1 text-xs text-red-500">Champ requis</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Port</label>
              <input
                placeholder="587"
                value={form.port}
                onChange={(e) => setForm((p) => ({ ...p, port: e.target.value }))}
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-btn text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">
              Adresse email (identifiant) <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="votre@gmail.com"
              value={form.user}
              onChange={(e) => handleUserChange(e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-accent/15 ${
                submitted && !form.user ? 'border-red-400 focus:border-red-400' : 'border-[#E2E8F0] focus:border-accent'
              }`}
            />
            {submitted && !form.user && <p className="mt-1 text-xs text-red-500">Champ requis</p>}
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">
              Mot de passe d&apos;application <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={currentConfig?.hasPassword ? '••••••••••••••••' : 'xxxx xxxx xxxx xxxx'}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className={`w-full px-3 py-2.5 border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-accent/15 pr-10 ${
                submitted && !form.password && !currentConfig?.hasPassword ? 'border-red-400 focus:border-red-400' : 'border-[#E2E8F0] focus:border-accent'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 bottom-2.5 text-[#94A3B8] hover:text-[#1E293B]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {submitted && !form.password && !currentConfig?.hasPassword && <p className="mt-1 text-xs text-red-500">Champ requis</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Adresse expéditeur <span className="text-[#94A3B8] font-normal">(optionnel)</span></label>
            <input
              placeholder="noreply@votre-domaine.com"
              value={form.from}
              onChange={(e) => setForm((p) => ({ ...p, from: e.target.value }))}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-btn text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <p className="text-xs text-[#94A3B8]">
            Le mot de passe est chiffré avant d&apos;être stocké. Ne partagez jamais ce mot de passe.
          </p>
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => testMutation.mutate()}
              loading={testMutation.isPending}
              disabled={!form.host || !form.user}
            >
              <Send size={14} />
              Tester
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSubmitted(true);
                if (isFormValid) saveMutation.mutate();
              }}
              loading={saveMutation.isPending}
            >
              <Save size={14} />
              Enregistrer
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Providers */}
      <motion.div
        variants={fadeInUp}
        className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
        style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
            <Mail size={16} className="text-teal-600" />
          </div>
          <h3 className="font-heading font-semibold text-[#1E293B]">Fournisseurs supportés <span className="text-xs text-[#94A3B8] font-normal">(cliquez pour pré-remplir le serveur)</span></h3>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {PROVIDERS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => fillProvider(p)}
              className="w-full px-4 sm:px-6 py-4 flex items-start gap-3 sm:gap-4 hover:bg-[#F7F8FC] transition-colors text-left"
            >
              <span className="text-2xl shrink-0 mt-0.5">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#1E293B]">{p.name}</p>
                <p className="text-xs text-[#64748B] font-mono mt-0.5 break-all">
                  {p.host}:{p.port} · {p.secure ? 'SSL' : 'TLS'}
                </p>
                <p className="text-xs text-[#94A3B8] mt-1">{p.note}</p>
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 mt-1 text-xs text-accent hover:underline font-medium"
                >
                  {p.linkLabel}
                  <ExternalLink size={11} />
                </a>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        variants={fadeInUp}
        className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
        style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <HelpCircle size={16} className="text-violet-600" />
          </div>
          <h3 className="font-heading font-semibold text-[#1E293B]">Questions fréquentes</h3>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {[
            { q: "Je ne trouve pas « Mots de passe des applications » dans mon compte Google", a: "Cette option n'apparaît que si la validation en deux étapes est activée. Retournez à l'étape 2 et vérifiez qu'elle est bien active. Ensuite, recherchez « Mots de passe des applications » dans la barre de recherche de votre compte Google." },
            { q: "Mon mot de passe d'application ne fonctionne pas", a: "Vérifiez que vous avez bien copié les 16 caractères (sans les espaces). Si le problème persiste, supprimez le mot de passe d'application dans votre compte Google et regénérez-en un nouveau." },
            { q: "J'utilise Outlook, pas Gmail", a: "Cliquez sur « Outlook / Hotmail » dans les fournisseurs ci-dessus. Activez l'authentification à deux facteurs sur votre compte Microsoft, puis créez un mot de passe d'application depuis la page de sécurité Microsoft." },
            { q: "L'email de test n'arrive pas", a: "Vérifiez votre dossier spam. Si le problème persiste, essayez avec Mailtrap (fournisseur de test) pour confirmer que la configuration SMTP fonctionne." },
          ].map(({ q, a }) => (
            <div key={q} className="px-6 py-4">
              <p className="text-sm font-semibold text-[#1E293B]">{q}</p>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {testMutation.isSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-green-50 border border-green-100 rounded-card text-sm text-green-700"
        >
          <CheckCircle size={16} />
          Email envoyé ! Vérifiez votre boîte de réception.
        </motion.div>
      )}
    </motion.div>
  );
}
