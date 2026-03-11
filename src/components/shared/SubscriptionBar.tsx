'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/axios';

const LABEL_MAP: Record<string, string> = {
  cv_generation: 'CV',
  cover_letter: 'Lettres',
  job_search: 'Candidatures auto',
  ai_matching: 'Matchings IA',
  auto_apply: 'Candidatures IA',
  application: 'Candidatures',
  interview_questions: 'Entretiens IA',
};

/** Quota keys shown in the sidebar (CV, Lettres, Candidatures auto) */
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
    (i) => VISIBLE_KEYS.includes(i.key) && i.max > 0,
  );

  return (
    <div className="border-t border-[#E2E8F0] px-3 py-2 space-y-2 shrink-0">
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

      {/* Quota bars — CV / Lettres / Recherches IA */}
      {items.map((item) => {
        const used = Math.round(Number(item.used) || 0);
        const max = Math.round(Number(item.max) || 1);
        const pct = Math.min(100, (used / max) * 100);
        const isLow = item.remaining <= 1;
        return (
          <div key={item.key}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-[#64748B]">
                {used}&nbsp;{LABEL_MAP[item.key] ?? item.key}&nbsp;/&nbsp;{max}
              </span>
              {isLow && max > 0 && (
                <span className="text-[9px] text-red-400 font-semibold">Épuisé</span>
              )}
            </div>
            <div className="w-full h-1 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isLow ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-accent'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
