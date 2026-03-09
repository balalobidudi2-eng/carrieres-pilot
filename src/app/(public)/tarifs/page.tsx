import type { Metadata } from 'next';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';

export const metadata: Metadata = {
  title: 'Tarifs — CarrièrePilot',
  description:
    'Découvrez nos offres Free, Pro et Expert. Commencez gratuitement, sans carte bancaire. Passez au plan supérieur quand vous êtes prêt.',
};

export default function TarifsPage() {
  return (
    <>
      {/* Hero */}
      <section className="section-padding bg-gradient-to-b from-white to-[#F7F8FC] text-center">
        <div className="container-app max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-6">
            Transparent &amp; sans engagement
          </span>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-[#1E293B] leading-tight mb-4">
            Un prix juste pour{' '}
            <span className="text-gradient">chaque étape</span>
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-2xl mx-auto">
            Démarrez gratuitement, sans carte bancaire. Passez au plan supérieur dès que vous avez
            besoin de plus de puissance.
          </p>
        </div>
      </section>

      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
