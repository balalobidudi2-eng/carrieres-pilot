'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileText,
  Plus,
  Sparkles,
  Copy,
  Download,
  Trash2,
  ChevronDown,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/axios';
import { staggerContainer, fadeInUp, modalVariants } from '@/lib/animations';
import type { CoverLetter } from '@/types';
import toast from 'react-hot-toast';

type Tone = 'professional' | 'dynamic' | 'creative';

const schema = z.object({
  jobTitle: z.string().min(2, 'Requis'),
  company: z.string().min(2, 'Requis'),
  jobDescription: z.string().min(20, 'Décrivez le poste (20 caractères min.)'),
  tone: z.enum(['professional', 'dynamic', 'creative']),
});
type FormData = z.infer<typeof schema>;

const TONES: { value: Tone; label: string; desc: string }[] = [
  { value: 'professional', label: 'Professionnel', desc: 'Formel, structuré, axé résultats' },
  { value: 'dynamic', label: 'Dynamique', desc: 'Engagé, proactif, enthousiaste' },
  { value: 'creative', label: 'Créatif', desc: 'Original, mémorable, distinctif' },
];

export default function LettresPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: letters = [], refetch } = useQuery<CoverLetter[]>({
    queryKey: ['letters'],
    queryFn: () => api.get('/letters').then((r) => r.data),
    placeholderData: [],
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tone: 'professional' },
  });

  const tone = watch('tone');

  const generateMutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/letters/generate-ai', data).then((r) => r.data.content),
    onSuccess: (content: string) => {
      setGenerated(content);
      toast.success('Lettre générée avec succès !');
    },
    onError: () => toast.error('Erreur lors de la génération'),
  });

  const saveMutation = useMutation({
    mutationFn: (data: FormData & { content: string }) =>
      api.post('/letters', data),
    onSuccess: () => {
      refetch();
      setModalOpen(false);
      reset();
      setGenerated(null);
      toast.success('Lettre sauvegardée !');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/letters/${id}`),
    onSuccess: () => { refetch(); toast.success('Lettre supprimée'); },
  });

  const onGenerate = handleSubmit((data) => generateMutation.mutate(data));

  const mockLetters: CoverLetter[] = letters.length > 0 ? letters : [
    { id: '1', userId: '', jobTitle: 'Lead UX Designer', company: 'Stripe', tone: 'professional', content: 'Madame, Monsieur,\n\nFort de 5 ans d\'expérience en UX Design…', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '2', userId: '', jobTitle: 'Product Designer', company: 'Figma', tone: 'dynamic', content: 'Passionné par la conception d\'expériences…', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), updatedAt: new Date().toISOString() },
  ];

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6 max-w-[900px]">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#1E293B]">Lettres de motivation</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Générées par IA, personnalisées pour chaque offre</p>
        </div>
        <Button onClick={() => { reset(); setGenerated(null); setModalOpen(true); }}>
          <Plus size={16} />
          Nouvelle lettre
        </Button>
      </motion.div>

      {/* Letters list */}
      <div className="space-y-3">
        {mockLetters.map((l) => (
          <motion.div
            key={l.id}
            variants={fadeInUp}
            className="bg-white rounded-card border border-[#E2E8F0] p-5 flex items-start gap-4"
            style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
          >
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
              <FileText size={18} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[#1E293B] text-sm leading-tight">{l.jobTitle}</h3>
                  <p className="text-xs text-[#64748B]">{l.company}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={l.tone === 'professional' ? 'primary' : l.tone === 'dynamic' ? 'success' : 'warning'}>
                    {TONES.find((t) => t.value === l.tone)?.label}
                  </Badge>
                  <span className="text-xs text-[#94A3B8]">
                    {new Date(l.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#64748B] mt-2 line-clamp-2 leading-relaxed">{l.content}</p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(l.content); toast.success('Copié !'); }}>
                  <Copy size={12} />Copier
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(l.id)}>
                  <Trash2 size={12} />Supprimer
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Generate Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Générer une lettre de motivation" maxWidth="max-w-2xl">
        <form onSubmit={onGenerate} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Poste visé" {...register('jobTitle')} error={errors.jobTitle?.message} placeholder="ex: Lead UX Designer" />
            <Input label="Entreprise" {...register('company')} error={errors.company?.message} placeholder="ex: Stripe" />
          </div>
          <Textarea
            label="Description du poste"
            {...register('jobDescription')}
            error={errors.jobDescription?.message}
            placeholder="Coller la description de l'offre ici…"
            rows={4}
            helperText="Plus vous donnez de contexte, meilleure sera la lettre"
          />

          {/* Tone selector */}
          <div>
            <p className="text-sm font-semibold text-[#1E293B] mb-2">Ton de la lettre</p>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setValue('tone', t.value)}
                  className={`p-3 rounded-btn border text-left transition-all ${
                    tone === t.value
                      ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
                      : 'border-[#E2E8F0] hover:border-accent/40'
                  }`}
                >
                  <p className="font-semibold text-sm text-[#1E293B]">{t.label}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" loading={generateMutation.isPending} className="w-full">
            <Wand2 size={16} />
            Générer avec l&apos;IA
          </Button>
        </form>

        {/* Generated output */}
        <AnimatePresence>
          {generated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 border-t border-[#E2E8F0] pt-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm text-[#1E293B] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-accent" />
                  Lettre générée
                </p>
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(generated); toast.success('Copié !'); }}>
                  <Copy size={12} />Copier
                </Button>
              </div>
              <textarea
                value={generated}
                onChange={(e) => setGenerated(e.target.value)}
                rows={10}
                className="w-full p-3 border border-[#E2E8F0] rounded-btn text-sm text-[#1E293B] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 resize-y leading-relaxed"
              />
              <div className="flex gap-2 mt-3">
                <Button
                  className="flex-1"
                  onClick={() => {
                    const vals = (document.querySelector('form') as HTMLFormElement);
                    handleSubmit((data) => saveMutation.mutate({ ...data, content: generated }))();
                  }}
                  loading={saveMutation.isPending}
                >
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Fermer
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </motion.div>
  );
}
