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
            CarrièrePilot peut utiliser votre propre adresse email pour envoyer les alertes emploi, les candidatures automatiques et les notifications.
            Suivez le guide ci-dessous pour configurer Gmail en moins de 5 minutes.
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

      {/* Gmail step-by-step guide */}
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
            <h3 className="font-heading font-semibold text-[#1E293B]">Guide Gmail — étape par étape</h3>
            <p className="text-xs text-[#64748B] mt-0.5">La méthode la plus simple, recommandée pour démarrer</p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-6">

          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 font-heading font-bold text-accent text-sm">1</div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-[#1E293B]">Activez la validation en deux étapes</p>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                Allez dans votre compte Google → <strong>Sécurité</strong> → <strong>Validation en deux étapes</strong> et activez-la.
                C&apos;est obligatoire avant de pouvoir générer un mot de passe d&apos;application.
              </p>
              <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent font-semibold hover:underline mt-1.5">
                Ouvrir la sécurité Google <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 font-heading font-bold text-accent text-sm">2</div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-[#1E293B]">Créez un mot de passe d&apos;application</p>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                Dans <strong>Sécurité</strong>, cherchez <strong>Mots de passe des applications</strong>.
                Choisissez <em>Autre (nom personnalisé)</em>, tapez <strong>CarrièrePilot</strong> et cliquez sur <strong>Générer</strong>.
              </p>
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent font-semibold hover:underline mt-1.5">
                Créer un mot de passe d&apos;app <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 font-heading font-bold text-accent text-sm">3</div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-[#1E293B]">Copiez le mot de passe généré</p>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                Google affiche un mot de passe de <strong>16 caractères</strong> (ex&nbsp;: <em>xxxx xxxx xxxx xxxx</em>).
                Copiez-le immédiatement — il ne sera affiché qu&apos;une seule fois.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 font-heading font-bold text-accent text-sm">4</div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-[#1E293B]">Utilisez ces paramètres dans CarrièrePilot</p>
              <div className="mt-2 bg-[#F7F8FC] border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                {[
                  { label: 'Serveur', value: 'smtp.gmail.com' },
                  { label: 'Port', value: '587 (TLS)' },
                  { label: 'Identifiant', value: 'votre adresse Gmail complète' },
                  { label: 'Mot de passe', value: 'le mot de passe d\'app généré à l\'étape 3' },
                  { label: 'Expéditeur', value: 'votre adresse Gmail (ou noreply@carrieres-pilot.fr)' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-2 text-xs">
                    <span className="font-semibold text-[#1E293B] shrink-0 w-24">{label}&nbsp;:</span>
                    <span className="text-[#64748B]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
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
