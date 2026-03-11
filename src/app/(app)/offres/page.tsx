'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Bell,
  TrendingUp,
  Kanban,
  ChevronDown,
  Bot,
  Plus,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/axios';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { PLANS } from '@/lib/plans';
import { useAuthStore } from '@/stores/authStore';
import type { JobOffer } from '@/types';
import toast from 'react-hot-toast';

const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance', 'Intérim', 'Mission', 'Apprentissage'];
const SECTORS = ['Tech', 'Design', 'Marketing', 'Finance', 'Santé', 'Retail', 'RH', 'Commercial', 'Industrie', 'Logistique', 'Juridique', 'Immobilier', 'BTP', 'Éducation', 'Art & Culture'];

function OffresPageContent() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const planConfig = PLANS[user?.plan ?? 'FREE'] ?? PLANS.FREE;
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [contracts, setContracts] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [locationMode, setLocationMode] = useState<'france' | 'custom'>('france');
  const [customLocation, setCustomLocation] = useState('');
  const [tab, setTab] = useState<'recommended' | 'all'>(searchParams.get('q') ? 'all' : 'recommended');
  // committed = params actually used for last search
  const [committed, setCommitted] = useState({ query: searchParams.get('q') ?? '', contracts: [] as string[], sectors: [] as string[], distance: 0, locationMode: 'france' as 'france' | 'custom', customLocation: '' });

  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = contracts.length + sectors.length + (distance > 0 ? 1 : 0) + (locationMode === 'custom' && customLocation ? 1 : 0);

  const triggerSearch = () => {
    setCommitted({ query, contracts, sectors, distance, locationMode, customLocation });
  };

  // Sync URL param changes (e.g. navigating from GlobalSearchModal)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); setTab('all'); setCommitted((prev) => ({ ...prev, query: q })); }
  }, [searchParams]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // F1 — saved offer IDs loaded from DB
  const { data: savedOfferIds = [] } = useQuery<string[]>({
    queryKey: ['savedOffers'],
    queryFn: () => api.get('/offers/saved').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  // Sync savedIds from DB query on mount
  useEffect(() => {
    if (savedOfferIds.length > 0) setSavedIds(new Set(savedOfferIds));
  }, [savedOfferIds]);
  // F3 — alert creation panel
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertKeywords, setAlertKeywords] = useState('');
  const [alertLocation, setAlertLocation] = useState('');
  const [alertFreq, setAlertFreq] = useState<'daily' | 'weekly'>('daily');

  // Popup "Avez-vous postulé ?" déclenché au retour sur l'app après avoir vu une offre
  const [pendingConfirmOffer, setPendingConfirmOffer] = useState<JobOffer | null>(null);
  const [showReturnPopup, setShowReturnPopup] = useState(false);

  const handleViewOffer = (offer: JobOffer) => {
    if (!offer.url) return;
    setPendingConfirmOffer(offer);
    setShowReturnPopup(false);
    window.open(offer.url, '_blank', 'noopener,noreferrer');
  };

  // Lorsque la fenêtre reprend le focus après ouverture de l'offre, afficher le popup
  useEffect(() => {
    if (!pendingConfirmOffer) return;
    const onFocus = () => setShowReturnPopup(true);
    window.addEventListener('focus', onFocus, { once: true });
    return () => window.removeEventListener('focus', onFocus);
  }, [pendingConfirmOffer]);

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

  const { data: offers = [], isLoading, isError: offersIsError } = useQuery<JobOffer[]>({
    queryKey: ['offers', tab, committed],
    queryFn: () =>
      api
        .get(tab === 'recommended' ? '/offers/recommended' : '/offers', {
          params: {
            q: committed.query,
            contract: committed.contracts.length > 0 ? committed.contracts.join(',') : undefined,
            sector: committed.sectors.length > 0 ? committed.sectors.join(',') : undefined,
            distance: committed.distance > 0 ? committed.distance : undefined,
            commune: committed.locationMode === 'custom' && committed.customLocation ? committed.customLocation : undefined,
            max: 20,
          },
        })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (offersIsError) toast.error('Erreur lors de la recherche d\'offres. Réessayez dans un instant.');
  }, [offersIsError]);

  // F6 — application stats for the mini stats bar
  const { data: appStats } = useQuery<{ totalApplications: number; responseRate: number; interviewsCount: number; pendingCount: number }>({
    queryKey: ['application-stats'],
    queryFn: () => api.get('/applications/stats').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, saved, offer }: { id: string; saved: boolean; offer: JobOffer }) =>
      saved
        ? api.delete(`/offers/${id}/save`)
        : api.post(`/offers/${id}/save`, {
            title: offer.title,
            company: offer.company,
            location: offer.location,
            contractType: offer.contractType,
            salary: offer.salary,
            url: offer.url,
            description: offer.description,
          }),
    onSuccess: (_, vars) => {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (vars.saved) next.delete(vars.id); else next.add(vars.id);
        return next;
      });
      qc.invalidateQueries({ queryKey: ['savedOffers'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erreur';
      toast.error(msg);
    },
  });

  // F3 — alert creation
  const alertMutation = useMutation({
    mutationFn: (data: { keywords: string; location: string; frequency: string }) =>
      api.post('/offers/alerts', data),
    onSuccess: () => {
      toast.success('Alerte créée — vous recevrez des offres par email !');
      setAlertOpen(false);
      setAlertKeywords('');
      setAlertLocation('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erreur lors de la création';
      toast.error(msg);
    },
  });

  const autoApplyMutation = useMutation({
    mutationFn: (offer: JobOffer) =>
      api.post('/applications/auto-fill', {
        applicationUrl: offer.url,
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        email: user?.email ?? '',
        phone: user?.phone,
        linkedinUrl: user?.linkedinUrl,
        offerTitle: offer.title,
        offerCompany: offer.company,
      }).then((r) => r.data as { success: boolean; status: string; message: string }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Candidature envoyée automatiquement !');
        qc.invalidateQueries({ queryKey: ['application-stats'] });
      } else {
        toast(data.message, { icon: '⚠️' });
      }
    },
    onError: (err: unknown) => {
      const d = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      const msg = d?.error ?? d?.message ?? 'Erreur lors de la candidature automatique';
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
      <motion.div variants={fadeInUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#1E293B]">Offres d&apos;emploi</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Offres matchées par IA selon votre profil</p>
        </div>
        {/* F2 — link to Kanban */}
        <a
          href="/candidatures"
          className="flex items-center gap-2 px-3 py-2 rounded-btn border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:border-accent hover:text-accent transition-colors bg-white"
        >
          <Kanban size={15} />
          Mon Kanban
        </a>
      </motion.div>

      {/* F6 — Mini stats bar */}
      {appStats && (
        <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Favoris sauvegardés', value: savedIds.size, icon: '📌', color: '#6B7280', href: '/favoris' },
            { label: 'Candidatures totales', value: appStats.totalApplications, icon: '📤', color: '#3B82F6', href: '/candidatures' },
            { label: 'Entretiens', value: appStats.interviewsCount, icon: '🗓️', color: '#F59E0B', href: '/candidatures?status=INTERVIEW_SCHEDULED' },
            { label: 'Taux de réponse', value: `${appStats.responseRate}%`, icon: '📊', color: '#10B981', href: '/candidatures' },
          ].map((stat) => (
            <a
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-card border border-[#E2E8F0] px-4 py-3 flex items-center gap-3 hover:border-accent/40 hover:shadow-md transition-all"
              style={{ boxShadow: '0 2px 12px rgba(15,52,96,0.05)' }}
            >
              <span className="text-xl">{stat.icon}</span>
              <div>
                <p className="font-heading font-bold text-[#1E293B] text-lg leading-none">{stat.value}</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">{stat.label}</p>
              </div>
            </a>
          ))}
          {/* Admin exclusive SMTP stat — visible uniquement pour l'admin */}
          {user?.adminLevel ? (
            <div
              className="bg-white rounded-card border border-accent/30 px-4 py-3 flex items-center gap-3"
              style={{ boxShadow: '0 2px 12px rgba(15,52,96,0.05)' }}
            >
              <Bot size={20} className="text-accent" />
              <div>
                <p className="font-heading font-bold text-accent text-lg leading-none">∞</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">Emails SMTP illimités</p>
              </div>
            </div>
          ) : null}
        </motion.div>
      )}

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

      {/* F3 — Alert creation panel */}
      <motion.div variants={fadeInUp} className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,52,96,0.05)' }}>
        <button
          type="button"
          onClick={() => setAlertOpen((p) => !p)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-[#1E293B] hover:bg-[#F7F8FC] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Bell size={15} className="text-accent" />
            Créer une alerte emploi
          </span>
          <ChevronDown size={15} className={`text-[#94A3B8] transition-transform ${alertOpen ? 'rotate-180' : ''}`} />
        </button>
        {alertOpen && (
          <div className="px-5 pb-4 space-y-3 border-t border-[#E2E8F0]">
            <p className="text-xs text-[#64748B] pt-3">Recevez par email les nouvelles offres correspondant à vos critères.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={alertKeywords}
                onChange={(e) => setAlertKeywords(e.target.value)}
                placeholder="Ex : Product Designer, React…"
                className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-btn text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 bg-white"
              />
              <input
                type="text"
                value={alertLocation}
                onChange={(e) => setAlertLocation(e.target.value)}
                placeholder="Ville (optionnel)"
                className="px-3 py-2 border border-[#E2E8F0] rounded-btn text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 bg-white"
              />
              <select
                value={alertFreq}
                onChange={(e) => setAlertFreq(e.target.value as 'daily' | 'weekly')}
                className="px-3 py-2 border border-[#E2E8F0] rounded-btn text-sm focus:outline-none focus:border-accent bg-white"
              >
                <option value="daily">Chaque jour</option>
                <option value="weekly">Chaque semaine</option>
              </select>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => alertMutation.mutate({ keywords: alertKeywords, location: alertLocation, frequency: alertFreq })}
                loading={alertMutation.isPending}
                disabled={!alertKeywords.trim()}
              >
                <Bell size={13} />
                Créer l&apos;alerte
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Unified Filter Panel ─────────────────────────────────────── */}
      <motion.div variants={fadeInUp} className="space-y-2">
        {/* Search row */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
              placeholder="Titre, entreprise, compétence…"
              className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-btn text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 bg-white"
            />
          </div>
          <Button onClick={triggerSearch} loading={isLoading}>
            <Search size={14} />
            Rechercher
          </Button>

          {/* Filter toggle button */}
          <button
            type="button"
            onClick={() => setFiltersOpen((p) => !p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-btn text-sm font-semibold border transition-all ${
              activeFilterCount > 0
                ? 'border-accent text-accent bg-accent/5'
                : 'border-[#E2E8F0] text-[#64748B] bg-white hover:border-accent/40'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filtres
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
            )}
            <ChevronDown size={12} className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Active filter pills */}
          {contracts.map((c) => (
            <span key={c} className="flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
              {c}
              <button onClick={() => setContracts((p) => p.filter((x) => x !== c))}><X size={10} /></button>
            </span>
          ))}
          {sectors.map((s) => (
            <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
              {s}
              <button onClick={() => setSectors((p) => p.filter((x) => x !== s))}><X size={10} /></button>
            </span>
          ))}
        </div>

        {/* Collapsible filter panel */}
        {filtersOpen && (
          <div className="bg-white border border-[#E2E8F0] rounded-card p-4 space-y-4" style={{ boxShadow: '0 2px 12px rgba(15,52,96,0.05)' }}>
            {/* Contract types */}
            <div>
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">Type de contrat</p>
              <div className="flex flex-wrap gap-1.5">
                {CONTRACT_TYPES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setContracts((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])}
                    className={`px-3 py-1.5 rounded-btn text-xs font-semibold transition-all ${
                      contracts.includes(c) ? 'bg-accent text-white' : 'bg-[#F1F5F9] text-[#475569] hover:bg-accent/10 hover:text-accent'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Sectors */}
            <div>
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">Secteur d&apos;activité</p>
              <div className="flex flex-wrap gap-1.5">
                {SECTORS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSectors((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                    className={`px-3 py-1.5 rounded-btn text-xs font-semibold transition-all ${
                      sectors.includes(s) ? 'bg-primary text-white' : 'bg-[#F1F5F9] text-[#475569] hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide mb-2">Localisation</p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1 p-0.5 bg-[#F7F8FC] rounded-lg border border-[#E2E8F0]">
                  <button
                    onClick={() => setLocationMode('france')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${locationMode === 'france' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B]'}`}
                  >
                    Toute la France
                  </button>
                  <button
                    onClick={() => setLocationMode('custom')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${locationMode === 'custom' ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B]'}`}
                  >
                    Ville précise
                  </button>
                </div>
                {locationMode === 'custom' && (
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="Paris, Lyon, Marseille…"
                    className="px-3 py-2 border border-[#E2E8F0] rounded-btn text-xs bg-white focus:outline-none focus:border-accent w-40"
                  />
                )}
                <select
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="px-3 py-2 border border-[#E2E8F0] rounded-btn text-xs font-semibold bg-white text-[#64748B] focus:outline-none focus:border-accent transition-colors"
                >
                  <option value={0}>Rayon illimité</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0]">
              <button
                onClick={() => { setContracts([]); setSectors([]); setDistance(0); setLocationMode('france'); setCustomLocation(''); }}
                className="text-xs text-[#94A3B8] hover:text-red-500 transition-colors"
              >
                Réinitialiser les filtres
              </button>
              <Button size="sm" onClick={() => { triggerSearch(); setFiltersOpen(false); }}>
                Appliquer les filtres
              </Button>
            </div>
          </div>
        )}
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
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {/* Postuler — ajoute l'offre au Kanban (TO_SEND) pour suivi manuel */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => applyMutation.mutate(offer)}
                loading={applyMutation.isPending && (applyMutation.variables as any)?.id === offer.id}
                title="Ajouter au Kanban pour un suivi manuel de votre candidature"
              >
                <Plus size={13} />
                Postuler
              </Button>
              {/* Candidature auto — PRO/EXPERT : IA remplit et envoie le dossier */}
              {(user?.plan === 'PRO' || user?.plan === 'EXPERT' || user?.adminLevel) ? (
                <Button
                  size="sm"
                  onClick={() => autoApplyMutation.mutate(offer)}
                  loading={autoApplyMutation.isPending && autoApplyMutation.variables?.id === offer.id}
                  title={user?.adminLevel ? 'Admin — envoi email SMTP illimité' : 'L\'IA rédige et envoie votre candidature par email'}
                >
                  <Bot size={13} />
                  Candidature auto
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.location.href = '/abonnement'}
                  title="Disponible à partir du plan Pro — l\'IA envoie votre candidature par email"
                >
                  <Bot size={13} />
                  Candidature auto
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => offer.url && handleViewOffer(offer)}
                disabled={!offer.url}
              >
                <ExternalLink size={13} />
                Voir l&apos;offre
              </Button>
              <button
                className="ml-auto p-1.5 rounded-lg text-[#94A3B8] hover:text-accent hover:bg-accent/10 transition-colors"
                onClick={() => saveMutation.mutate({ id: offer.id, saved: savedIds.has(offer.id), offer })}
                title={savedIds.has(offer.id) ? 'Retirer des favoris' : 'Sauvegarder'}
              >
                {savedIds.has(offer.id) ? (
                  <BookmarkCheck size={15} className="text-accent" />
                ) : (
                  <Bookmark size={15} />
                )}
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
      {/* Popup "Avez-vous postulé ?" affiché au retour après avoir consulté une offre */}
      <Modal
        open={showReturnPopup && !!pendingConfirmOffer}
        onClose={() => { setShowReturnPopup(false); setPendingConfirmOffer(null); }}
        title="Avez-vous postulé ?"
        size="sm"
      >
        {pendingConfirmOffer && (
          <div className="space-y-4">
            <p className="text-sm text-[#64748B]">
              Avez-vous postulé à l&apos;offre{' '}
              <strong className="text-[#1E293B]">{pendingConfirmOffer.title}</strong>{' '}
              chez <strong className="text-[#1E293B]">{pendingConfirmOffer.company}</strong> ?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowReturnPopup(false); setPendingConfirmOffer(null); }}
              >
                Non
              </Button>
              <Button
                size="sm"
                loading={applyMutation.isPending}
                onClick={() => {
                  applyMutation.mutate(pendingConfirmOffer);
                  setShowReturnPopup(false);
                  setPendingConfirmOffer(null);
                }}
              >
                Oui, enregistrer dans mon Kanban
              </Button>            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}

export default function OffresPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-40 text-[#94A3B8] text-sm">Chargement…</div>}>
      <OffresPageContent />
    </Suspense>
  );
}
