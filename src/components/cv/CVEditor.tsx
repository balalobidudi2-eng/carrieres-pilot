'use client';

import { useState, useRef } from 'react';
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
  Upload,
  ImageOff,
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
  const [photo, setPhoto] = useState<string | undefined>((cv.content as any)?.personal?.photo ?? undefined);
  const [photoPosition, setPhotoPosition] = useState<'top-left' | 'top-right' | 'top-center'>((cv.content as any)?.personal?.photoPosition ?? 'top-left');
  const [photoShape, setPhotoShape] = useState<'circle' | 'square' | 'rounded'>((cv.content as any)?.personal?.photoShape ?? 'circle');
  const [photoSize, setPhotoSize] = useState<'small' | 'medium' | 'large'>((cv.content as any)?.personal?.photoSize ?? 'medium');
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const photoInputRef = useRef<HTMLInputElement>(null);

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
      const values = getValues();
      const withPhoto = { ...values, personal: { ...(values.personal ?? {}), photo, photoPosition, photoShape, photoSize } };
      const res = await api.post(`/cv/${cv.id}/generate-pdf`, { content: withPhoto }, { responseType: 'text' });
      return res.data;
    },
    onSuccess: (html: string) => {
      const w = window.open('', '_blank');
      if (!w) { toast.error('Popup bloqué — autorisez les popups pour ce site puis réessayez'); return; }
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 500);
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.error ?? 'Erreur export PDF';
      toast.error(msg);
    },
  });

  const handleSave = () => {
    setAutoSaveStatus('saving');
    const values = getValues();
    // Inject photo + options into personal section before saving
    const withPhoto = { ...values, personal: { ...(values.personal ?? {}), photo, photoPosition, photoShape, photoSize } };
    saveMutation.mutate(withPhoto as CVContent);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Fichier non supporté — utilisez PNG, JPG ou WebP'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image trop grande — maximum 2 Mo'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-[1200px]">
      {/* Mobile tabs */}
      <div className="flex xl:hidden border-b border-[#E2E8F0] mb-4 bg-white sticky top-0 z-10">
        <button
          onClick={() => setMobileView('edit')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${mobileView === 'edit' ? 'border-violet-500 text-violet-600' : 'border-transparent text-[#64748B]'}`}
        >
          ✏️ Éditer
        </button>
        <button
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${mobileView === 'preview' ? 'border-violet-500 text-violet-600' : 'border-transparent text-[#64748B]'}`}
        >
          👁 Aperçu
        </button>
      </div>

      {/* Content row */}
      <div className="flex flex-1 gap-6 min-h-0">
      {/* Left panel — form */}
      <div className={`${mobileView === 'edit' ? 'flex-1 flex flex-col min-w-0' : 'hidden'} xl:flex xl:flex-1 xl:flex-col xl:min-w-0`}>
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
            {/* Photo upload */}
            <div className="mb-5 flex items-start gap-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#F1F5F9] border-2 border-dashed border-[#CBD5E1] flex items-center justify-center shrink-0">
                {photo ? (
                  <img src={photo} alt="Photo de profil" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-[#CBD5E1]" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1E293B] mb-1">Photo de profil <span className="text-xs font-normal text-[#94A3B8]">(optionnel)</span></p>
                <p className="text-xs text-[#64748B] mb-2">PNG, JPG ou WebP — max 2 Mo. Visible dans l&apos;aperçu et le PDF généré.</p>
                <div className="flex gap-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[#CBD5E1] rounded-btn text-[#475569] hover:border-accent hover:text-accent transition-colors bg-white"
                  >
                    <Upload size={12} />
                    {photo ? 'Changer la photo' : 'Importer une photo'}
                  </button>
                  {photo && (
                    <button
                      type="button"
                      onClick={() => setPhoto(undefined)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-red-200 rounded-btn text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <ImageOff size={12} />
                      Supprimer
                    </button>
                  )}
                </div>

                {/* Photo options — visible uniquement si photo uploadée */}
                {photo && (
                  <div className="mt-4 space-y-3 p-3 bg-[#F7F8FC] rounded-xl border border-[#E2E8F0]">
                    <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-wide">Options de la photo</p>

                    {/* Position */}
                    <div>
                      <p className="text-[10px] text-[#94A3B8] mb-1.5">Position</p>
                      <div className="flex gap-1.5">
                        {([['top-left', 'Gauche'], ['top-center', 'Centre'], ['top-right', 'Droite']] as const).map(([val, lbl]) => (
                          <button key={val} type="button" onClick={() => setPhotoPosition(val)}
                            className={`flex-1 py-1.5 text-[10px] rounded-lg border transition-colors ${
                              photoPosition === val ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                            }`}>{lbl}</button>
                        ))}
                      </div>
                    </div>

                    {/* Forme */}
                    <div>
                      <p className="text-[10px] text-[#94A3B8] mb-1.5">Forme</p>
                      <div className="flex gap-1.5">
                        {([['circle', '● Rond'], ['rounded', '▣ Arrondi'], ['square', '■ Carré']] as const).map(([val, lbl]) => (
                          <button key={val} type="button" onClick={() => setPhotoShape(val)}
                            className={`flex-1 py-1.5 text-[10px] rounded-lg border transition-colors ${
                              photoShape === val ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                            }`}>{lbl}</button>
                        ))}
                      </div>
                    </div>

                    {/* Taille */}
                    <div>
                      <p className="text-[10px] text-[#94A3B8] mb-1.5">Taille</p>
                      <div className="flex gap-1.5">
                        {([['small', 'Petit'], ['medium', 'Moyen'], ['large', 'Grand']] as const).map(([val, lbl]) => (
                          <button key={val} type="button" onClick={() => setPhotoSize(val)}
                            className={`flex-1 py-1.5 text-[10px] rounded-lg border transition-colors ${
                              photoSize === val ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                            }`}>{lbl}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
      <div className={`${mobileView === 'preview' ? 'flex w-full flex-col' : 'hidden'} xl:flex xl:w-[420px] xl:shrink-0 xl:flex-col`}>
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
          <CVPreview content={{ ...watch(), personal: { ...(watch('personal') ?? {}), photo, photoPosition, photoShape, photoSize } }} />
        </div>
      </div>
      </div>

      {mobileView === 'edit' && (
        <button
          onClick={() => setMobileView('preview')}
          className="fixed bottom-6 right-4 z-50 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-3 rounded-full shadow-lg text-sm font-medium xl:hidden transition-all active:scale-95"
        >
          👁 Voir le CV
        </button>
      )}
      {mobileView === 'preview' && (
        <button
          onClick={() => setMobileView('edit')}
          className="fixed bottom-6 left-4 z-50 flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-full shadow-lg text-sm font-medium xl:hidden transition-all active:scale-95"
        >
          ← Éditer
        </button>
      )}
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
  const photo = p?.photo;
  const photoPosition = (p as any)?.photoPosition ?? 'top-left';
  const photoShape = (p as any)?.photoShape ?? 'circle';
  const photoSize = (p as any)?.photoSize ?? 'medium';

  const sizeClass = ({ small: 'w-10 h-10', medium: 'w-14 h-14', large: 'w-20 h-20' } as Record<string, string>)[photoSize] ?? 'w-14 h-14';
  const radiusClass = ({ circle: 'rounded-full', rounded: 'rounded-lg', square: 'rounded-none' } as Record<string, string>)[photoShape] ?? 'rounded-full';
  const headerClass = photoPosition === 'top-center'
    ? 'flex flex-col items-center text-center gap-2'
    : photoPosition === 'top-right'
    ? 'flex flex-row-reverse items-start gap-3'
    : 'flex items-start gap-3';

  return (
    <div className="text-[11px] text-[#1E293B] space-y-4">
      {/* Header */}
      <div className={`border-b-2 border-accent pb-3 ${headerClass}`}>
        {photo && (
          <img src={photo} alt="Photo" className={`${sizeClass} ${radiusClass} object-cover shrink-0`} />
        )}
        <div className={photoPosition === 'top-center' ? '' : 'flex-1'}>
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
