'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingDown, DollarSign, Users, Zap, Mail, Database, Server, RefreshCw } from 'lucide-react';
import { api } from '@/lib/axios';
import { staggerContainer, fadeInUp } from '@/lib/animations';

interface RealCosts {
  month: string;
  breakdown: Record<string, number>;
  totals: { cv: number; letter: number; matching: number; auto: number; totalUSD: number; totalEUR: number };
  perUserCosts: { userId: string; email: string; plan: string; cvGeneration: number; coverLetter: number; aiMatching: number; autoApply: number; applications: number; costUSD: number; costEUR: number }[];
}

// Pricing constants
// OpenAI gpt-4o-mini (USD / 1M tokens)
const GPT4O_MINI_INPUT = 0.15;
const GPT4O_MINI_OUTPUT = 0.60;

// Average token usage per action (estimated)
const TOKENS = {
  cv: { input: 800, output: 1200 },
  letter: { input: 600, output: 900 },
  autoApply: { input: 200, output: 100 },
  chat: { input: 300, output: 200 },
};

// Vercel Serverless (Hobby) — compute estimate per 1000 invocations: ~$0.002
const VERCEL_PER_1K_CALLS = 0.002;
// Neon PostgreSQL — free tier ~$0, paid ~$0.0001 per query
const DB_PER_QUERY = 0.00005;
// Email (nodemailer / SMTP) — negligible on own SMTP; estimate $0.001 per email
const EMAIL_PER_SEND = 0.001;

interface PlanCost {
  plan: string;
  color: string;
  userCount: number;
  limits: { cv: number; letter: number; autoApply: number; chat: number };
  costs: Record<string, number>;
  total: number;
}

function calcPlanCosts(limits: { cv: number; letter: number; autoApply: number; chat: number }) {
  const cvAI = (limits.cv * (TOKENS.cv.input * GPT4O_MINI_INPUT + TOKENS.cv.output * GPT4O_MINI_OUTPUT)) / 1_000_000;
  const letterAI = (limits.letter * (TOKENS.letter.input * GPT4O_MINI_INPUT + TOKENS.letter.output * GPT4O_MINI_OUTPUT)) / 1_000_000;
  const autoApplyAI = (limits.autoApply * (TOKENS.autoApply.input * GPT4O_MINI_INPUT + TOKENS.autoApply.output * GPT4O_MINI_OUTPUT)) / 1_000_000;
  const chatAI = (limits.chat * (TOKENS.chat.input * GPT4O_MINI_INPUT + TOKENS.chat.output * GPT4O_MINI_OUTPUT)) / 1_000_000;
  const apiCalls = ((limits.cv + limits.letter + limits.autoApply + limits.chat) * 5 * VERCEL_PER_1K_CALLS) / 1000;
  const db = (limits.cv + limits.letter + limits.autoApply + limits.chat) * 10 * DB_PER_QUERY;
  const email = 3 * EMAIL_PER_SEND;
  return {
    'CV (IA)': cvAI,
    'Lettres (IA)': letterAI,
    'Candidatures auto (IA)': autoApplyAI,
    'Chat support (IA)': chatAI,
    'Compute (Vercel)': apiCalls,
    'Base de données': db,
    'Emails': email,
    total: cvAI + letterAI + autoApplyAI + chatAI + apiCalls + db + email,
  };
}

const PLANS: PlanCost[] = [
  {
    plan: 'Gratuit (FREE)',
    color: '#94A3B8',
    userCount: 0,
    limits: { cv: 1, letter: 1, autoApply: 0, chat: 5 },
    costs: {},
    total: 0,
  },
  {
    plan: 'Pro',
    color: '#7C3AED',
    userCount: 0,
    limits: { cv: 10, letter: 10, autoApply: 50, chat: 30 },
    costs: {},
    total: 0,
  },
  {
    plan: 'Expert',
    color: '#059669',
    userCount: 0,
    limits: { cv: 999, letter: 999, autoApply: 999, chat: 100 },
    costs: {},
    total: 0,
  },
];

PLANS.forEach((p) => {
  const c = calcPlanCosts(p.limits);
  p.costs = c;
  p.total = c.total;
});

const PLAN_PRICES_EUR = { FREE: 0, PRO: 19, EXPERT: 49 };

export default function CoutsPage() {
  const { data: usersData } = useQuery<{ plan: string; count: number }[]>({
    queryKey: ['admin-plan-counts'],
    queryFn: () => api.get('/admin/users?groupByPlan=1').then((r) => {
      const users: { plan: string }[] = r.data.users ?? r.data;
      const counts: Record<string, number> = {};
      users.forEach((u: { plan: string }) => { counts[u.plan] = (counts[u.plan] ?? 0) + 1; });
      return Object.entries(counts).map(([plan, count]) => ({ plan, count }));
    }).catch(() => []),
    staleTime: 5 * 60 * 1000,
  });

  const { data: realCosts, isLoading: costsLoading, refetch } = useQuery<RealCosts>({
    queryKey: ['admin-real-costs'],
    queryFn: () => api.get('/admin/costs').then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const planCounts: Record<string, number> = {};
  (usersData ?? []).forEach(({ plan, count }) => { planCounts[plan] = count; });

  const totalUsers = Object.values(planCounts).reduce((a, b) => a + b, 0);
  const freeCount = planCounts['FREE'] ?? 0;
  const proCount = planCounts['PRO'] ?? 0;
  const expertCount = planCounts['EXPERT'] ?? 0;

  const estimatedCost = (PLANS[0].total * freeCount) + (PLANS[1].total * proCount) + (PLANS[2].total * expertCount);
  const monthlyRevenue = (proCount * PLAN_PRICES_EUR.PRO) + (expertCount * PLAN_PRICES_EUR.EXPERT);
  const realEUR = realCosts?.totals.totalEUR ?? 0;

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6 max-w-[1000px]">
      <motion.div variants={fadeInUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1E293B]">Analyse des coûts</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Consommation réelle ce mois + estimation par plan</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-accent border border-[#E2E8F0] rounded-btn px-3 py-2 transition-colors">
          <RefreshCw size={13} className={costsLoading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </motion.div>

      {/* Real cost highlight */}
      <motion.div variants={fadeInUp} className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-card p-5 flex items-center gap-4 flex-wrap">
        <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center shrink-0">
          <DollarSign size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Coût total réel — {realCosts?.month ?? '…'}</p>
          <p className="text-3xl font-extrabold font-heading text-[#1E293B] mt-0.5">
            {costsLoading ? '…' : `${realEUR.toFixed(4)}€`}
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            {realCosts ? `CV: ${realCosts.totals.cv} · Lettres: ${realCosts.totals.letter} · Matching: ${realCosts.totals.matching} · Auto: ${realCosts.totals.auto}` : 'Chargement…'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-[#94A3B8]">Estimation théorique</p>
          <p className="text-lg font-bold text-[#475569]">${estimatedCost.toFixed(3)}</p>
        </div>
      </motion.div>

      {/* Summary KPIs */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Utilisateurs total', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Coût réel ce mois', value: `${realEUR.toFixed(4)}€`, icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Revenus mensuels', value: `${monthlyRevenue}€`, icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Marge estimée', value: `${(monthlyRevenue - realEUR).toFixed(2)}€`, icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-card border border-[#E2E8F0] p-5" style={{ boxShadow: '0 4px 24px rgba(15,52,96,0.06)' }}>
              <div className={`w-9 h-9 ${kpi.bg} rounded-xl flex items-center justify-center ${kpi.color} mb-3`}>
                <Icon size={17} />
              </div>
              <p className="text-xl font-extrabold font-heading text-[#1E293B]">{kpi.value}</p>
              <p className="text-xs text-[#64748B] mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Per-user consumption — redesigned */}
      {realCosts && realCosts.perUserCosts.length > 0 && (
        <motion.div variants={fadeInUp} className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,52,96,0.05)' }}>
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div>
              <h2 className="font-heading text-sm font-semibold text-[#1E293B]">Consommation par utilisateur</h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">Top utilisateurs ce mois — coût IA estimé</p>
            </div>
            <span className="text-xs bg-rose-50 text-rose-600 px-2 py-1 rounded-full font-medium border border-rose-100">
              {realCosts.perUserCosts.length} utilisateur{realCosts.perUserCosts.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left px-4 py-3 font-semibold text-[#475569]">Utilisateur</th>
                  <th className="text-center px-3 py-3 font-semibold text-[#475569]">Plan</th>
                  <th className="text-center px-3 py-3 font-semibold text-[#475569]">CV</th>
                  <th className="text-center px-3 py-3 font-semibold text-[#475569]">Lettres</th>
                  <th className="text-center px-3 py-3 font-semibold text-[#475569]">Matching</th>
                  <th className="text-center px-3 py-3 font-semibold text-[#475569]">Auto</th>
                  <th className="text-center px-3 py-3 font-semibold text-[#475569]">Emails</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#475569]">Coût estimé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {realCosts.perUserCosts.map((u, idx) => (
                  <tr key={u.userId} className={`hover:bg-[#F8FAFC] transition-colors ${idx === 0 ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {idx === 0 && <span className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold" style={{fontSize:'9px'}}>1</span>}
                        {idx === 1 && <span className="w-4 h-4 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold" style={{fontSize:'9px'}}>2</span>}
                        {idx === 2 && <span className="w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-white font-bold" style={{fontSize:'9px'}}>3</span>}
                        {idx > 2 && <span className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold" style={{fontSize:'9px'}}>{idx+1}</span>}
                        <span className="font-medium text-[#1E293B] truncate max-w-[160px]" title={u.email}>{u.email}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.plan === 'EXPERT' ? 'bg-violet-100 text-violet-700' : u.plan === 'PRO' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{u.plan}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-[#475569] font-medium">{u.cvGeneration}</td>
                    <td className="px-3 py-3 text-center text-[#475569] font-medium">{u.coverLetter}</td>
                    <td className="px-3 py-3 text-center text-[#475569] font-medium">{u.aiMatching}</td>
                    <td className="px-3 py-3 text-center text-[#475569] font-medium">{u.autoApply}</td>
                    <td className="px-3 py-3 text-center text-[#475569] font-medium">{u.applications}</td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <span className="font-mono font-bold text-rose-600">{u.costEUR.toFixed(4)}€</span>
                        <div className="text-[10px] text-[#94A3B8]">${u.costUSD.toFixed(5)}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F8FAFC] border-t-2 border-[#E2E8F0]">
                  <td colSpan={7} className="px-4 py-3 text-xs font-semibold text-[#475569]">Total ce mois</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-700 text-sm">{realEUR.toFixed(4)}€</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      )}

      {/* Per-plan breakdown */}
      <motion.div variants={fadeInUp} className="space-y-4">
        <h2 className="font-heading text-base font-semibold text-[#1E293B]">Coût théorique par plan / utilisateur / mois</h2>
        <div className="grid gap-4">
          {PLANS.map((plan, i) => {
            const count = [freeCount, proCount, expertCount][i];
            const priceEur = [PLAN_PRICES_EUR.FREE, PLAN_PRICES_EUR.PRO, PLAN_PRICES_EUR.EXPERT][i];
            const margin_user = priceEur - plan.total * 1.1;
            return (
              <div key={plan.plan} className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(15,52,96,0.05)' }}>
                <div className="h-1 w-full" style={{ background: plan.color }} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <h3 className="font-semibold text-[#1E293B]">{plan.plan}</h3>
                      <p className="text-xs text-[#64748B]">{count} utilisateur{count !== 1 ? 's' : ''} actuellement</p>
                    </div>
                    <div className="flex gap-4 text-right">
                      <div>
                        <p className="text-lg font-bold font-heading" style={{ color: plan.color }}>${plan.total.toFixed(4)}</p>
                        <p className="text-[11px] text-[#94A3B8]">coût / user</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold font-heading text-[#1E293B]">{priceEur}€</p>
                        <p className="text-[11px] text-[#94A3B8]">prix / user</p>
                      </div>
                      <div>
                        <p className={`text-lg font-bold font-heading ${margin_user > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{margin_user > 0 ? '+' : ''}{margin_user.toFixed(2)}€</p>
                        <p className="text-[11px] text-[#94A3B8]">marge / user</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(plan.costs).filter(([k]) => k !== 'total').map(([label, cost]) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span className="text-[#64748B] flex items-center gap-1.5">
                          {label.includes('IA') ? <Zap size={10} className="text-accent" /> :
                           label.includes('Email') ? <Mail size={10} className="text-blue-400" /> :
                           label.includes('donn') ? <Database size={10} className="text-emerald-400" /> :
                           <Server size={10} className="text-violet-400" />}
                          {label}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-28 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ background: plan.color, width: `${Math.min(100, (cost / (plan.total || 0.001)) * 100)}%` }} />
                          </div>
                          <span className="font-mono text-[#475569] w-16 text-right">${cost.toFixed(5)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Methodology note */}
      <motion.div variants={fadeInUp} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-card p-5 text-xs text-[#64748B] space-y-1">
        <p className="font-semibold text-[#475569]">Méthodologie</p>
        <p>• IA (gpt-4o-mini) : $0,15/1M tokens input — $0,60/1M tokens output</p>
        <p>• Coût réel calculé depuis les usages quotidiens enregistrés en base de données</p>
        <p>• Tokens estimés : CV≈2 000 · Lettre≈1 500 · Matching≈500 · Auto≈300</p>
        <p>• Infrastructure (Vercel + Neon) : ~$0,05/mois (plans gratuits)</p>
        <p>• Conversion USD→EUR : taux fixe 0,92</p>
      </motion.div>
    </motion.div>
  );
}
