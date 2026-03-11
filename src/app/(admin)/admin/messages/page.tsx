'use client';

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
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      api.post(`/admin/messages/${id}/reply`, { reply }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-messages'] });
      setReplies((r) => ({ ...r, [vars.id]: '' }));
      toast.success('Réponse envoyée !');
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
            {unread > 0 ? `${unread} message${unread > 1 ? 's' : ''} non lu${unread > 1 ? 's' : ''}` : 'Tous les messages sont lus'}
          </p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="bg-white dark:bg-[#112240] rounded-xl border border-[#E2E8F0] dark:border-white/10 p-10 text-center">
          <MessageSquare size={32} className="mx-auto text-[#CBD5E1] mb-3" />
          <p className="text-[#94A3B8] text-sm">Aucun message reçu pour le moment.</p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`bg-white dark:bg-[#112240] rounded-xl border overflow-hidden transition-all ${
            msg.read ? 'border-[#E2E8F0] dark:border-white/10' : 'border-blue-300 dark:border-blue-500/50'
          }`}
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
                <p className={`text-sm font-semibold truncate ${msg.read ? 'text-[#64748B] dark:text-white/60' : 'text-[#1E293B] dark:text-white'}`}>
                  {msg.subject}
                </p>
                <p className="text-xs text-[#94A3B8] dark:text-white/40 truncate">
                  {[msg.user.firstName, msg.user.lastName].filter(Boolean).join(' ')} · {msg.user.email} · {msg.user.plan}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
              {msg.adminReply && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Répondu</span>
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
                <p className="text-xs font-semibold text-[#94A3B8] mb-1">Message de l&apos;utilisateur :</p>
                <p className="text-sm text-[#475569] dark:text-white/70 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
              </div>

              {msg.adminReply && (
                <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                    Votre réponse — {msg.repliedAt ? new Date(msg.repliedAt).toLocaleDateString('fr-FR') : ''}
                  </p>
                  <p className="text-sm text-[#475569] dark:text-white/70 leading-relaxed whitespace-pre-wrap">{msg.adminReply}</p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <label className="block text-xs font-semibold text-[#64748B] dark:text-white/60">
                  {msg.adminReply ? 'Modifier la réponse' : 'Répondre à ce message'}
                </label>
                <textarea
                  value={replies[msg.id] ?? (msg.adminReply ?? '')}
                  onChange={(e) => setReplies((r) => ({ ...r, [msg.id]: e.target.value }))}
                  rows={3}
                  placeholder="Écrivez votre réponse…"
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
                    {msg.adminReply ? 'Mettre à jour' : 'Envoyer la réponse'}
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
