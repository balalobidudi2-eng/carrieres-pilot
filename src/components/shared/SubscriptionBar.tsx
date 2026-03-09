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

  return (
    <div className="border-t border-[#E2E8F0] px-3 py-3 space-y-2.5">
      {/* Plan name */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#1E293B]">Plan {data.planName}</span>
        <span className="text-[10px] text-[#94A3B8]">Renouvellement à {data.renewalTime}</span>
      </div>

      {/* Usage bars */}
      {items.map((item) => {
        const pct = item.max > 0 ? Math.min(100, (item.used / item.max) * 100) : 0;
        const isLow = item.remaining <= 1 && item.max > 0;
        return (
          <div key={item.key}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-[#64748B]">{LABEL_MAP[item.key] ?? item.key}</span>
              <span className={`text-[10px] font-medium ${isLow ? 'text-red-500' : 'text-[#64748B]'}`}>
                {item.used}/{item.max} tâches
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
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

      {/* Upgrade CTA for free plan */}
      {data.plan === 'FREE' && (
        <Link
          href="/abonnement"
          className="flex items-center justify-center gap-1 text-[10px] font-semibold text-accent hover:text-accent/80 bg-accent/5 rounded-md py-1.5 transition-colors"
        >
          Passer au Pro <ArrowUpRight size={10} />
        </Link>
      )}
    </div>
  );
}
