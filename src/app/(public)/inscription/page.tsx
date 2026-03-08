'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Zap } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fadeInUp, staggerContainer } from '@/lib/animations';
import { useAuthStore } from '@/stores/authStore';

const signupSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  acceptTerms: z.boolean().refine((v) => v, 'Vous devez accepter les CGU'),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function InscriptionPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });

  const password = watch('password', '');
  const strength = getPasswordStrength(password);

  const onSubmit = async (data: SignupForm) => {
    try {
      await registerUser(data.firstName, data.lastName, data.email, data.password);
      toast.success('Compte créé ! Vérifiez votre email.');
    } catch {
      toast.error('Une erreur est survenue. Réessayez.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-4 py-10">
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
          <h1 className="mt-4 text-2xl font-bold font-heading text-[#1E293B]">Créer un compte gratuit</h1>
          <p className="text-[#64748B] text-sm mt-1">Sans carte bancaire • Prêt en 2 minutes</p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          className="bg-white rounded-card border border-[#E2E8F0] p-8"
          style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
        >
          {/* Google SSO */}
          <button className="w-full flex items-center justify-center gap-3 border border-[#E2E8F0] rounded-btn px-4 py-3 text-sm font-semibold text-[#1E293B] hover:bg-[#F7F8FC] transition-colors mb-5">
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#E2E8F0]" />
            <span className="text-xs text-[#94A3B8]">ou</span>
            <div className="flex-1 h-px bg-[#E2E8F0]" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prénom"
                placeholder="Sophie"
                leftIcon={<User size={15} />}
                error={errors.firstName?.message}
                {...register('firstName')}
                required
              />
              <Input
                label="Nom"
                placeholder="Martin"
                error={errors.lastName?.message}
                {...register('lastName')}
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              placeholder="vous@exemple.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
              required
            />
            <div>
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 caractères"
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#64748B] hover:text-[#1E293B]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
                required
              />
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= strength.score
                          ? strength.score === 1
                            ? 'bg-red-400'
                            : strength.score === 2
                            ? 'bg-amber-400'
                            : strength.score === 3
                            ? 'bg-blue-400'
                            : 'bg-emerald-400'
                          : 'bg-[#E2E8F0]'
                      }`}
                    />
                  ))}
                  <span className={`text-xs ml-1 font-medium ${strength.color}`}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Accept terms */}
            <label className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-[#E2E8F0] text-accent focus:ring-accent/30 w-4 h-4"
                {...register('acceptTerms')}
              />
              <span className="text-xs text-[#64748B] leading-relaxed">
                J&apos;accepte les{' '}
                <Link href="/cgu" className="text-accent hover:underline">
                  Conditions Générales d&apos;Utilisation
                </Link>{' '}
                et la{' '}
                <Link href="/confidentialite" className="text-accent hover:underline">
                  Politique de confidentialité
                </Link>
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-xs text-red-500 -mt-2">{errors.acceptTerms.message}</p>
            )}

            <Button type="submit" fullWidth loading={isLoading} size="lg">
              Créer mon compte gratuitement
            </Button>
          </form>
        </motion.div>

        <motion.p variants={fadeInUp} className="text-center text-sm text-[#64748B] mt-5">
          Déjà un compte ?{' '}
          <Link href="/connexion" className="text-accent font-semibold hover:underline">
            Se connecter
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map = [
    { label: 'Faible', color: 'text-red-500' },
    { label: 'Faible', color: 'text-red-500' },
    { label: 'Moyen', color: 'text-amber-500' },
    { label: 'Bon', color: 'text-blue-500' },
    { label: 'Fort', color: 'text-emerald-500' },
  ];
  return { score, ...map[score] };
}
