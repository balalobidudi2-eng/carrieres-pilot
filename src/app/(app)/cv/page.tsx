'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Download,
  Sparkles,
  Star,
  Trash2,
  Eye,
  MoreHorizontal,
  FileText,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { CVEditor } from '@/components/cv/CVEditor';
import { api } from '@/lib/axios';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import type { CV } from '@/types';

export default function CVPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importName, setImportName] = useState('');
  const [importText, setImportText] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'ai' | 'original'>('ai');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);
  const [newCVName, setNewCVName] = useState('');

  const { data: cvList, isLoading } = useQuery<CV[]>({
    queryKey: ['cvs'],
    queryFn: () => api.get('/cv').then((r) => r.data),
    staleTime: 2 * 60 * 1000, // évite la disparition du CV lors de la navigation
  });

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      api.post('/cv', { name, template: 'modern', content: defaultContent }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['cvs'] });
      setCreateOpen(false);
      setSelectedCV(res.data);
      toast.success('CV créé avec succès !');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? (err instanceof Error ? err.message : null)
        ?? 'Erreur lors de la création';
      toast.error(msg);
    },
  });

  const importMutation = useMutation({
    mutationFn: (data: { name: string; text: string; file?: File | null; mode: 'ai' | 'original' }) => {
      if (data.file) {
        const form = new FormData();
        form.append('file', data.file);
        form.append('name', data.name);
        form.append('mode', data.mode);
        return api.post('/cv/import', form).then((r) => r.data);
      }
      return api.post('/cv/import', { name: data.name, text: data.text, mode: data.mode }).then((r) => r.data);
    },
    onSuccess: (cv: CV, variables) => {
      // Update cache directly — survives DB offline + fake IDs
      qc.setQueryData<CV[]>(['cvs'], (old = []) => [cv, ...(old ?? [])]);
      setImportOpen(false);
      setImportText('');
      setImportName('');
      setImportFile(null);
      setImportMode('ai');
      // Only open CVEditor for AI mode (original mode just adds to list)
      if (variables.mode === 'ai') setSelectedCV(cv);
      toast.success(variables.mode === 'ai' ? 'CV importé et structuré par IA !' : 'CV importé et sauvegardé !');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? (err instanceof Error ? err.message : null)
        ?? "Erreur lors de l'import";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cv/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cvs'] });
      toast.success('CV supprimé');
      if (selectedCV) setSelectedCV(null);
    },
  });

  const handleDownloadPDF = (cv: CV) => {
    // If CV was imported with an original file, we'd download it directly.
    // For AI-generated CVs, open the editor and auto-trigger print dialog.
    setSelectedCV(cv);
    setTimeout(() => {
      window.print();
    }, 800);
  };

  if (selectedCV) {
    return (
      <CVEditor
        cv={selectedCV}
        onClose={() => setSelectedCV(null)}
        onSave={(updated) => {
          setSelectedCV(updated);
          // For fake IDs (offline / import fallback), update cache in-place instead of
          // doing a fresh DB fetch that would drop the unsaved CV from the list.
          if (/^cv(-import)?-\d+$/.test(updated.id)) {
            qc.setQueryData<CV[]>(['cvs'], (old = []) => {
              const exists = old?.some(c => c.id === updated.id);
              if (exists) return old?.map(c => c.id === updated.id ? updated : c) ?? [updated];
              return [updated, ...(old ?? [])];
            });
          } else {
            qc.invalidateQueries({ queryKey: ['cvs'] });
          }
        }}
      />
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-6 max-w-[1200px]"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#1E293B]">Mes CV</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Créez et gérez vos CV professionnels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Upload size={16} />
            Importer
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Nouveau CV
          </Button>
        </div>
      </motion.div>

      {/* CV Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-card" />
          ))}
        </div>
      ) : (cvList?.length ?? 0) === 0 ? (
        <motion.div
          variants={fadeInUp}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
            <FileText size={28} className="text-accent" />
          </div>
          <h3 className="font-heading font-semibold text-[#1E293B] text-lg mb-2">
            Aucun CV pour l&apos;instant
          </h3>
          <p className="text-[#64748B] text-sm mb-6 max-w-xs">
            Créez votre premier CV professionnel optimisé par l&apos;IA en 5 minutes.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Sparkles size={16} />
            Créer avec l&apos;IA
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {(cvList ?? []).map((cv) => (
            <motion.div
              key={cv.id}
              variants={fadeInUp}
              whileHover={{ y: -4, boxShadow: '0 8px 40px rgba(124,58,237,0.15)' }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden group cursor-pointer"
              style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
            >
              {/* Preview area */}
              <div
                className="h-44 bg-gradient-to-br from-[#F7F8FC] to-[#EDE9FE] flex items-center justify-center relative"
                onClick={() => setSelectedCV(cv)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedCV(cv)}
                aria-label={`Ouvrir le CV ${cv.name}`}
              >
                <div className="w-28 h-36 bg-white rounded-lg shadow-lg border border-[#E2E8F0] flex items-center justify-center">
                  <FileText size={36} className="text-accent/40" />
                </div>
                {cv.atsScore !== undefined && cv.atsScore !== null && (
                  <div className="absolute top-3 right-3 bg-white rounded-full px-2.5 py-1 text-xs font-bold text-emerald-600 shadow-sm border border-[#E2E8F0]">
                    ATS {cv.atsScore}/100
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                  <Button
                    variant="primary"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); setSelectedCV(cv); }}
                  >
                    <Eye size={14} />
                    Éditer
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-sm text-[#1E293B]">{cv.name}</p>
                    {cv.isDefault && <Star size={13} className="text-amber-400 fill-current" />}
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    Modifié {new Date(cv.updatedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownloadPDF(cv)}
                    className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F7F8FC] hover:text-accent transition-colors"
                    title="Télécharger PDF"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Supprimer ce CV ?')) deleteMutation.mutate(cv.id);
                    }}
                    className="p-1.5 rounded-lg text-[#64748B] hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nouveau CV">
        <div className="space-y-5">
          <Input
            label="Nom du CV"
            placeholder="Ex: CV Product Designer 2025"
            value={newCVName}
            onChange={(e) => setNewCVName(e.target.value)}
            required
          />
          <div className="flex gap-3">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => createMutation.mutate(newCVName)}
              loading={createMutation.isPending}
              disabled={!newCVName.trim()}
            >
              <FileText size={15} />
              Créer depuis zéro
            </Button>
            <Button
              fullWidth
              onClick={() => {
                if (!newCVName.trim()) return;
                setCreateOpen(false);
                setImportName(newCVName);
                setImportOpen(true);
              }}
            >
              <Sparkles size={15} />
              Importer &amp; enrichir IA
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import modal */}
      <Modal open={importOpen} onClose={() => { setImportOpen(false); setImportFile(null); setImportText(''); setImportMode('ai'); }} title="Importer mon CV">
        <div className="space-y-4">
          <p className="text-sm text-[#64748B]">
            Sélectionnez un fichier <strong>.pdf</strong>, <strong>.docx</strong> ou <strong>.txt</strong>,
            ou collez le texte ci-dessous.
          </p>

          {/* Mode toggle */}
          <div className="flex gap-2 p-1 bg-[#F7F8FC] rounded-xl">
            <button
              type="button"
              onClick={() => setImportMode('ai')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                importMode === 'ai' ? 'bg-white text-accent shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              <Sparkles size={13} />
              Analyser avec l&apos;IA
            </button>
            <button
              type="button"
              onClick={() => setImportMode('original')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                importMode === 'original' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              <FileText size={13} />
              Garder l&apos;original
            </button>
          </div>
          {importMode === 'ai' ? (
            <p className="text-xs text-[#64748B] -mt-1">🤖 L’IA parse votre fichier et extrait toutes les sections automatiquement.</p>
          ) : (
            <p className="text-xs text-[#64748B] -mt-1">📄 Le texte brut est sauvegardé tel quel, sans traitement — aucun crédit IA consommé.</p>
          )}

          {/* File picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setImportFile(f);
              if (f && !importName) setImportName(f.name.replace(/\.[^/.]+$/, ''));
              if (f?.name.endsWith('.txt')) {
                const reader = new FileReader();
                reader.onload = (ev) => setImportText((ev.target?.result as string) ?? '');
                reader.readAsText(f, 'UTF-8');
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
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

          <Input
            label="Nom du CV"
            placeholder="Ex: CV import\u00e9 2025"
            value={importName}
            onChange={(e) => setImportName(e.target.value)}
            required
          />

          {/* Paste fallback */}
          {!importFile && (
            <Textarea
              label="Ou collez le texte de votre CV"
              placeholder="Collez ici le texte de votre CV (exp\u00e9riences, formation, comp\u00e9tences...)"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
            />
          )}

          <Button
            fullWidth
            onClick={() => importMutation.mutate({ name: importName || 'CV importé', text: importText, file: importFile, mode: importMode })}
            loading={importMutation.isPending}
            disabled={!importFile && !importText.trim()}
          >
            {importMode === 'ai' ? <Sparkles size={15} /> : <FileText size={15} />}
            {importMutation.isPending
              ? (importMode === 'ai' ? 'Analyse en cours...' : 'Import en cours...')
              : (importMode === 'ai' ? 'Analyser et importer' : 'Importer le CV')}
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}

const defaultContent = {
  personal: {},
  summary: '',
  experiences: [],
  education: [],
  skills: [],
  languages: [],
};
