'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import {
  Plus,
  MoreHorizontal,
  Building2,
  Calendar,
  MapPin,
  GripVertical,
  Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { api } from '@/lib/axios';
import type { Application, ApplicationStatus } from '@/types';

const COLUMNS: { id: ApplicationStatus; label: string; color: string }[] = [
  { id: 'TO_SEND', label: 'À envoyer', color: '#94A3B8' },
  { id: 'SENT', label: 'Envoyée', color: '#3B82F6' },
  { id: 'VIEWED', label: 'Vue', color: '#F59E0B' },
  { id: 'INTERVIEW_SCHEDULED', label: 'Entretien planifié', color: '#8B5CF6' },
  { id: 'INTERVIEW_DONE', label: 'Entretien fait', color: '#06B6D4' },
  { id: 'OFFER_RECEIVED', label: 'Offre reçue', color: '#10B981' },
  { id: 'REJECTED', label: 'Refusée', color: '#EF4444' },
];

export default function CandidaturesPage() {
  const qc = useQueryClient();
  const [activeApp, setActiveApp] = useState<Application | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addStatus, setAddStatus] = useState<ApplicationStatus>('TO_SEND');
  const [newApp, setNewApp] = useState({ company: '', jobTitle: '', notes: '' });
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailApp, setEmailApp] = useState<Application | null>(null);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' });

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => api.get('/applications').then((r) => r.data),
    placeholderData: [],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      api.patch(`/applications/${id}`, { status }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['applications'] });
      const previous = qc.getQueryData<Application[]>(['applications']);
      qc.setQueryData<Application[]>(['applications'], (old = []) =>
        old.map((a) => (a.id === id ? { ...a, status } : a)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(['applications'], ctx?.previous);
      toast.error('Erreur lors de la mise à jour');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newApp & { status: ApplicationStatus }) =>
      api.post('/applications', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      setAddOpen(false);
      setNewApp({ company: '', jobTitle: '', notes: '' });
      toast.success('Candidature ajoutée !');
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.error ?? 'Erreur lors de la création';
      toast.error(msg);
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data: { to: string; subject: string; body: string; applicationId: string }) =>
      api.post('/applications/send-email', {
        to: data.to,
        fromName: 'Candidat',
        fromEmail: '',
        subject: data.subject,
        body: data.body,
      }).then(() => api.patch(`/applications/${data.applicationId}`, { status: 'SENT' })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      setEmailOpen(false);
      setEmailApp(null);
      setEmailForm({ to: '', subject: '', body: '' });
      toast.success('Email envoyé et candidature mise à jour !');
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.error ?? 'Erreur lors de l\'envoi (vérifiez la config SMTP)';
      toast.error(msg);
    },
  });

  const openEmailModal = (app: Application) => {
    setEmailApp(app);
    setEmailForm({
      to: app.contactEmail ?? '',
      subject: `Candidature : ${app.jobTitle} — ${app.company}`,
      body: `Bonjour,\n\nJe me permets de vous adresser ma candidature pour le poste de ${app.jobTitle} au sein de ${app.company}.\n\nVous trouverez ci-joint mon CV.\n\nCordialement`,
    });
    setEmailOpen(true);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event: DragStartEvent) => {
    const app = applications.find((a) => a.id === event.active.id);
    setActiveApp(app ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveApp(null);
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    const col = COLUMNS.find((c) => c.id === overId);
    if (col && col.id !== (applications.find((a) => a.id === active.id)?.status)) {
      updateStatusMutation.mutate({ id: String(active.id), status: col.id });
    }
  };

  const byStatus = (status: ApplicationStatus) => applications.filter((a) => a.status === status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#1E293B]">Mes candidatures</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            {applications.length} candidature{applications.length !== 1 ? 's' : ''} en cours
          </p>
        </div>
        <Button onClick={() => { setAddOpen(true); setAddStatus('TO_SEND'); }}>
          <Plus size={16} />
          Nouvelle candidature
        </Button>
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              applications={byStatus(col.id)}
              onAddClick={() => { setAddStatus(col.id); setAddOpen(true); }}
              onEmailClick={openEmailModal}
            />
          ))}
        </div>

        <DragOverlay>
          {activeApp && <ApplicationCard app={activeApp} isDragging />}
        </DragOverlay>
      </DndContext>

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nouvelle candidature">
        <div className="space-y-4">
          <Input
            label="Entreprise"
            placeholder="Doctolib"
            value={newApp.company}
            onChange={(e) => setNewApp((p) => ({ ...p, company: e.target.value }))}
            required
          />
          <Input
            label="Poste"
            placeholder="Product Designer"
            value={newApp.jobTitle}
            onChange={(e) => setNewApp((p) => ({ ...p, jobTitle: e.target.value }))}
            required
          />
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Statut</label>
            <select
              value={addStatus}
              onChange={(e) => setAddStatus(e.target.value as ApplicationStatus)}
              className="w-full border border-[#E2E8F0] rounded-btn px-4 py-3 text-sm text-[#1E293B] focus:outline-none focus:border-accent"
            >
              {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <Textarea
            label="Notes"
            placeholder="Notes, contacts, prochaines étapes…"
            value={newApp.notes}
            onChange={(e) => setNewApp((p) => ({ ...p, notes: e.target.value }))}
            rows={3}
          />
          <Button
            fullWidth
            loading={createMutation.isPending}
            onClick={() => createMutation.mutate({ ...newApp, status: addStatus })}
          >
            Ajouter la candidature
          </Button>
        </div>
      </Modal>

      {/* Email modal */}
      <Modal open={emailOpen} onClose={() => setEmailOpen(false)} title="Envoyer par email">
        <div className="space-y-4">
          <Input
            label="Destinataire"
            type="email"
            placeholder="recruteur@entreprise.com"
            value={emailForm.to}
            onChange={(e) => setEmailForm((p) => ({ ...p, to: e.target.value }))}
            required
          />
          <Input
            label="Objet"
            value={emailForm.subject}
            onChange={(e) => setEmailForm((p) => ({ ...p, subject: e.target.value }))}
            required
          />
          <Textarea
            label="Corps du message"
            value={emailForm.body}
            onChange={(e) => setEmailForm((p) => ({ ...p, body: e.target.value }))}
            rows={6}
          />
          <Button
            fullWidth
            loading={sendEmailMutation.isPending}
            onClick={() => {
              if (!emailApp || !emailForm.to) return;
              sendEmailMutation.mutate({ ...emailForm, applicationId: emailApp.id });
            }}
            disabled={!emailForm.to || !emailForm.subject || !emailForm.body}
          >
            <Mail size={15} />
            Envoyer la candidature
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function KanbanColumn({
  column,
  applications,
  onAddClick,
  onEmailClick,
}: {
  column: { id: ApplicationStatus; label: string; color: string };
  applications: Application[];
  onAddClick: () => void;
  onEmailClick: (app: Application) => void;
}) {
  return (
    <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy} id={column.id}>
      <div
        className="kanban-column"
        id={column.id}
        data-droppable="true"
        style={{ minHeight: 200 }}
      >
        {/* Column header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: column.color }} />
            <span className="text-xs font-semibold text-[#475569]">{column.label}</span>
            <span className="bg-white border border-[#E2E8F0] text-[#64748B] text-xs font-bold px-1.5 rounded-full">
              {applications.length}
            </span>
          </div>
          <button
            onClick={onAddClick}
            className="p-1 rounded text-[#94A3B8] hover:text-accent hover:bg-white transition-colors"
            aria-label={`Ajouter dans ${column.label}`}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Cards */}
        <div className="space-y-2 min-h-[40px]">
          {applications.map((app) => (
            <ApplicationCard key={app.id} app={app} onEmailClick={onEmailClick} />
          ))}
        </div>
      </div>
    </SortableContext>
  );
}

function ApplicationCard({ app, isDragging = false, onEmailClick }: { app: Application; isDragging?: boolean; onEmailClick?: (app: Application) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border border-[#E2E8F0] p-3 cursor-grab active:cursor-grabbing ${
        isDragging ? 'shadow-xl ring-2 ring-accent/30 rotate-2' : 'hover:border-accent/40'
      } transition-colors`}
    >
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="text-[#CBD5E1] hover:text-[#94A3B8] shrink-0 cursor-grab"
          >
            <GripVertical size={13} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-xs text-[#1E293B] truncate">{app.company}</p>
            <p className="text-xs text-[#64748B] truncate">{app.jobTitle}</p>
          </div>
        </div>
        <button className="p-0.5 text-[#CBD5E1] hover:text-[#64748B] shrink-0">
          <MoreHorizontal size={13} />
        </button>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-[#94A3B8]">
        <Calendar size={10} />
        {new Date(app.appliedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
      </div>
      {app.notes && (
        <p className="mt-2 text-[10px] text-[#94A3B8] line-clamp-2 italic">{app.notes}</p>
      )}
      {app.status === 'TO_SEND' && onEmailClick && (
        <button
          onClick={(e) => { e.stopPropagation(); onEmailClick(app); }}
          className="mt-2 flex items-center gap-1 text-[10px] text-accent hover:text-accent/80 font-semibold transition-colors"
        >
          <Mail size={11} />
          Envoyer par email
        </button>
      )}
    </div>
  );
}
