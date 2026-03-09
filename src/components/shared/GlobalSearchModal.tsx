'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Briefcase, FileText, Mail, KanbanSquare, ArrowRight } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const QUICK_LINKS = [
  { href: '/offres', label: 'Offres d\'emploi', icon: Briefcase, hint: 'Rechercher des offres' },
  { href: '/cv', label: 'Mon CV', icon: FileText, hint: 'Gérer vos CV' },
  { href: '/lettre', label: 'Lettres de motivation', icon: Mail, hint: 'Gérer vos lettres' },
  { href: '/candidatures', label: 'Mes candidatures', icon: KanbanSquare, hint: 'Tableau Kanban' },
];

export function GlobalSearchModal({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const submit = () => {
    const q = value.trim();
    if (q) {
      router.push(`/offres?q=${encodeURIComponent(q)}`);
      onClose();
    }
  };

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Recherche globale"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E2E8F0]">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E2E8F0]">
          <Search size={18} className="text-[#94A3B8] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Rechercher un métier, une compétence…"
            className="flex-1 text-sm text-[#1E293B] placeholder:text-[#94A3B8] bg-transparent outline-none"
          />
          {value && (
            <button onClick={() => setValue('')} className="text-[#94A3B8] hover:text-[#1E293B] transition-colors">
              <X size={16} />
            </button>
          )}
          <kbd className="text-xs text-[#94A3B8] bg-[#F7F8FC] border border-[#E2E8F0] rounded px-1.5 py-0.5 font-mono">
            Échap
          </kbd>
        </div>

        {/* Content */}
        <div className="p-3">
          {value.trim() ? (
            /* Search action */
            <button
              onClick={submit}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent/5 text-left transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Search size={15} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1E293B]">
                  Rechercher <span className="text-accent">&ldquo;{value.trim()}&rdquo;</span>
                </p>
                <p className="text-xs text-[#94A3B8]">dans les offres d&apos;emploi</p>
              </div>
              <ArrowRight size={15} className="text-[#CBD5E1] group-hover:text-accent transition-colors shrink-0" />
            </button>
          ) : (
            /* Quick links */
            <div>
              <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider px-3 mb-1.5">Accès rapide</p>
              {QUICK_LINKS.map(({ href, label, icon: Icon, hint }) => (
                <button
                  key={href}
                  onClick={() => navigate(href)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F7F8FC] text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#F7F8FC] flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-[#64748B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E293B]">{label}</p>
                    <p className="text-xs text-[#94A3B8]">{hint}</p>
                  </div>
                  <ArrowRight size={15} className="text-[#CBD5E1] group-hover:text-accent transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-[#E2E8F0] flex items-center gap-3 text-xs text-[#94A3B8]">
          <span><kbd className="bg-[#F7F8FC] border border-[#E2E8F0] rounded px-1 py-0.5 font-mono">↵</kbd> Rechercher</span>
          <span><kbd className="bg-[#F7F8FC] border border-[#E2E8F0] rounded px-1 py-0.5 font-mono">⌘K</kbd> Ouvrir</span>
        </div>
      </div>
    </div>
  );
}
