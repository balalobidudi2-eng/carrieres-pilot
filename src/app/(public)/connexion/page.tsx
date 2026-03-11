'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Zap, Sparkles } from 'lucide-react';
import { useState, Suspense } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/axios';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court'),
});

type LoginForm = z.infer<typeof loginSchema>;

function ConnexionContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendingVerif, setResendingVerif] = useState(false);
  const { login, loginDemo, isLoading } = useAuthStore();
  const searchParams = useSearchParams();
  const justVerified = searchParams.get('verified') === '1';
  const tokenError = searchParams.get('error');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setUnverifiedEmail(null);
    try {
      await login(data.email, data.password);
    } catch (error: unknown) {
      const resp = (error as { response?: { data?: { code?: string } } })?.response;
      if (resp?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(data.email);
      } else {
        toast.error('Email ou mot de passe incorrect');
      }
    }
  };

  const handleResendVerif = async () => {
    if (!unverifiedEmail || resendingVerif) return;
    setResendingVerif(true);
    try {
      await api.post('/auth/verify-email', { email: unverifiedEmail });
      toast.success('Email de vérification renvoyé !');
    } catch {
      toast.error("Impossible d'envoyer l'email. Réessayez.");
    } finally {
      setResendingVerif(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await loginDemo();
    } catch {
      toast.error('Impossible de charger le compte démo');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-4">
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div variants={fadeInUp} className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-heading font-bold text-[#1E293B] text-xl">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            CarrièrePilot
          </Link>
          <h1 className="mt-4 text-2xl font-bold font-heading text-[#1E293B]">Bon retour 👋</h1>
          <p className="text-[#64748B] text-sm mt-1">Connectez-vous à votre espace</p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="bg-white rounded-card border border-[#E2E8F0] p-8"
          style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
        >
          {/* Success: just verified */}
          {justVerified && (
            <div className="mb-5 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium text-center">
              ✅ Email confirmé — vous pouvez maintenant vous connecter.
            </div>
          )}
          {/* Error: expired link */}
          {tokenError === 'lien_expire' && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
              Ce lien de vérification a expiré. Connectez-vous pour recevoir un nouveau lien.
            </div>
          )}
          {/* Error: Google OAuth not configured */}
          {tokenError === 'google_not_configured' && (
            <div className="mb-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 text-center">
              <p className="font-semibold mb-1">Google OAuth non configuré</p>
              <p className="text-xs">Ajoutez <code className="bg-amber-100 px-1 rounded">GOOGLE_CLIENT_ID</code> et <code className="bg-amber-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code> dans votre fichier <code className="bg-amber-100 px-1 rounded">.env.local</code>.</p>
            </div>
          )}
          {/* Error: other Google errors */}
          {tokenError && ['google_denied', 'google_error', 'google_state_mismatch', 'google_invalid_response', 'google_email_not_verified'].includes(tokenError) && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center">
              Connexion Google échouée. Réessayez ou utilisez votre email et mot de passe.
            </div>
          )}

          {/* Google SSO */}
          <button
            type="button"
            onClick={() => { window.location.href = '/api/auth/google'; }}
            className="w-full flex items-center justify-center gap-3 border border-[#E2E8F0] rounded-btn px-4 py-3 text-sm font-semibold text-[#1E293B] hover:bg-[#F7F8FC] transition-colors mb-5"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </button>

          {/* Demo account button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={demoLoading || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/30 rounded-btn px-4 py-3 text-sm font-semibold text-accent hover:from-accent/20 hover:to-primary/20 transition-all mb-3 disabled:opacity-60"
          >
            <Sparkles size={15} />
            {demoLoading ? 'Connexion...' : 'Accès démo instantané — sans inscription'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#E2E8F0]" />
            <span className="text-xs text-[#94A3B8]">ou avec votre compte</span>
            <div className="flex-1 h-px bg-[#E2E8F0]" />
          </div>

          {/* Unverified email warning */}
          {unverifiedEmail && (
            <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <p className="font-medium mb-1">Email non vérifié</p>
              <p className="text-xs text-amber-700 mb-3">
                Vérifiez votre boîte de réception et cliquez sur le lien de confirmation.
              </p>
              <button
                type="button"
                onClick={handleResendVerif}
                disabled={resendingVerif}
                className="text-xs font-semibold text-accent hover:underline disabled:opacity-60"
              >
                {resendingVerif ? 'Envoi...' : 'Renvoyer l\'email de confirmation →'}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="vous@exemple.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
              required
            />
            <Input
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#64748B] hover:text-[#1E293B]"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
              required
            />

            <div className="flex justify-end">
              <Link href="/mot-de-passe-oublie" className="text-xs text-accent hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={isLoading}>
              Se connecter
            </Button>
          </form>
        </motion.div>

        <motion.p variants={fadeInUp} className="text-center text-sm text-[#64748B] mt-5">
          Pas encore de compte ?{' '}
          <Link href="/inscription" className="text-accent font-semibold hover:underline">
            S&apos;inscrire gratuitement
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense>
      <ConnexionContent />
    </Suspense>
  );
}
