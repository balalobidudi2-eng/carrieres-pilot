'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Camera,
  Save,
  MapPin,
  Plus,
  X,
  Target,
  Briefcase,
  GraduationCap,
  Globe,
  FileText,
  Upload,
  ArrowRight,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import toast from 'react-hot-toast';

const schema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  location: z.string().optional(),
  currentTitle: z.string().optional(),
  bio: z.string().max(500).optional(),
  linkedinUrl: z.preprocess(
    (v) => typeof v === 'string' && v && !v.startsWith('http') ? 'https://' + v : v,
    z.string().url('URL invalide').optional().or(z.literal('')),
  ),
  targetSalary: z.string().optional(),
  targetContract: z.array(z.string()).optional(),
  targetLocations: z.array(z.string()).optional(),
  targetSectors: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
});
type FormData = z.infer<typeof schema>;

const CONTRACT_OPTIONS = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance', 'Mission'];
const SECTOR_OPTIONS = ['Tech', 'Design', 'Marketing', 'Finance', 'Santé', 'Retail', 'RH', 'Commercial', 'Logistique'];

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };
  return (
    <div className="flex flex-wrap gap-1.5 p-2 min-h-[44px] border border-[#E2E8F0] rounded-btn bg-white focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
      {values.map((v) => (
        <span key={v} className="flex items-center gap-1 bg-accent/10 text-accent text-xs font-semibold px-2 py-0.5 rounded-full">
          {v}
          <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        placeholder={placeholder}
        className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder:text-[#94A3B8]"
      />
    </div>
  );
}

export default function ProfilPage() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'info' | 'preferences' | 'competences'>('info');
  const letterFileRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
    placeholderData: user,
  });

  const { data: cvs = [], isLoading: cvLoading } = useQuery<{ id: string; name: string; atsScore?: number | null; updatedAt: string }[]>({
    queryKey: ['cvs'],
    queryFn: () => api.get('/cv').then((r) => r.data),
    placeholderData: [],
  });

  const { data: letters = [], isLoading: letterLoading } = useQuery<{ id: string; name: string; tone?: string | null; companyName?: string | null; updatedAt: string }[]>({
    queryKey: ['letters'],
    queryFn: () => api.get('/letters').then((r) => r.data),
    placeholderData: [],
  });

  const importLetterMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      form.append('jobTitle', 'Importée');
      form.append('company', '');
      return api.post('/letters/import', form).then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['letters'] });
      toast.success('Lettre importée avec succès !');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? (err instanceof Error ? err.message : null)
        ?? 'Erreur lors de l\'import';
      toast.error(msg);
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      email: profile?.email ?? '',
      phone: profile?.phone ?? '',
      location: profile?.location ?? '',
      currentTitle: profile?.currentTitle ?? '',
      bio: profile?.bio ?? '',
      linkedinUrl: profile?.linkedinUrl ?? '',
      targetSalary: profile?.targetSalary ?? '',
      targetContract: profile?.targetContract ?? [],
      targetLocations: profile?.targetLocations ?? [],
      targetSectors: profile?.targetSectors ?? [],
      skills: profile?.skills ?? [],
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => api.patch('/users/me', data).then((r) => r.data),
    onSuccess: (data) => {
      updateUser(data);
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profil mis à jour !');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? (err instanceof Error ? err.message : null)
        ?? 'Erreur lors de la sauvegarde';
      toast.error(msg);
    },
  });

  const targetContract = watch('targetContract') ?? [];
  const targetSectors = watch('targetSectors') ?? [];

  // Profile completion (0–100)
  const watchedValues = watch();
  const completionFields = [
    watchedValues.firstName,
    watchedValues.lastName,
    watchedValues.phone,
    watchedValues.location,
    watchedValues.currentTitle,
    watchedValues.bio,
    watchedValues.linkedinUrl,
    watchedValues.targetSalary,
    (watchedValues.targetContract ?? []).length > 0 ? 'ok' : '',
    (watchedValues.skills ?? []).length > 0 ? 'ok' : '',
    (cvs ?? []).length > 0 ? 'ok' : '',
    (letters ?? []).length > 0 ? 'ok' : '',
  ];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  const TABS = [
    { id: 'info', label: 'Informations', icon: User },
    { id: 'preferences', label: 'Préférences', icon: Target },
    { id: 'competences', label: 'Compétences', icon: GraduationCap },
  ] as const;

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6 max-w-[860px]">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-extrabold font-heading shrink-0 uppercase">
            {(user?.firstName ?? 'U').slice(0, 1)}
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border border-[#E2E8F0] flex items-center justify-center hover:bg-accent hover:text-white hover:border-transparent transition-colors shadow-sm">
            <Camera size={11} />
          </button>
        </div>
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#1E293B]">{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Mon profil'}</h2>
          <p className="text-sm text-[#64748B] mt-0.5">{user?.email}</p>
          {user?.plan && (
            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              user.plan === 'FREE' ? 'bg-gray-100 text-gray-600' : user.plan === 'PRO' ? 'bg-accent/10 text-accent' : 'bg-amber-50 text-amber-600'
            }`}>
              {user.plan}
            </span>
          )}
          {/* Profile completion indicator */}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-32 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${completionPct < 40 ? 'bg-red-400' : completionPct < 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="text-xs text-[#64748B] font-medium">{completionPct}% complet</span>
          </div>
        </div>
        <div className="ml-auto">
          <Button onClick={handleSubmit((d) => saveMutation.mutate(d))} loading={saveMutation.isPending}>
            <Save size={15} />
            Enregistrer
          </Button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInUp} className="flex gap-1 bg-[#F7F8FC] p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.id ? 'bg-white text-accent shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </motion.div>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
        {/* INFO TAB */}
        {activeTab === 'info' && (
          <motion.div variants={fadeInUp} className="bg-white rounded-card border border-[#E2E8F0] p-6 space-y-5" style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}>
            <h3 className="font-heading font-semibold text-[#1E293B] text-base border-b border-[#E2E8F0] pb-3">Informations personnelles</h3>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Prénom" {...register('firstName')} error={errors.firstName?.message} />
              <Input label="Nom" {...register('lastName')} error={errors.lastName?.message} />
              <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
              <Input label="Téléphone" {...register('phone')} placeholder="+33 6 00 00 00 00" />
              <Input label="Ville" {...register('location')} placeholder="Paris, France" leftIcon={<MapPin size={14} />} />
              <Input label="Titre / Poste" {...register('currentTitle')} placeholder="ex: UX Designer Senior" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Bio courte</label>
              <textarea
                {...register('bio')}
                rows={3}
                placeholder="Décrivez-vous en quelques phrases…"
                className="w-full p-3 border border-[#E2E8F0] rounded-btn text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
              />
              <p className="text-xs text-[#94A3B8] mt-1">{(watch('bio') ?? '').length}/500 caractères</p>
            </div>

            <h3 className="font-heading font-semibold text-[#1E293B] text-base border-b border-[#E2E8F0] pb-3 pt-2">Liens professionnels</h3>
            <div className="grid grid-cols-1 gap-3">
              <Input label="LinkedIn" {...register('linkedinUrl')} error={errors.linkedinUrl?.message} placeholder="https://linkedin.com/in/votre-profil" leftIcon={<Globe size={14} />} />
            </div>
          </motion.div>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <motion.div variants={fadeInUp} className="bg-white rounded-card border border-[#E2E8F0] p-6 space-y-5" style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}>
            <h3 className="font-heading font-semibold text-[#1E293B] text-base border-b border-[#E2E8F0] pb-3">Préférences de recherche</h3>

            {/* Salary */}
            <div>
              <p className="text-sm font-semibold text-[#1E293B] mb-2">Salaire cible</p>
              <Input label="Salaire souhaité" {...register('targetSalary')} placeholder="ex: 45-60k€/an" />
            </div>

            {/* Contract types */}
            <div>
              <p className="text-sm font-semibold text-[#1E293B] mb-2">Types de contrat souhaités</p>
              <div className="flex flex-wrap gap-2">
                {CONTRACT_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      const curr = targetContract;
                      setValue('targetContract', curr.includes(c) ? curr.filter((x) => x !== c) : [...curr, c], { shouldDirty: true });
                    }}
                    className={`px-3 py-1.5 rounded-btn text-xs font-semibold border transition-all ${
                      targetContract.includes(c) ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-[#F7F8FC] border-[#E2E8F0] text-[#64748B] hover:border-accent/30'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Sectors */}
            <div>
              <p className="text-sm font-semibold text-[#1E293B] mb-2">Secteurs d&apos;activité visés</p>
              <div className="flex flex-wrap gap-2">
                {SECTOR_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const curr = targetSectors;
                      setValue('targetSectors', curr.includes(s) ? curr.filter((x) => x !== s) : [...curr, s], { shouldDirty: true });
                    }}
                    className={`px-3 py-1.5 rounded-btn text-xs font-semibold border transition-all ${
                      targetSectors.includes(s) ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-[#F7F8FC] border-[#E2E8F0] text-[#64748B] hover:border-primary/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Locations */}
            <div>
              <p className="text-sm font-semibold text-[#1E293B] mb-2">Localisations souhaitées</p>
              <Controller
                name="targetLocations"
                control={control}
                render={({ field }) => (
                  <TagInput values={field.value ?? []} onChange={field.onChange} placeholder="Appuyez sur Entrée pour ajouter…" />
                )}
              />
            </div>
          </motion.div>
        )}

        {/* COMPETENCES TAB */}
        {activeTab === 'competences' && (
          <motion.div variants={fadeInUp} className="bg-white rounded-card border border-[#E2E8F0] p-6 space-y-5" style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}>
            <h3 className="font-heading font-semibold text-[#1E293B] text-base border-b border-[#E2E8F0] pb-3">Compétences</h3>
            <p className="text-sm text-[#64748B]">Renseignez vos compétences clés — elles seront utilisées pour le matching IA des offres.</p>
            <Controller
              name="skills"
              control={control}
              render={({ field }) => (
                <TagInput values={field.value ?? []} onChange={field.onChange} placeholder="ex: React, Figma, Management (Entrée pour valider)…" />
              )}
            />
            <div className="flex flex-wrap gap-2 pt-2">
              {['React', 'TypeScript', 'Node.js', 'Figma', 'UX Design', 'Agile', 'SQL', 'Python'].map((s) => {
                const skills = watch('skills') ?? [];
                if (skills.includes(s)) return null;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValue('skills', [...skills, s], { shouldDirty: true })}
                    className="flex items-center gap-1 text-xs text-[#64748B] border border-dashed border-[#CBD5E1] px-2.5 py-1 rounded-full hover:border-accent/40 hover:text-accent transition-colors"
                  >
                    <Plus size={10} />{s}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </form>

      {/* ── Documents actifs ── */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CV actif */}
        <div className="bg-white rounded-card border border-[#E2E8F0] p-5 space-y-3" style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <FileText size={15} className="text-primary" />
            </div>
            <h3 className="font-heading font-semibold text-[#1E293B] text-sm">CV actif</h3>
          </div>

          {cvLoading ? (
            <div className="h-10 bg-gray-100 animate-pulse rounded" />
          ) : cvs.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">Aucun CV créé pour le moment</p>
          ) : (
            <div>
              <p className="text-sm font-semibold text-[#1E293B] truncate">{cvs[0].name}</p>
              {cvs[0].atsScore != null && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${cvs[0].atsScore}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-accent">{cvs[0].atsScore}%</span>
                  <span className="text-xs text-[#94A3B8]">ATS</span>
                </div>
              )}
              <p className="text-xs text-[#94A3B8] mt-1">
                Modifié le {new Date(cvs[0].updatedAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          )}

          <Link href="/cv" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
            Gérer mes CV <ArrowRight size={13} />
          </Link>
        </div>

        {/* Lettre active */}
        <div className="bg-white rounded-card border border-[#E2E8F0] p-5 space-y-3" style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
              <Mail size={15} className="text-accent" />
            </div>
            <h3 className="font-heading font-semibold text-[#1E293B] text-sm">Lettre de motivation active</h3>
          </div>

          {letterLoading ? (
            <div className="h-10 bg-gray-100 animate-pulse rounded" />
          ) : letters.length === 0 ? (
            <p className="text-sm text-[#94A3B8]">Aucune lettre créée pour le moment</p>
          ) : (
            <div>
              <p className="text-sm font-semibold text-[#1E293B] truncate">{letters[0].name}</p>
              <div className="flex items-center gap-2 mt-1">
                {letters[0].tone && <Badge variant="neutral" size="sm">{letters[0].tone}</Badge>}
                {letters[0].companyName && <span className="text-xs text-[#94A3B8]">{letters[0].companyName}</span>}
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Modifiée le {new Date(letters[0].updatedAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Link href="/lettre" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              Gérer mes lettres <ArrowRight size={13} />
            </Link>
            <button
              type="button"
              onClick={() => letterFileRef.current?.click()}
              disabled={importLetterMutation.isPending}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#64748B] hover:text-accent transition-colors disabled:opacity-50"
            >
              <Upload size={13} />
              {importLetterMutation.isPending ? 'Import…' : 'Importer'}
            </button>
            <input
              type="file"
              ref={letterFileRef}
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importLetterMutation.mutate(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
