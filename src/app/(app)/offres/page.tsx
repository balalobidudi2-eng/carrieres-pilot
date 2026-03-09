'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Building2,
  Clock,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Sparkles,
  Filter,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Send,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/axios';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import type { JobOffer } from '@/types';
import toast from 'react-hot-toast';

const CONTRACT_TYPES = ['Tous', 'CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'];
const SECTORS = ['Tous', 'Tech', 'Design', 'Marketing', 'Finance', 'Santé', 'Retail'];

export default function OffresPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [contract, setContract] = useState('Tous');
  const [sector, setSector] = useState('Tous');
  const [tab, setTab] = useState<'recommended' | 'all'>('recommended');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (offers: JobOffer[]) => {
    if (selectedIds.size === offers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(offers.map((o) => o.id)));
    }
  };

  const { data: offers = [], isLoading } = useQuery<JobOffer[]>({
    queryKey: ['offers', tab, query, contract, sector],
    queryFn: () =>
      api
        .get(tab === 'recommended' ? '/offers/recommended' : '/offers', {
          params: { q: query, contract: contract !== 'Tous' ? contract : undefined, sector: sector !== 'Tous' ? sector : undefined },
        })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      saved ? api.delete(`/offers/${id}/save`) : api.post(`/offers/${id}/save`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers'] }),
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.error ?? 'Erreur';
      toast.error(msg);
    },
  });

  const applyMutation = useMutation({
    mutationFn: (offer: JobOffer) =>
      api.post('/applications', {
        company: offer.company,
        jobTitle: offer.title,
        jobOfferId: offer.id,
        status: 'TO_SEND',
      }),
    onSuccess: () => toast.success('Candidature créée ! Retrouvez-la dans votre Kanban.'),
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.error ?? 'Erreur lors de la création';
      toast.error(msg);
    },
  });

  const batchApplyMutation = useMutation({
    mutationFn: (offersList: JobOffer[]) =>
      api.post('/applications/batch', {
        applications: offersList.map((o) => ({
          company: o.company,
          jobTitle: o.title,
          jobOfferId: o.id,
        })),
      }),
    onSuccess: (_, vars) => {
      toast.success(`${vars.length} candidature(s) créée(s) !`);
      setSelectedIds(new Set());
    },
    onError: (err: unknown) => {
      const msg = (err as any)?.response?.data?.error ?? 'Erreur lors de la création batch';
      toast.error(msg);
    },
  });

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-6 max-w-[1100px]"
    >
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <h2 className="font-heading text-2xl font-bold text-[#1E293B]">Offres d&apos;emploi</h2>
        <p className="text-sm text-[#64748B] mt-0.5">Offres matchées par IA selon votre profil</p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeInUp} className="flex gap-1 bg-[#F7F8FC] p-1 rounded-xl w-fit">
        {(['recommended', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? 'bg-white text-accent shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            {t === 'recommended' ? (
              <span className="flex items-center gap-1.5">
                <Sparkles size={13} />
                Recommandées IA
              </span>
            ) : (
              'Toutes les offres'
            )}
          </button>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titre, entreprise, compétence…"
            className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-btn text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 bg-white"
          />
        </div>

        {/* Contract filter */}
        <div className="flex gap-1.5 flex-wrap">
          {CONTRACT_TYPES.map((c) => (
            <button
              key={c}
              onClick={() => setContract(c)}
              className={`px-3 py-2 rounded-btn text-xs font-semibold transition-all ${
                contract === c ? 'bg-accent text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-accent/40'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Sector filter */}
        <div className="flex gap-1.5 flex-wrap">
          {SECTORS.map((s) => (
            <button
              key={s}
              onClick={() => setSector(s)}
              className={`px-3 py-2 rounded-btn text-xs font-semibold transition-all ${
                sector === s ? 'bg-primary text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:border-primary/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Select all + count */}
      {offers.length > 0 && (
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <button
            onClick={() => toggleSelectAll(offers)}
            className="flex items-center gap-2 text-sm font-medium text-[#64748B] hover:text-accent transition-colors"
          >
            {selectedIds.size === offers.length && offers.length > 0 ? (
              <CheckSquare size={18} className="text-accent" />
            ) : (
              <Square size={18} />
            )}
            {selectedIds.size > 0
              ? `${selectedIds.size} sélectionnée(s)`
              : 'Tout sélectionner'}
          </button>
        </motion.div>
      )}

      {/* Offers grid */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-card" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <motion.div variants={fadeInUp} className="bg-white rounded-card border border-[#E2E8F0] p-12 text-center" style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}>
          <Search size={40} className="mx-auto text-[#CBD5E1] mb-3" />
          <p className="font-heading font-semibold text-[#1E293B]">Aucune offre trouvée</p>
          <p className="text-sm text-[#64748B] mt-1">Modifiez vos critères de recherche ou complétez votre profil pour de meilleures recommandations.</p>
        </motion.div>
      ) : offers.map((offer) => (
        <motion.div
          key={offer.id}
          variants={fadeInUp}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className={`bg-white rounded-card border p-5 flex items-start gap-4 hover:border-accent/30 ${
            selectedIds.has(offer.id) ? 'border-accent/50 ring-2 ring-accent/10' : 'border-[#E2E8F0]'
          }`}
          style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
        >
          {/* Checkbox */}
          <button
            onClick={() => toggleSelect(offer.id)}
            className="mt-1 shrink-0 text-[#94A3B8] hover:text-accent transition-colors"
            aria-label={selectedIds.has(offer.id) ? 'Désélectionner' : 'Sélectionner'}
          >
            {selectedIds.has(offer.id) ? (
              <CheckSquare size={20} className="text-accent" />
            ) : (
              <Square size={20} />
            )}
          </button>

          {/* Logo */}
          <div className="w-12 h-12 rounded-xl bg-[#F7F8FC] border border-[#E2E8F0] flex items-center justify-center shrink-0 font-bold text-xs text-accent uppercase">
            {offer.company.slice(0, 2)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-heading font-semibold text-[#1E293B] text-base leading-tight mb-1">
                  {offer.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1">
                    <Building2 size={12} />
                    {offer.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {offer.location}
                    {offer.remote && <Badge variant="success" size="sm">Remote</Badge>}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(offer.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  <Badge variant="neutral">{offer.contractType}</Badge>
                  {offer.salary && <span className="font-semibold text-[#1E293B]">{offer.salary}</span>}
                </div>
              </div>

              {/* Match score */}
              {offer.matchScore !== undefined && (
                <div className="shrink-0 flex flex-col items-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-sm font-heading"
                    style={{
                      background: `conic-gradient(#7C3AED ${offer.matchScore * 3.6}deg, #EDE9FE 0deg)`,
                    }}
                  >
                    <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-accent text-xs font-bold">
                      {offer.matchScore}%
                    </div>
                  </div>
                  <span className="text-[10px] text-[#94A3B8] mt-1">Match</span>
                </div>
              )}
            </div>

            <p className="text-xs text-[#64748B] mt-2 line-clamp-2 leading-relaxed">{offer.description}</p>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => applyMutation.mutate(offer)}
                loading={applyMutation.isPending}
              >
                Postuler
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(offer.url, '_blank', 'noopener')}
              >
                <ExternalLink size={13} />
                Voir l&apos;offre
              </Button>
              <button
                className="ml-auto p-1.5 rounded-lg text-[#94A3B8] hover:text-accent hover:bg-accent/10 transition-colors"
                onClick={() => saveMutation.mutate({ id: offer.id, saved: false })}
                title="Sauvegarder"
              >
                <Bookmark size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Floating batch action bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1E293B] text-white rounded-2xl px-6 py-3 flex items-center gap-4 shadow-2xl z-50"
          >
            <span className="text-sm font-semibold">
              {selectedIds.size} offre{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
            </span>
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90 text-white"
              onClick={() => {
                const selected = offers.filter((o) => selectedIds.has(o.id));
                batchApplyMutation.mutate(selected);
              }}
              loading={batchApplyMutation.isPending}
            >
              <Send size={14} />
              Postuler aux {selectedIds.size} offres
            </Button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Annuler la sélection"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
