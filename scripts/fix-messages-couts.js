/**
 * Rewrites admin messages and couts pages with correct UTF-8 content.
 * Run: node scripts/fix-messages-couts.js
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

// ─── Messages page ─────────────────────────────────────────────────────────
const messagesContent = `'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MessageSquare, Check, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { api } from '@/lib/axios';
import toast from 'react-hot-toast';

interface ContactMsg {
  id: string;
  subject: string;
  message: string;
  read: boolean;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  user: { id: string; firstName: string | null; lastName: string | null; email: string; plan: string };
}

export default function AdminMessagesPage() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});

  const { data: messages = [], isLoading } = useQuery<ContactMsg[]>({
    queryKey: ['admin-messages'],
    queryFn: () => api.get('/admin/messages').then((r) => r.data),
    staleTime: 60 * 1000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch('/admin/messages', { id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-messages'] });
    },
    onError: () => toast.error('Erreur lors de la mise \\u00e0 jour'),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      api.post(\`/admin/messages/\${id}/reply\`, { reply }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-messages'] });
      setReplies((r) => ({ ...r, [vars.id]: '' }));
      toast.success('R\\u00e9ponse envoy\\u00e9e\\u00a0!');
    },
    onError: () => toast.error("Erreur lors de l'envoi"),
  });

  const unread = messages.filter((m) => !m.read).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 max-w-3xl"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
          <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1E293B] dark:text-white">Messages support</h1>
          <p className="text-sm text-[#64748B] dark:text-white/60">
            {unread > 0 ? \`\${unread} message\${unread > 1 ? 's' : ''} non lu\${unread > 1 ? 's' : ''}\` : 'Tous les messages sont lus'}
          </p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-10 text-center">
          <MessageSquare size={32} className="mx-auto text-[#CBD5E1] mb-3" />
          <p className="text-[#94A3B8] text-sm">Aucun message re\\u00e7u pour le moment.</p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={\`bg-white dark:bg-[#112240] rounded-xl border overflow-hidden transition-all \${
            msg.read ? 'border-[#E2E8F0] dark:border-white/10' : 'border-blue-300 dark:border-blue-500/50'
          }\`}
        >
          <div
            className="flex items-center justify-between px-5 py-4 cursor-pointer"
            onClick={() => {
              setExpanded(expanded === msg.id ? null : msg.id);
              if (!msg.read) markReadMutation.mutate(msg.id);
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {!msg.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
              <div className="min-w-0">
                <p className={\`text-sm font-semibold truncate \${msg.read ? 'text-[#64748B] dark:text-white/60' : 'text-[#1E293B] dark:text-white'}\`}>
                  {msg.subject}
                </p>
                <p className="text-xs text-[#94A3B8] dark:text-white/40 truncate">
                  {[msg.user.firstName, msg.user.lastName].filter(Boolean).join(' ')} \\u00b7 {msg.user.email} \\u00b7 {msg.user.plan}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              {msg.adminReply && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">R\\u00e9pondu</span>
              )}
              {!msg.read && (
                <button
                  onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(msg.id); }}
                  disabled={markReadMutation.isPending}
                  className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium disabled:opacity-50"
                >
                  <Check size={13} /> Marquer lu
                </button>
              )}
              <span className="text-xs text-[#94A3B8] dark:text-white/40">
                {new Date(msg.createdAt).toLocaleDateString('fr-FR')}
              </span>
              {expanded === msg.id ? <ChevronUp size={15} className="text-[#94A3B8]" /> : <ChevronDown size={15} className="text-[#94A3B8]" />}
            </div>
          </div>
          {expanded === msg.id && (
            <div className="px-5 pb-5 pt-0 border-t border-[#F1F5F9] dark:border-white/5">
              <div className="mt-4 p-3 bg-[#F8FAFC] dark:bg-white/5 rounded-lg">
                <p className="text-xs font-semibold text-[#94A3B8] mb-1">Message de l&apos;utilisateur\\u00a0:</p>
                <p className="text-sm text-[#475569] dark:text-white/70 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
              </div>

              {msg.adminReply && (
                <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                    Votre r\\u00e9ponse \\u2014 {msg.repliedAt ? new Date(msg.repliedAt).toLocaleDateString('fr-FR') : ''}
                  </p>
                  <p className="text-sm text-[#475569] dark:text-white/70 leading-relaxed whitespace-pre-wrap">{msg.adminReply}</p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <label className="block text-xs font-semibold text-[#64748B] dark:text-white/60">
                  {msg.adminReply ? 'Modifier la r\\u00e9ponse' : 'R\\u00e9pondre \\u00e0 ce message'}
                </label>
                <textarea
                  value={replies[msg.id] ?? (msg.adminReply ?? '')}
                  onChange={(e) => setReplies((r) => ({ ...r, [msg.id]: e.target.value }))}
                  rows={3}
                  placeholder="\\u00c9crivez votre r\\u00e9ponse\\u2026"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-white/10 rounded-lg text-sm bg-white dark:bg-[#0D1B2A] text-[#1E293B] dark:text-white focus:outline-none focus:border-blue-400 dark:focus:border-blue-400 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const text = (replies[msg.id] ?? '').trim();
                      if (!text) return;
                      replyMutation.mutate({ id: msg.id, reply: text });
                    }}
                    disabled={replyMutation.isPending || !(replies[msg.id] ?? '').trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Send size={13} />
                    {msg.adminReply ? 'Mettre \\u00e0 jour' : 'Envoyer la r\\u00e9ponse'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </motion.div>
  );
}
`;

// ─── Couts page ─────────────────────────────────────────────────────────────
const coutsContent = `'use client';

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
    'Base de donn\\u00e9es': db,
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
          <h1 className="font-heading text-2xl font-bold text-[#1E293B]">Analyse des co\\u00fbts</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Consommation r\\u00e9elle ce mois + estimation par plan</p>
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
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Co\\u00fbt total r\\u00e9el \\u2014 {realCosts?.month ?? '\\u2026'}</p>
          <p className="text-3xl font-extrabold font-heading text-[#1E293B] mt-0.5">
            {costsLoading ? '\\u2026' : \`\${realEUR.toFixed(4)}\\u20ac\`}
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            {realCosts ? \`CV: \${realCosts.totals.cv} \\u00b7 Lettres: \${realCosts.totals.letter} \\u00b7 Matching: \${realCosts.totals.matching} \\u00b7 Auto: \${realCosts.totals.auto}\` : 'Chargement\\u2026'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-[#94A3B8]">Estimation th\\u00e9orique</p>
          <p className="text-lg font-bold text-[#475569]">\$\{estimatedCost.toFixed(3)}</p>
        </div>
      </motion.div>

      {/* Summary KPIs */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Utilisateurs total', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Co\\u00fbt r\\u00e9el ce mois', value: \`\${realEUR.toFixed(4)}\\u20ac\`, icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Revenus mensuels', value: \`\${monthlyRevenue}\\u20ac\`, icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Marge estim\\u00e9e', value: \`\${(monthlyRevenue - realEUR).toFixed(2)}\\u20ac\`, icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-card border border-[#E2E8F0] p-5" style={{ boxShadow: '0 4px 24px rgba(15,52,96,0.06)' }}>
              <div className={\`w-9 h-9 \${kpi.bg} rounded-xl flex items-center justify-center \${kpi.color} mb-3\`}>
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
              <p className="text-xs text-[#94A3B8] mt-0.5">Top utilisateurs ce mois \\u2014 co\\u00fbt IA estim\\u00e9</p>
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
                  <th className="text-right px-4 py-3 font-semibold text-[#475569]">Co\\u00fbt estim\\u00e9</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {realCosts.perUserCosts.map((u, idx) => (
                  <tr key={u.userId} className={\`hover:bg-[#F8FAFC] transition-colors \${idx === 0 ? 'bg-rose-50/30' : ''}\`}>
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
                      <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold \${u.plan === 'EXPERT' ? 'bg-violet-100 text-violet-700' : u.plan === 'PRO' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}\`}>{u.plan}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-[#475569] font-medium">{u.cvGeneration}</td>
                    <td className="px-3 py-3 text-center text-[#475569] font-medium">{u.coverLetter}</td>
                    <td className="px-3 py-3 text-center text-[#475569] font-medium">{u.aiMatching}</td>
                    <td className="px-3 py-3 text-center text-[#475569] font-medium">{u.autoApply}</td>
                    <td className="px-3 py-3 text-center text-[#475569] font-medium">{u.applications}</td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <span className="font-mono font-bold text-rose-600">{u.costEUR.toFixed(4)}\\u20ac</span>
                        <div className="text-[10px] text-[#94A3B8]">\${u.costUSD.toFixed(5)}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F8FAFC] border-t-2 border-[#E2E8F0]">
                  <td colSpan={7} className="px-4 py-3 text-xs font-semibold text-[#475569]">Total ce mois</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-rose-700 text-sm">{realEUR.toFixed(4)}\\u20ac</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      )}

      {/* Per-plan breakdown */}
      <motion.div variants={fadeInUp} className="space-y-4">
        <h2 className="font-heading text-base font-semibold text-[#1E293B]">Co\\u00fbt th\\u00e9orique par plan / utilisateur / mois</h2>
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
                        <p className="text-lg font-bold font-heading" style={{ color: plan.color }}>\$\{plan.total.toFixed(4)}</p>
                        <p className="text-[11px] text-[#94A3B8]">co\\u00fbt / user</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold font-heading text-[#1E293B]">{priceEur}\\u20ac</p>
                        <p className="text-[11px] text-[#94A3B8]">prix / user</p>
                      </div>
                      <div>
                        <p className={\`text-lg font-bold font-heading \${margin_user > 0 ? 'text-emerald-600' : 'text-red-500'}\`}>{margin_user > 0 ? '+' : ''}{margin_user.toFixed(2)}\\u20ac</p>
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
                            <div className="h-full rounded-full" style={{ background: plan.color, width: \`\${Math.min(100, (cost / (plan.total || 0.001)) * 100)}%\` }} />
                          </div>
                          <span className="font-mono text-[#475569] w-16 text-right">\$\{cost.toFixed(5)}</span>
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
        <p className="font-semibold text-[#475569]">M\\u00e9thodologie</p>
        <p>\\u2022 IA (gpt-4o-mini)\\u00a0: $0,15/1M tokens input \\u2014 $0,60/1M tokens output</p>
        <p>\\u2022 Co\\u00fbt r\\u00e9el calcul\\u00e9 depuis les usages quotidiens enregistr\\u00e9s en base de donn\\u00e9es</p>
        <p>\\u2022 Tokens estim\\u00e9s\\u00a0: CV\\u22482\\u202f000 \\u00b7 Lettre\\u22481\\u202f500 \\u00b7 Matching\\u2248500 \\u00b7 Auto\\u2248300</p>
        <p>\\u2022 Infrastructure (Vercel + Neon)\\u00a0: ~$0,05/mois (plans gratuits)</p>
        <p>\\u2022 Conversion USD\\u2192EUR\\u00a0: taux fixe 0,92</p>
      </motion.div>
    </motion.div>
  );
}
`;

// Write both files
const msgPath = path.join(root, 'src/app/(admin)/admin/messages/page.tsx');
const coutsPath = path.join(root, 'src/app/(admin)/admin/couts/page.tsx');

fs.writeFileSync(msgPath, messagesContent, 'utf8');
console.log('Written:', msgPath);

fs.writeFileSync(coutsPath, coutsContent, 'utf8');
console.log('Written:', coutsPath);
console.log('Done.');
