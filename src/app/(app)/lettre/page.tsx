'use client';

import { useState, useRef } from 'react';
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
  Upload,
  CheckCircle,
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
  company: z.string().optional(),
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
  const [importOpen, setImportOpen] = useState(false);
  const [importJobTitle, setImportJobTitle] = useState('');
  const [importCompany, setImportCompany] = useState('');
  const [importContent, setImportContent] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const letterFileRef = useRef<HTMLInputElement>(null);
  const [generated, setGenerated] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const { data: letters = [], refetch } = useQuery<CoverLetter[]>({
    queryKey: ['letters'],
    queryFn: () => api.get('/letters').then((r) => r.data),
    placeholderData: [],
  });

  const { data: profile } = useQuery<{ firstName?: string; lastName?: string; currentTitle?: string; skills?: string[] }>({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
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
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? (err instanceof Error ? err.message : null)
        ?? 'Erreur lors de la génération';
      toast.error(msg);
    },
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
  const importMutation = useMutation({
    mutationFn: (data: { jobTitle: string; company: string; content: string; file?: File | null }) => {
      if (data.file) {
        const form = new FormData();
        form.append('file', data.file);
        form.append('jobTitle', encodeURIComponent(data.jobTitle));
        form.append('company', encodeURIComponent(data.company));
        return api.post('/letters/import', form);
      }
      return api.post('/letters/import', { jobTitle: data.jobTitle, company: data.company, content: data.content });
    },
    onSuccess: () => {
      refetch();
      setImportOpen(false);
      setImportJobTitle('');
      setImportCompany('');
      setImportContent('');
      setImportFile(null);
      toast.success('Lettre import\u00e9e !');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? (err instanceof Error ? err.message : null)
        ?? 'Erreur lors de l\'import';
      toast.error(msg);
    },
  });
  const onGenerate = handleSubmit((data) => generateMutation.mutate(data));

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6 max-w-[900px]">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#1E293B]">Lettres de motivation</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Générées par IA, personnalisées pour chaque offre</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Upload size={16} />
            Importer
          </Button>
          <Button onClick={() => { reset(); setGenerated(null); setModalOpen(true); }}>
            <Plus size={16} />
            Nouvelle lettre
          </Button>
        </div>
      </motion.div>

      {/* Letters list */}
      <div className="space-y-3">
        {letters.length === 0 ? (
          <motion.div variants={fadeInUp} className="bg-white rounded-card border border-[#E2E8F0] p-12 text-center" style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}>
            <FileText size={40} className="mx-auto text-[#CBD5E1] mb-3" />
            <p className="font-heading font-semibold text-[#1E293B]">Aucune lettre pour le moment</p>
            <p className="text-sm text-[#64748B] mt-1">Cliquez sur « Nouvelle lettre » pour en générer une avec l&apos;IA.</p>
          </motion.div>
        ) : letters.map((l) => (
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
                  <p className="text-xs text-[#64748B]">{l.companyName}</p>
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
              <p className={`text-sm text-[#64748B] mt-2 leading-relaxed whitespace-pre-line ${viewId === l.id ? 'max-h-[50vh] overflow-y-auto' : 'line-clamp-3'}`}>{l.content}</p>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={() => setViewId(viewId === l.id ? null : l.id)}>
                  <ChevronDown size={12} className={`transition-transform ${viewId === l.id ? 'rotate-180' : ''}`} />{viewId === l.id ? 'Réduire' : 'Voir'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(l.content); toast.success('Copié !'); }}>
                  <Copy size={12} />Copier
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${esc(l.jobTitle || '')} — ${esc(l.companyName || '')}</title><style>body{font-family:'Segoe UI',Arial,sans-serif;max-width:700px;margin:60px auto;padding:40px;line-height:1.7;color:#1E293B}h1{font-size:18px;margin-bottom:4px}.meta{color:#64748B;font-size:14px;margin-bottom:32px}.content{white-space:pre-wrap;font-size:15px}@media print{body{margin:0}}</style></head><body><h1>${esc(l.jobTitle || '')}</h1><div class="meta">${esc(l.companyName || '')} · ${new Date(l.createdAt).toLocaleDateString('fr-FR')}</div><div class="content">${esc(l.content || '')}</div></body></html>`;
                  const w = window.open('', '_blank');
                  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
                }}>
                  <Download size={12} />Télécharger PDF
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Générer une lettre de motivation" size="lg">
        {profile?.firstName && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <CheckCircle size={12} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-green-800">
              {profile.firstName} {profile.lastName}
            </span>
            {profile.skills?.length ? (
              <span className="text-xs text-green-600 truncate">
                · {profile.skills.slice(0, 2).join(', ')}{profile.skills.length > 2 ? '…' : ''}
              </span>
            ) : null}
            <span className="ml-auto text-[10px] text-green-500 font-medium uppercase tracking-wide whitespace-nowrap">Profil auto-injecté</span>
          </div>
        )}
        <form onSubmit={onGenerate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Poste visé" {...register('jobTitle')} error={errors.jobTitle?.message} placeholder="ex: Lead UX Designer" />
            <Input label="Entreprise (optionnel)" {...register('company')} error={errors.company?.message} placeholder="ex: Stripe" />
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
                className="w-full p-4 border border-[#E2E8F0] rounded-btn text-sm text-[#1E293B] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 resize-y leading-[1.85] font-serif"
                style={{ minHeight: '520px' }}
              />
              <div className="flex gap-2 mt-3">
                <Button
                  className="flex-1"
                  onClick={() => handleSubmit((data) => saveMutation.mutate({ ...data, content: generated! }))()}
                  loading={saveMutation.isPending}
                >
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => {
                  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Lettre de motivation</title><style>body{font-family:'Segoe UI',Arial,sans-serif;max-width:700px;margin:60px auto;padding:40px;line-height:1.7;color:#1E293B}.content{white-space:pre-wrap;font-size:15px}@media print{body{margin:0}}</style></head><body><div class="content">${esc(generated!)}</div></body></html>`;
                  const w = window.open('', '_blank');
                  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
                }}>
                  <Download size={14} />Télécharger PDF
                </Button>
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Fermer
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>

      {/* Import Modal */}
      <Modal open={importOpen} onClose={() => { setImportOpen(false); setImportFile(null); setImportContent(''); }} title="Importer une lettre de motivation">
        <div className="space-y-4 mt-2">
          <p className="text-sm text-[#64748B]">
            Sélectionnez un fichier <strong>.pdf</strong>, <strong>.docx</strong> ou <strong>.txt</strong>,
            ou collez le texte de votre lettre ci-dessous.
          </p>

          {/* File picker */}
          <input
            ref={letterFileRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setImportFile(f);
              if (f?.name.endsWith('.txt')) {
                const reader = new FileReader();
                reader.onload = (ev) => setImportContent((ev.target?.result as string) ?? '');
                reader.readAsText(f, 'UTF-8');
              }
            }}
          />
          <button
            type="button"
            onClick={() => letterFileRef.current?.click()}
            className="w-full border-2 border-dashed border-[#E2E8F0] hover:border-accent rounded-btn p-5 text-center transition-colors cursor-pointer group"
          >
            {importFile ? (
              <div className="flex items-center justify-center gap-2 text-accent font-medium text-sm">
                <FileText size={18} />
                <span>{importFile.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#94A3B8] group-hover:text-accent transition-colors">
                <Upload size={24} />
                <span className="text-sm font-medium">Cliquez pour choisir un fichier</span>
                <span className="text-xs">.pdf, .docx, .txt</span>
              </div>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Poste visé"
              placeholder="ex: Lead UX Designer"
              value={importJobTitle}
              onChange={(e) => setImportJobTitle(e.target.value)}
            />
            <Input
              label="Entreprise"
              placeholder="ex: Stripe"
              value={importCompany}
              onChange={(e) => setImportCompany(e.target.value)}
            />
          </div>

          {/* Paste fallback */}
          {!importFile && (
            <Textarea
              label="Ou collez le texte de la lettre"
              placeholder="Collez ici le texte de votre lettre de motivation..."
              value={importContent}
              onChange={(e) => setImportContent(e.target.value)}
              rows={8}
            />
          )}

          <Button
            fullWidth
            onClick={() => importMutation.mutate({ jobTitle: importJobTitle, company: importCompany, content: importContent, file: importFile })}
            loading={importMutation.isPending}
            disabled={!importFile && !importContent.trim()}
          >
            <Upload size={15} />
            {importMutation.isPending ? 'Import en cours...' : 'Importer la lettre'}
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
