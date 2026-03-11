'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bookmark, Building2, MapPin, Clock, ExternalLink, Trash2, Search } from 'lucide-react';
import { api } from '@/lib/axios';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

interface SavedOffer {
  id: string;
  offerId: string;
  title: string;
  company: string;
  location: string;
  contractType: string;
  salary: string | null;
  url: string | null;
  savedAt: string;
}

export default function FavorisPage() {
  const qc = useQueryClient();

  const { data: offers = [], isLoading } = useQuery<SavedOffer[]>({
    queryKey: ['savedOffers', 'full'],
    queryFn: () => api.get('/offers/saved?full=1').then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const removeMutation = useMutation({
    mutationFn: (offerId: string) => api.delete(`/offers/${offerId}/save`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['savedOffers'] });
      toast.success('Offre retirée des favoris');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6 max-w-[860px]">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#1E293B]">Mes favoris</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            {offers.length} offre{offers.length !== 1 ? 's' : ''} sauvegardée{offers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href="/offres"
          className="flex items-center gap-2 px-3 py-2 rounded-btn border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:border-accent hover:text-accent transition-colors bg-white"
        >
          <Search size={14} />
          Chercher des offres
        </a>
      </motion.div>

      {/* Empty state */}
      {!isLoading && offers.length === 0 && (
        <motion.div
          variants={fadeInUp}
          className="bg-white rounded-card border border-[#E2E8F0] p-16 text-center"
          style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
        >
          <Bookmark size={40} className="mx-auto text-[#CBD5E1] mb-3" />
          <p className="font-heading font-semibold text-[#1E293B]">Aucun favori sauvegardé</p>
          <p className="text-sm text-[#64748B] mt-1">
            Cliquez sur l&apos;icône <Bookmark size={13} className="inline mx-0.5 text-[#94A3B8]" /> sur une offre pour la sauvegarder ici.
          </p>
          <a
            href="/offres"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-accent text-white rounded-btn text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            <Search size={14} />
            Parcourir les offres
          </a>
        </motion.div>
      )}

      {/* Skeleton loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-card" />
          ))}
        </div>
      )}

      {/* Offer cards */}
      {offers.map((offer) => (
        <motion.div
          key={offer.id}
          variants={fadeInUp}
          className="bg-white rounded-card border border-[#E2E8F0] p-5 flex items-start gap-4 hover:border-accent/30 transition-all"
          style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
        >
          {/* Logo placeholder */}
          <div className="w-12 h-12 rounded-xl bg-[#F7F8FC] border border-[#E2E8F0] flex items-center justify-center shrink-0 font-bold text-xs text-accent uppercase">
            {offer.company.slice(0, 2)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
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
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Sauvegardé le {new Date(offer.savedAt).toLocaleDateString('fr-FR')}
              </span>
              <Badge variant="neutral">{offer.contractType}</Badge>
              {offer.salary && (
                <span className="font-semibold text-[#1E293B]">{offer.salary}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              {offer.url && (
                <a
                  href={offer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors"
                >
                  <ExternalLink size={12} />
                  Voir l&apos;offre
                </a>
              )}
              <button
                onClick={() => removeMutation.mutate(offer.offerId)}
                disabled={removeMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-red-400 hover:text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors ml-auto disabled:opacity-50"
              >
                <Trash2 size={12} />
                Retirer
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
