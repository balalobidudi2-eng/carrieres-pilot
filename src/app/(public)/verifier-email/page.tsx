'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Zap, RefreshCw, CheckCircle, ExternalLink } from 'lucide-react';
import { useState, Suspense } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { api } from '@/lib/axios';

function VerifierEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const devLink = searchParams.get('dev_link') ?? '';
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [newDevLink, setNewDevLink] = useState('');

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    try {
      const res = await api.post('/auth/verify-email', { email });
      setResent(true);
      if (res.data?.devPreviewUrl) setNewDevLink(res.data.devPreviewUrl);
      toast.success('Email renvoyé !');
    } catch {
      toast.error("Impossible d'envoyer l'email. Réessayez dans quelques instants.");
    } finally {
      setResending(false);
    }
  };

  const currentDevLink = newDevLink || devLink;

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-4">
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="w-full max-w-md text-center"
      >
        {/* Logo */}
        <motion.div variants={fadeInUp} className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-heading font-bold text-[#1E293B] text-xl">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            CarrièrePilot
          </Link>
        </motion.div>

        {/* DEV NOTICE — shown when SMTP is not configured */}
        {currentDevLink && (
          <motion.div
            variants={fadeInUp}
            className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-left"
          >
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
              Mode développement — SMTP non configuré
            </p>
            <p className="text-xs text-amber-700 mb-3 leading-relaxed">
              Aucun serveur mail n&apos;est configuré. Cliquez sur le bouton ci-dessous pour
              simuler la vérification d&apos;email (lien direct ou aperçu Ethereal) :
            </p>
            <a
              href={currentDevLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <ExternalLink size={13} />
              Ouvrir le lien de vérification
            </a>
          </motion.div>
        )}

        <motion.div
          variants={fadeInUp}
          className="bg-white rounded-card border border-[#E2E8F0] p-8"
          style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
        >
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Mail size={28} className="text-accent" />
          </div>

          <h1 className="text-2xl font-bold font-heading text-[#1E293B] mb-3">
            Vérifiez votre email
          </h1>

          <p className="text-[#475569] text-sm leading-relaxed mb-2">
            Un lien de confirmation a été envoyé à&nbsp;:
          </p>
          {email && (
            <p className="font-semibold text-[#1E293B] text-sm mb-6 break-all">{email}</p>
          )}

          <p className="text-[#64748B] text-sm leading-relaxed mb-8">
            Cliquez sur le lien dans l&apos;email pour activer votre compte.
            Le lien est valable <strong>24 heures</strong>.
          </p>

          {resent ? (
            <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-medium mb-6">
              <CheckCircle size={16} />
              Email renvoyé avec succès
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              fullWidth
              loading={resending}
              onClick={handleResend}
              className="mb-4"
            >
              <RefreshCw size={15} className="mr-2" />
              Renvoyer l&apos;email de confirmation
            </Button>
          )}

          <div className="border-t border-[#E2E8F0] pt-5 mt-2">
            <p className="text-xs text-[#94A3B8]">
              Vérifiez vos courriers indésirables si vous ne voyez pas l&apos;email.
            </p>
          </div>
        </motion.div>

        <motion.p variants={fadeInUp} className="text-center text-sm text-[#64748B] mt-5">
          Déjà un compte vérifié ?{' '}
          <Link href="/connexion" className="text-accent font-semibold hover:underline">
            Se connecter
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function VerifierEmailPage() {
  return (
    <Suspense>
      <VerifierEmailContent />
    </Suspense>
  );
}
