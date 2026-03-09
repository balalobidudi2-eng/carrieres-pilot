'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/axios';

const LABEL_MAP: Record<string, string> = {
  cv_generation: 'CV',
  cover_letter: 'Lettres',
  job_search: 'Recherches',
  ai_matching: 'Matchings IA',
  auto_apply: 'Candidatures auto',
};

/** Visible quota keys to show in the sidebar bar */
const VISIBLE_KEYS = ['cv_generation', 'cover_letter', 'auto_apply'];

interface UsageItem {
  key: string;
  used: number;
  max: number;
  remaining: number;
  enabled: boolean;
}

export function SubscriptionBar({ collapsed }: { collapsed: boolean }) {
  const { data } = useQuery({
    queryKey: ['subscription-usage'],
    queryFn: () => api.get('/users/me/subscription').then((r) => r.data),
    staleTime: 30_000,
    retry: false,
  });

  if (!data || collapsed) return null;

  const items = (data.items as UsageItem[]).filter(
    (i) => VISIBLE_KEYS.includes(i.key) && i.enabled,
  );

  // Show only the single most-pressed quota item to keep the sidebar compact
  const criticalItem = items.reduce<UsageItem | null>((worst, item) => {
    if (item.max === 0) return worst;
    const pct = item.used / item.max;
    if (!worst) return item;
    return pct > (worst.used / worst.max) ? item : worst;
  }, null);

  return (
    <div className="border-t border-[#E2E8F0] px-3 py-2 space-y-1.5 shrink-0">
      {/* Plan name */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#1E293B]">Plan {data.planName}</span>
        {data.plan === 'FREE' ? (
          <Link href="/abonnement" className="flex items-center gap-0.5 text-[10px] font-semibold text-accent hover:text-accent/80 transition-colors">
            Passer Pro <ArrowUpRight size={9} />
          </Link>
        ) : (
          <span className="text-[10px] text-[#94A3B8]">↻ minuit</span>
        )}
      </div>

      {/* Single critical usage bar */}
      {criticalItem && (() => {
        const pct = Math.min(100, (criticalItem.used / criticalItem.max) * 100);
        const isLow = criticalItem.remaining <= 1 && criticalItem.max > 0;
        return (
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-[#64748B]">{LABEL_MAP[criticalItem.key] ?? criticalItem.key}</span>
              <span className={`text-[10px] font-medium ${isLow ? 'text-red-500' : 'text-[#64748B]'}`}>
                {criticalItem.used}/{criticalItem.max}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isLow ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-accent'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
