import type { Metadata } from 'next';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { CTASection } from '@/components/landing/CTASection';

export const metadata: Metadata = {
  title: 'Fonctionnalités — CarrièrePilot',
  description:
    "Découvrez toutes les fonctionnalités IA de CarrièrePilot : génération de CV, lettres de motivation, matching d'offres, recherche automatique et bien plus.",
};

export default function FonctionnalitesPage() {
  return (
    <>
      {/* Hero */}
      <section className="section-padding bg-gradient-to-b from-white to-[#F7F8FC] text-center">
        <div className="container-app max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-6">
            Tout ce dont vous avez besoin
          </span>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-[#1E293B] leading-tight mb-4">
            Des outils IA pour{' '}
            <span className="text-gradient">décrocher le bon poste</span>
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-2xl mx-auto">
            CarrièrePilot automatise les tâches répétitives de la recherche d&apos;emploi pour que vous
            vous concentriez sur l&apos;essentiel : les entretiens.
          </p>
        </div>
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
}
