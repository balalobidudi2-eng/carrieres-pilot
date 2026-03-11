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
    icon: 'ðŸ“§',
    host: 'smtp.gmail.com',
    port: '587',
    secure: false,
    note: 'Utilisez un mot de passe d\'application Google (pas votre mot de passe habituel)',
    link: 'https://myaccount.google.com/apppasswords',
    linkLabel: 'CrÃ©er un mot de passe d\'app Google',
  },
  {
    name: 'Outlook / Hotmail',
    icon: 'ðŸ“®',
    host: 'smtp-mail.outlook.com',
    port: '587',
    secure: false,
    note: 'Activez l\'authentification Ã  deux facteurs pour utiliser les mots de passe d\'application',
    link: 'https://account.microsoft.com/security',
    linkLabel: 'SÃ©curitÃ© Microsoft',
  },
  {
    name: 'Mailtrap (Test)',
    icon: 'ðŸ§ª',
    host: 'sandbox.smtp.mailtrap.io',
    port: '587',
    secure: false,
    note: 'IdÃ©al pour tester â€” les emails n\'arrivent pas vraiment, ils sont interceptÃ©s dans votre inbox Mailtrap',
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
      setForm((prev) => ({
        ...prev,
        host: currentConfig.host || prev.host,
        port: String(currentConfig.port || 587),
        user: currentConfig.user || prev.user,
        from: currentConfig.from || prev.from,
      }));
    }
  }, [currentConfig]);

  const saveMutation = useMutation({
    mutationFn: () => api.post('/smtp/config', form).then((r) => r.data),
    onSuccess: () => {
      toast.success('Configuration SMTP sauvegardÃ©e !');
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
      toast.success(`Email de test envoyÃ© Ã  ${data.sentTo} !`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? (err instanceof Error ? err.message : null)
        ?? 'Erreur lors de l\'envoi du test';
      toast.error(msg);
    },
  });

  const fillProvider = (provider: typeof PROVIDERS[0]) => {
    setForm((prev) => ({ ...prev, host: provider.host, port: provider.port }));
  };

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6 max-w-[720px]">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center gap-3">
        <Link href="/parametres" className="p-2 rounded-lg hover:bg-[#F7F8FC] text-[#64748B] hover:text-[#1E293B] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#1E293B]">Configuration SMTP</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Configurez votre serveur email pour les alertes et candidatures</p>
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div
        variants={fadeInUp}
        className="bg-blue-50 border border-blue-100 rounded-card p-5 flex gap-3"
      >
        <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#1E293B]">Comment Ã§a fonctionne ?</p>
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
            CarriÃ¨rePilot peut utiliser votre propre adresse email pour envoyer les alertes emploi, les candidatures automatiques et les notifications.
            Renseignez vos paramÃ¨tres SMTP ci-dessous, puis cliquez sur &ldquo;Tester&rdquo; pour vÃ©rifier la connexion.
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
              <h3 className="font-heading font-semibold text-[#1E293B]">ParamÃ¨tres SMTP</h3>
              {currentConfig?.hasPassword && (
                <p className="text-xs text-green-600 font-medium mt-0.5">âœ“ Configuration enregistrÃ©e</p>
              )}
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Serveur SMTP (hÃ´te)"
                placeholder="smtp.gmail.com"
                value={form.host}
                onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Port"
                placeholder="587"
                value={form.port}
                onChange={(e) => setForm((p) => ({ ...p, port: e.target.value }))}
              />
            </div>
          </div>
          <Input
            label="Adresse email (identifiant)"
            type="email"
            placeholder="votre@gmail.com"
            value={form.user}
            onChange={(e) => setForm((p) => ({ ...p, user: e.target.value }))}
          />
          <div className="relative">
            <Input
              label="Mot de passe d'application"
              type={showPassword ? 'text' : 'password'}
              placeholder={currentConfig?.hasPassword ? 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢' : 'xxxx xxxx xxxx xxxx'}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-9 text-[#94A3B8] hover:text-[#1E293B]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Input
            label="Adresse expÃ©diteur (optionnel)"
            placeholder="noreply@votre-domaine.com (laissez vide pour utiliser l'identifiant)"
            value={form.from}
            onChange={(e) => setForm((p) => ({ ...p, from: e.target.value }))}
          />
          <p className="text-xs text-[#94A3B8]">
            Le mot de passe est chiffrÃ© avant d&apos;Ãªtre stockÃ©. Ne partagez jamais ce mot de passe.
          </p>
          <div className="flex justify-end gap-3 pt-2">
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
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!form.host || !form.user || !form.password}
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
          <h3 className="font-heading font-semibold text-[#1E293B]">Fournisseurs supportÃ©s <span className="text-xs text-[#94A3B8] font-normal">(cliquez pour prÃ©-remplir le serveur)</span></h3>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {PROVIDERS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => fillProvider(p)}
              className="w-full px-6 py-4 flex items-start gap-4 hover:bg-[#F7F8FC] transition-colors text-left"
            >
              <span className="text-2xl shrink-0 mt-0.5">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#1E293B]">{p.name}</p>
                <p className="text-xs text-[#64748B] font-mono mt-0.5">
                  {p.host}:{p.port} Â· {p.secure ? 'SSL' : 'TLS'}
                </p>
                <p className="text-xs text-[#94A3B8] mt-1">{p.note}</p>
              </div>
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 flex items-center gap-1 text-xs text-accent hover:underline font-medium"
              >
                {p.linkLabel}
                <ExternalLink size={11} />
              </a>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Gmail step-by-step guide */}
      <motion.div
        variants={fadeInUp}
        className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
        style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <span className="text-base">ðŸ“‹</span>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-[#1E293B]">Guide Gmail â€” Ã©tape par Ã©tape</h3>
            <p className="text-xs text-[#64748B] mt-0.5">La mÃ©thode la plus simple, recommandÃ©e pour dÃ©marrer</p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-6">
          {[
            { step: 1, title: 'Activez la validation en deux Ã©tapes', desc: 'Allez dans votre compte Google â†’ SÃ©curitÃ© â†’ Validation en deux Ã©tapes et activez-la. C\'est obligatoire avant de pouvoir gÃ©nÃ©rer un mot de passe d\'application.', link: 'https://myaccount.google.com/security', linkLabel: 'Ouvrir la sÃ©curitÃ© Google' },
            { step: 2, title: 'CrÃ©ez un mot de passe d\'application', desc: 'Dans SÃ©curitÃ©, cherchez Mots de passe des applications. Choisissez Autre (nom personnalisÃ©), tapez CarriÃ¨rePilot et cliquez sur GÃ©nÃ©rer.', link: 'https://myaccount.google.com/apppasswords', linkLabel: 'CrÃ©er un mot de passe d\'app' },
            { step: 3, title: 'Copiez le mot de passe gÃ©nÃ©rÃ©', desc: 'Google affiche un mot de passe de 16 caractÃ¨res (ex : xxxx xxxx xxxx xxxx). Copiez-le immÃ©diatement â€” il ne sera affichÃ© qu\'une seule fois.', link: null, linkLabel: null },
            { step: 4, title: 'Collez-le dans le formulaire ci-dessus', desc: 'Cliquez sur "Gmail" dans les fournisseurs pour prÃ©-remplir le serveur, puis entrez votre adresse Gmail et le mot de passe d\'application gÃ©nÃ©rÃ©.', link: null, linkLabel: null },
          ].map(({ step, title, desc, link, linkLabel }) => (
            <div key={step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 font-heading font-bold text-accent text-sm">{step}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-[#1E293B]">{title}</p>
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

      {testMutation.isSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-green-50 border border-green-100 rounded-card text-sm text-green-700"
        >
          <CheckCircle size={16} />
          Email envoyÃ© ! VÃ©rifiez votre boÃ®te de rÃ©ception.
        </motion.div>
      )}
    </motion.div>
  );
}


