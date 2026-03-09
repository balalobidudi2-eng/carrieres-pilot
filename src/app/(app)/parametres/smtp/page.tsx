'use client';

import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  CheckCircle,
  ExternalLink,
  Send,
  Info,
  Terminal,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
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
    note: 'Utilisez un mot de passe d\'application Google (pas votre mot de passe habituel)',
    link: 'https://myaccount.google.com/apppasswords',
    linkLabel: 'Créer un mot de passe d\'app Google',
  },
  {
    name: 'Outlook / Hotmail',
    icon: '📮',
    host: 'smtp-mail.outlook.com',
    port: '587',
    secure: false,
    note: 'Activez l\'authentification à deux facteurs pour utiliser les mots de passe d\'application',
    link: 'https://account.microsoft.com/security',
    linkLabel: 'Sécurité Microsoft',
  },
  {
    name: 'Mailtrap (Test)',
    icon: '🧪',
    host: 'sandbox.smtp.mailtrap.io',
    port: '587',
    secure: false,
    note: 'Idéal pour tester — les emails n\'arrivent pas vraiment, ils sont interceptés dans votre inbox Mailtrap',
    link: 'https://mailtrap.io/inboxes',
    linkLabel: 'Ouvrir Mailtrap',
  },
];

const ENV_VARS = [
  { key: 'SMTP_HOST', example: 'smtp.gmail.com', desc: 'Serveur SMTP' },
  { key: 'SMTP_PORT', example: '587', desc: 'Port (587 = TLS, 465 = SSL)' },
  { key: 'SMTP_SECURE', example: 'false', desc: '"true" pour SSL (port 465), "false" pour TLS' },
  { key: 'SMTP_USER', example: 'votre@email.com', desc: 'Identifiant SMTP / email' },
  { key: 'SMTP_PASS', example: 'votre_mot_de_passe_app', desc: 'Mot de passe ou mot de passe d\'app' },
  { key: 'SMTP_FROM', example: 'noreply@carrieres-pilot.fr', desc: 'Adresse expéditeur affichée' },
];

export default function SmtpConfigPage() {
  const testMutation = useMutation({
    mutationFn: () => api.post('/smtp/test').then((r) => r.data),
    onSuccess: (data: { sentTo: string }) => {
      toast.success(`Email de test envoyé à ${data.sentTo} !`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? (err instanceof Error ? err.message : null)
        ?? 'Erreur lors de l\'envoi du test';
      toast.error(msg);
    },
  });

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
          <p className="text-sm font-semibold text-[#1E293B]">Comment ça fonctionne ?</p>
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
            CarrièrePilot utilise votre propre serveur SMTP pour envoyer les emails (alertes emploi, candidatures automatiques, notifications).
            La configuration se fait via les variables d&apos;environnement dans le fichier <code className="bg-blue-100/70 px-1 rounded text-blue-700">.env</code> à la racine du projet.
          </p>
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
          <h3 className="font-heading font-semibold text-[#1E293B]">Fournisseurs supportés</h3>
        </div>
        <div className="divide-y divide-[#E2E8F0]">
          {PROVIDERS.map((p) => (
            <div key={p.name} className="px-6 py-4 flex items-start gap-4">
              <span className="text-2xl shrink-0 mt-0.5">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#1E293B]">{p.name}</p>
                <p className="text-xs text-[#64748B] font-mono mt-0.5">
                  {p.host}:{p.port} · {p.secure ? 'SSL' : 'TLS'}
                </p>
                <p className="text-xs text-[#94A3B8] mt-1">{p.note}</p>
              </div>
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 text-xs text-accent hover:underline font-medium"
              >
                {p.linkLabel}
                <ExternalLink size={11} />
              </a>
            </div>
          ))}
        </div>
      </motion.div>

      {/* .env instructions */}
      <motion.div
        variants={fadeInUp}
        className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
        style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Terminal size={16} className="text-slate-600" />
          </div>
          <h3 className="font-heading font-semibold text-[#1E293B]">Variables d&apos;environnement</h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          <p className="text-xs text-[#64748B]">
            Modifiez votre fichier <code className="bg-[#F7F8FC] border border-[#E2E8F0] px-1.5 py-0.5 rounded text-[#1E293B] font-mono">.env</code> à la racine du projet et redémarrez le serveur :
          </p>

          {/* Code block */}
          <div className="bg-[#1E293B] rounded-xl overflow-x-auto">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs text-white/40 ml-2 font-mono">.env</span>
            </div>
            <pre className="px-4 py-4 text-xs text-emerald-300 font-mono leading-relaxed overflow-x-auto">
{`# ─── SMTP (Email) ────────────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="votre@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"   # mot de passe d'app
SMTP_FROM="votre@gmail.com"`}
            </pre>
          </div>

          {/* Field reference */}
          <div className="space-y-2 pt-2">
            {ENV_VARS.map(({ key, example, desc }) => (
              <div key={key} className="flex items-start gap-3 text-xs">
                <code className="font-mono text-accent bg-accent/5 border border-accent/15 px-2 py-0.5 rounded shrink-0">{key}</code>
                <div>
                  <span className="text-[#1E293B] font-medium">{desc}</span>
                  <span className="text-[#94A3B8] ml-2">ex: <em>{example}</em></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Test email */}
      <motion.div
        variants={fadeInUp}
        className="bg-white rounded-card border border-[#E2E8F0] p-6 flex items-center justify-between gap-4"
        style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
      >
        <div>
          <p className="font-semibold text-sm text-[#1E293B]">Tester la configuration</p>
          <p className="text-xs text-[#64748B] mt-0.5">
            Envoie un email de test à votre adresse pour vérifier que tout fonctionne.
          </p>
        </div>
        <Button
          onClick={() => testMutation.mutate()}
          loading={testMutation.isPending}
        >
          <Send size={14} />
          Envoyer un test
        </Button>
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
