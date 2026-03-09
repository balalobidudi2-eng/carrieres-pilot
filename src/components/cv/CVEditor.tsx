'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import {
  X,
  Plus,
  Sparkles,
  Download,
  Save,
  ChevronDown,
  ChevronUp,
  Trash2,
  User,
  Briefcase,
  GraduationCap,
  Code,
  Globe,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { api } from '@/lib/axios';
import type { CV, CVContent } from '@/types';

interface CVEditorProps {
  cv: CV;
  onClose: () => void;
  onSave: (updated: CV) => void;
}

const SECTIONS = [
  { id: 'personal', label: 'Informations personnelles', icon: User },
  { id: 'summary', label: 'Résumé professionnel', icon: Briefcase },
  { id: 'experiences', label: 'Expériences', icon: Briefcase },
  { id: 'education', label: 'Formation', icon: GraduationCap },
  { id: 'skills', label: 'Compétences', icon: Code },
  { id: 'languages', label: 'Langues', icon: Globe },
];

export function CVEditor({ cv, onClose, onSave }: CVEditorProps) {
  const [openSections, setOpenSections] = useState<string[]>(['personal', 'summary']);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const { register, watch, setValue, getValues, control } = useForm<CVContent>({
    defaultValues: cv.content,
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: 'experiences' });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: 'education' });
  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({ control, name: 'skills' });
  const { fields: langFields, append: appendLang, remove: removeLang } = useFieldArray({ control, name: 'languages' });

  const saveMutation = useMutation({
    mutationFn: (content: CVContent) => api.patch(`/cv/${cv.id}`, { content }),
    onSuccess: (res) => {
      onSave(res.data);
      setAutoSaveStatus('saved');
    },
    onError: () => {
      setAutoSaveStatus('unsaved');
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  const generateSummaryMutation = useMutation({
    mutationFn: () =>
      api.post('/cv/generate-ai', { type: 'summary', cvId: cv.id, content: getValues() })
        .then((res) => res.data),
    onSuccess: (res) => {
      setValue('summary', res.summary);
      toast.success('Résumé généré !');
    },
    onError: (err: Error) => toast.error((err as any)?.response?.data?.error ?? err.message ?? 'Erreur génération IA'),
  });

  const generatePDFMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/cv/${cv.id}/generate-pdf`, {}, { responseType: 'text' });
      return res.data;
    },
    onSuccess: (html: string) => {
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 500);
      }
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.error ?? 'Erreur export PDF';
      toast.error(msg);
    },
  });

  const handleSave = () => {
    setAutoSaveStatus('saving');
    saveMutation.mutate(getValues());
  };

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-80px)] max-w-[1200px]">
      {/* Left panel — form */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading text-xl font-bold text-[#1E293B]">{cv.name}</h2>
            <p className="text-xs text-[#94A3B8]">
              {autoSaveStatus === 'saved' ? '✓ Sauvegardé' : autoSaveStatus === 'saving' ? 'Sauvegarde…' : '• Non sauvegardé'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              <X size={14} />
              Fermer
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => generatePDFMutation.mutate()}
              loading={generatePDFMutation.isPending}
            >
              <Download size={14} />
              PDF
            </Button>
            <Button size="sm" onClick={handleSave} loading={saveMutation.isPending}>
              <Save size={14} />
              Sauvegarder
            </Button>
          </div>
        </div>

        {/* Sections accordion */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* Personal info */}
          <Section
            id="personal"
            label="Informations personnelles"
            icon={User}
            open={openSections.includes('personal')}
            onToggle={() => toggleSection('personal')}
          >
            <div className="grid grid-cols-2 gap-4">
              <Input label="Prénom" {...register('personal.firstName')} placeholder="Sophie" />
              <Input label="Nom" {...register('personal.lastName')} placeholder="Martin" />
              <Input label="Titre professionnel" {...register('personal.title')} placeholder="Product Designer" className="col-span-2" />
              <Input label="Email" type="email" {...register('personal.email')} placeholder="sophie@exemple.com" />
              <Input label="Téléphone" {...register('personal.phone')} placeholder="+33 6 00 00 00 00" />
              <Input label="Ville" {...register('personal.city')} placeholder="Paris, France" />
              <Input label="LinkedIn" {...register('personal.linkedin')} placeholder="linkedin.com/in/sophie-martin" />
            </div>
          </Section>

          {/* Summary */}
          <Section
            id="summary"
            label="Résumé professionnel"
            icon={Briefcase}
            open={openSections.includes('summary')}
            onToggle={() => toggleSection('summary')}
          >
            <Textarea
              label="Résumé"
              placeholder="Résumé professionnel percutant…"
              rows={4}
              {...register('summary')}
            />
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => generateSummaryMutation.mutate()}
              loading={generateSummaryMutation.isPending}
            >
              <Sparkles size={14} />
              Générer avec l&apos;IA
            </Button>
          </Section>

          {/* Experiences */}
          <Section
            id="experiences"
            label={`Expériences (${expFields.length})`}
            icon={Briefcase}
            open={openSections.includes('experiences')}
            onToggle={() => toggleSection('experiences')}
          >
            <div className="space-y-4">
              {expFields.map((field, i) => (
                <div key={field.id} className="border border-[#E2E8F0] rounded-xl p-4 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => removeExp(i)}
                    className="absolute top-3 right-3 p-1 text-[#94A3B8] hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Titre du poste" {...register(`experiences.${i}.title`)} placeholder="Product Designer" />
                    <Input label="Entreprise" {...register(`experiences.${i}.company`)} placeholder="Doctolib" />
                    <Input label="Ville" {...register(`experiences.${i}.location`)} placeholder="Paris" />
                    <div className="flex gap-2">
                      <Input label="Début" type="month" {...register(`experiences.${i}.startDate`)} />
                      <Input label="Fin" type="month" {...register(`experiences.${i}.endDate`)} />
                    </div>
                  </div>
                  <Textarea
                    label="Description"
                    {...register(`experiences.${i}.description.0`)}
                    placeholder="• Conception de la nouvelle expérience utilisateur…"
                    rows={3}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendExp({ id: crypto.randomUUID(), title: '', company: '', location: '', startDate: '', current: false, description: [] })
                }
              >
                <Plus size={14} /> Ajouter une expérience
              </Button>
            </div>
          </Section>

          {/* Education */}
          <Section
            id="education"
            label={`Formation (${eduFields.length})`}
            icon={GraduationCap}
            open={openSections.includes('education')}
            onToggle={() => toggleSection('education')}
          >
            <div className="space-y-4">
              {eduFields.map((field, i) => (
                <div key={field.id} className="border border-[#E2E8F0] rounded-xl p-4 space-y-3 relative">
                  <button type="button" onClick={() => removeEdu(i)} className="absolute top-3 right-3 p-1 text-[#94A3B8] hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Diplôme" {...register(`education.${i}.degree`)} placeholder="Master Design" />
                    <Input label="Établissement" {...register(`education.${i}.institution`)} placeholder="ESAD" />
                    <Input label="Début" type="month" {...register(`education.${i}.startDate`)} />
                    <Input label="Fin" type="month" {...register(`education.${i}.endDate`)} />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendEdu({ id: crypto.randomUUID(), degree: '', institution: '', location: '', startDate: '' })
                }
              >
                <Plus size={14} /> Ajouter une formation
              </Button>
            </div>
          </Section>

          {/* Skills */}
          <Section
            id="skills"
            label={`Compétences (${skillFields.length})`}
            icon={Code}
            open={openSections.includes('skills')}
            onToggle={() => toggleSection('skills')}
          >
            <div className="space-y-2">
              {skillFields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input {...register(`skills.${i}.name`)} placeholder="Figma" className="flex-1" />
                  <select
                    {...register(`skills.${i}.level`)}
                    className="border border-[#E2E8F0] rounded-btn px-3 py-3 text-sm text-[#1E293B] focus:outline-none focus:border-accent"
                  >
                    <option value="beginner">Débutant</option>
                    <option value="intermediate">Intermédiaire</option>
                    <option value="expert">Expert</option>
                  </select>
                  <button type="button" onClick={() => removeSkill(i)} className="p-2 text-[#94A3B8] hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendSkill({ id: crypto.randomUUID(), name: '', level: 'intermediate', category: 'technique' })}
              >
                <Plus size={14} /> Ajouter une compétence
              </Button>
            </div>
          </Section>

          {/* Languages */}
          <Section
            id="languages"
            label={`Langues (${langFields.length})`}
            icon={Globe}
            open={openSections.includes('languages')}
            onToggle={() => toggleSection('languages')}
          >
            <div className="space-y-2">
              {langFields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input {...register(`languages.${i}.language`)} placeholder="Anglais" className="flex-1" />
                  <select
                    {...register(`languages.${i}.level`)}
                    className="border border-[#E2E8F0] rounded-btn px-3 py-3 text-sm text-[#1E293B] focus:outline-none focus:border-accent"
                  >
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native'].map((l) => (
                      <option key={l} value={l}>{l === 'native' ? 'Natif' : l}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeLang(i)} className="p-2 text-[#94A3B8] hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendLang({ id: crypto.randomUUID(), language: '', level: 'B2' })}
              >
                <Plus size={14} /> Ajouter une langue
              </Button>
            </div>
          </Section>
        </div>
      </div>

      {/* Right panel — preview */}
      <div className="hidden xl:flex w-[420px] shrink-0 flex-col">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-sm text-[#1E293B]">Aperçu temps réel</p>
          {cv.atsScore !== undefined && (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold">
              <Award size={12} />
              Score ATS : {cv.atsScore}/100
            </div>
          )}
        </div>
        <div className="flex-1 bg-white rounded-card border border-[#E2E8F0] overflow-y-auto p-6" style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}>
          <CVPreview content={watch()} />
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  label,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#F7F8FC] transition-colors"
        aria-expanded={open}
      >
        <Icon size={16} className="text-accent shrink-0" />
        <span className="font-semibold text-sm text-[#1E293B] flex-1">{label}</span>
        {open ? <ChevronUp size={16} className="text-[#94A3B8]" /> : <ChevronDown size={16} className="text-[#94A3B8]" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function CVPreview({ content }: { content: CVContent }) {
  const p = content.personal;
  return (
    <div className="text-[11px] text-[#1E293B] space-y-4">
      {/* Header */}
      <div className="border-b-2 border-accent pb-3">
        <h1 className="text-xl font-bold font-heading">
          {[p?.firstName, p?.lastName].filter(Boolean).join(' ') || 'Prénom Nom'}
        </h1>
        <p className="text-accent font-semibold">{p?.title || 'Titre professionnel'}</p>
        {(p?.email || p?.phone || p?.city) && (
          <p className="text-[#64748B] text-[10px] mt-0.5">
            {[p?.email, p?.phone, p?.city].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {content.summary && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Résumé</h2>
          <p className="text-[10px] leading-relaxed text-[#475569]">{content.summary}</p>
        </div>
      )}

      {content.experiences?.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Expériences</h2>
          {content.experiences.map((exp, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between">
                <span className="font-semibold">{exp.title || 'Titre du poste'}</span>
                <span className="text-[#94A3B8]">{exp.startDate}</span>
              </div>
              <p className="text-accent text-[10px]">{exp.company || 'Entreprise'}</p>
            </div>
          ))}
        </div>
      )}

      {content.skills?.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Compétences</h2>
          <div className="flex flex-wrap gap-1">
            {content.skills.map((s, i) => (
              <span key={i} className="bg-accent/10 text-accent px-2 py-0.5 rounded-full text-[10px]">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
