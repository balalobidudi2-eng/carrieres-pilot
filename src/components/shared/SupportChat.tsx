'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { api } from '@/lib/axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// gpt-4o-mini pricing (USD per 1M tokens)
const INPUT_COST_PER_M = 0.15;
const OUTPUT_COST_PER_M = 0.60;

function formatCost(usage: TokenUsage): string {
  const cost = (usage.inputTokens * INPUT_COST_PER_M + usage.outputTokens * OUTPUT_COST_PER_M) / 1_000_000;
  return cost < 0.001 ? '<$0.001' : `$${cost.toFixed(4)}`;
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis l\'assistant CarrièrePilot. Comment puis-je vous aider ?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionTokens, setSessionTokens] = useState<TokenUsage>({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/support/chat', { messages: newMessages });
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
      if (res.data.usage) {
        setSessionTokens((prev) => ({
          inputTokens: prev.inputTokens + res.data.usage.inputTokens,
          outputTokens: prev.outputTokens + res.data.usage.outputTokens,
          totalTokens: prev.totalTokens + res.data.usage.totalTokens,
        }));
      }
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Désolé, une erreur est survenue. Veuillez réessayer.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="w-80 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl flex flex-col overflow-hidden"
            style={{ height: '440px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-accent text-white shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle size={15} />
                <span className="text-sm font-semibold">Support CarrièrePilot</span>
              </div>
              <button onClick={() => setOpen(false)} className="hover:opacity-70 transition-opacity">
                <X size={15} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-accent text-white rounded-br-sm'
                      : 'bg-[#F1F5F9] text-[#1E293B] rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#F1F5F9] px-3 py-2 rounded-xl rounded-bl-sm flex items-center gap-1.5">
                    <Loader2 size={13} className="animate-spin text-[#94A3B8]" />
                    <span className="text-xs text-[#94A3B8]">En train d&apos;écrire…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[#E2E8F0] flex gap-2 shrink-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder="Écrivez votre message…"
                className="flex-1 text-sm px-3 py-2 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-accent text-white rounded-lg flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-40 shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button — Assistant IA pill */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-2 bg-accent shadow-lg text-white px-4 py-2.5 rounded-full hover:bg-accent/90 transition-colors"
        aria-label="Assistant IA"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} className="flex items-center">
                <X size={17} />
              </motion.span>
            : <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="flex items-center">
                <MessageCircle size={17} />
              </motion.span>
          }
        </AnimatePresence>
        <span className="text-sm font-semibold whitespace-nowrap">
          {open ? 'Fermer' : 'Assistant IA'}
        </span>
      </motion.button>
    </div>
  );
}
