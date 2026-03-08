'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { CVEditor } from '@/components/cv/CVEditor';
import { api } from '@/lib/axios';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import type { CV } from '@/types';

export default function CVPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);
  const [newCVName, setNewCVName] = useState('');

  const { data: cvList, isLoading } = useQuery<CV[]>({
    queryKey: ['cvs'],
    queryFn: () => api.get('/cv').then((r) => r.data),
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
    onError: () => toast.error('Erreur lors de la création'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cv/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cvs'] });
      toast.success('CV supprimé');
      if (selectedCV) setSelectedCV(null);
    },
  });

  const generatePDFMutation = useMutation({
    mutationFn: (id: string) => api.post(`/cv/${id}/generate-pdf`),
    onSuccess: (res) => {
      window.open(res.data.pdfUrl, '_blank');
      toast.success('PDF généré !');
    },
    onError: () => toast.error('Erreur génération PDF'),
  });

  if (selectedCV) {
    return (
      <CVEditor
        cv={selectedCV}
        onClose={() => setSelectedCV(null)}
        onSave={(updated) => {
          setSelectedCV(updated);
          qc.invalidateQueries({ queryKey: ['cvs'] });
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
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Nouveau CV
        </Button>
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
                    onClick={() => generatePDFMutation.mutate(cv.id)}
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
            >
              <FileText size={15} />
              Créer depuis zéro
            </Button>
            <Button
              fullWidth
              onClick={() => createMutation.mutate(newCVName)}
              loading={createMutation.isPending}
            >
              <Sparkles size={15} />
              Générer avec l&apos;IA
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

const defaultContent = {
  summary: '',
  experiences: [],
  education: [],
  skills: [],
  languages: [],
};
