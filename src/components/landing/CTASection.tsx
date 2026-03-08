'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CTASection() {
  return (
    <section className="section-padding">
      <div className="container-app">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="rounded-[24px] bg-gradient-brand text-white p-16 text-center relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 -z-0">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
              🎯 Sans carte bancaire requise
            </div>
            <h2 className="font-heading text-4xl font-bold text-white leading-tight">
              Prêt à décrocher votre prochain emploi ?
            </h2>
            <p className="text-white/70 text-lg">
              Rejoignez 12 000+ candidats qui ont déjà trouvé leur job grâce à CarrièrePilot.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/inscription">
                <Button
                  size="lg"
                  className="bg-white text-accent hover:bg-white/90 font-bold"
                  variant="outline"
                >
                  Commencer gratuitement — c&apos;est sans CB
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
            <p className="text-white/50 text-sm">
              ✓ Gratuit pour toujours · ✓ Upgrade quand vous voulez · ✓ Annulation sans conditions
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
