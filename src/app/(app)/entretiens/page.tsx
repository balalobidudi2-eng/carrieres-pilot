'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Star,
  BookOpen,
  Play,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/axios';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const SECTORS = ['Tech', 'Design', 'Marketing', 'Finance', 'Santé', 'Retail', 'RH', 'Commercial'];
const LEVELS = ['Junior', 'Confirmé', 'Senior', 'Lead', 'Manager'];

interface Question {
  id: string;
  question: string;
  category: 'behavioral' | 'technical' | 'situational';
  tip: string;
  starAnswer?: string;
}

const categoryLabel = (c: Question['category']) =>
  ({ behavioral: 'Comportemental', technical: 'Technique', situational: 'Situationnel' }[c]);
const categoryVariant = (c: Question['category']): 'primary' | 'success' | 'warning' =>
  ({ behavioral: 'primary', technical: 'success', situational: 'warning' } as const)[c];

export default function EntretiensPage() {
  const { user } = useAuthStore();
  const [sector, setSector] = useState('Tech');
  const [level, setLevel] = useState('Confirmé');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: questions = [], isLoading, refetch } = useQuery<Question[]>({
    queryKey: ['interview-questions', sector, level],
    queryFn: () =>
      api.post('/interviews/questions', { sector, level }).then((r) => r.data.questions ?? r.data),
    retry: false,
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ question, answer }: { question: string; answer: string }) =>
      api.post('/interviews/feedback', { question, answer }).then((r) => r.data.feedback),
    onSuccess: (fb: string) => setFeedback(fb),
    onError: () => toast.error('Erreur lors de l\'analyse'),
  });

  const list = questions.length > 0 ? questions : [];

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="space-y-6 max-w-[900px]">
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#1E293B]">Préparation aux entretiens</h2>
          <p className="text-sm text-[#64748B] mt-0.5">Questions IA adaptées à votre profil et secteur</p>
        </div>
        <Button onClick={() => { setCurrentQ(0); setUserAnswer(''); setFeedback(null); setSimulateOpen(true); }} disabled={user?.plan === 'FREE'}>
          <Play size={15} />
          Simuler un entretien
        </Button>
      </motion.div>

      {/* FREE plan gate */}
      {user?.plan === 'FREE' && (
        <motion.div variants={fadeInUp} className="bg-amber-50 border border-amber-200 rounded-card p-8 text-center">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic size={26} className="text-amber-500" />
          </div>
          <h3 className="font-heading font-bold text-lg text-[#1E293B] mb-1">Fonctionnalité réservée aux plans payants</h3>
          <p className="text-sm text-[#64748B] max-w-md mx-auto">
            La préparation aux entretiens avec 2 séries de 10 questions IA personnalisées est disponible à partir du plan <strong>Pro</strong>.
          </p>
          <Button className="mt-5" onClick={() => window.location.href = '/abonnement'}>
            Passer au plan Pro
          </Button>
        </motion.div>
      )}

      {/* Filters — PRO/EXPERT only */}
      {user?.plan !== 'FREE' && (<>
      <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 items-center p-4 bg-white rounded-card border border-[#E2E8F0]" style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}>
        <div>
          <p className="text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wide">Secteur</p>
          <div className="flex flex-wrap gap-1.5">
            {SECTORS.map((s) => (
              <button
                key={s}
                onClick={() => setSector(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  sector === s ? 'bg-accent text-white' : 'bg-[#F7F8FC] text-[#64748B] hover:bg-accent/10 hover:text-accent'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="ml-auto">
          <p className="text-xs font-semibold text-[#64748B] mb-1.5 uppercase tracking-wide">Niveau</p>
          <div className="flex gap-1.5">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  level === l ? 'bg-primary text-white' : 'bg-[#F7F8FC] text-[#64748B] hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} loading={isLoading}>
          <RefreshCw size={13} />
          Régénérer
        </Button>
      </motion.div>

      {/* Questions accordion */}
      <div className="space-y-3">
        {list.map((q, i) => (
          <motion.div
            key={q.id}
            variants={fadeInUp}
            className="bg-white rounded-card border border-[#E2E8F0] overflow-hidden"
            style={{ boxShadow: '0 4px 32px rgba(15,52,96,0.08)' }}
          >
            <button
              className="w-full p-5 flex items-center gap-4 text-left hover:bg-[#F7F8FC]/50 transition-colors"
              onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
            >
              <span className="w-8 h-8 rounded-full bg-accent/10 text-accent text-sm font-extrabold font-heading flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-[#1E293B]">{q.question}</p>
              </div>
              <Badge variant={categoryVariant(q.category)}>{categoryLabel(q.category)}</Badge>
              {expandedId === q.id ? (
                <ChevronUp size={16} className="text-[#94A3B8] shrink-0" />
              ) : (
                <ChevronDown size={16} className="text-[#94A3B8] shrink-0" />
              )}
            </button>

            <AnimatePresence>
              {expandedId === q.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="border-t border-[#E2E8F0] px-5 pb-5 pt-4 space-y-4"
                >
                  {/* Tip */}
                  <div className="flex gap-2 bg-amber-50/70 border border-amber-100 rounded-btn p-3">
                    <Star size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">{q.tip}</p>
                  </div>

                  {/* STAR answer */}
                  {q.starAnswer && (
                    <div>
                      <p className="font-semibold text-sm text-[#1E293B] flex items-center gap-1.5 mb-2">
                        <BookOpen size={14} className="text-accent" />
                        Exemple de réponse STAR
                      </p>
                      <div className="bg-[#F7F8FC] rounded-btn p-4 text-xs text-[#64748B] leading-relaxed whitespace-pre-line">
                        {q.starAnswer}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentQ(list.indexOf(q));
                      setUserAnswer('');
                      setFeedback(null);
                      setSimulateOpen(true);
                    }}
                  >
                    <Mic size={13} />
                    Répondre à cette question
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Simulate Modal */}
      <Modal open={simulateOpen} onClose={() => setSimulateOpen(false)} title="Simulation d'entretien" size="lg">
        <div className="mt-2 space-y-4">
          {/* Progress */}
          <div className="flex items-center gap-3">
            {list.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i < currentQ ? 'bg-accent' : i === currentQ ? 'bg-accent/50' : 'bg-[#E2E8F0]'
                }`}
              />
            ))}
          </div>

          <div className="bg-[#F7F8FC] rounded-card p-4">
            <p className="text-xs font-semibold text-accent mb-1 uppercase tracking-wide">
              Question {currentQ + 1} / {Math.min(5, list.length)}
            </p>
            <p className="font-semibold text-[#1E293B]">{list[currentQ]?.question}</p>
            {list[currentQ]?.tip && (
              <p className="text-xs text-[#64748B] mt-2 italic">{list[currentQ].tip}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1E293B] mb-1.5">Votre réponse</label>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              rows={5}
              placeholder="Répondez comme lors d'un vrai entretien…"
              className="w-full p-3 border border-[#E2E8F0] rounded-btn text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => feedbackMutation.mutate({ question: list[currentQ].question, answer: userAnswer })}
              loading={feedbackMutation.isPending}
              disabled={userAnswer.length < 20}
            >
              <Sparkles size={15} />
              Analyser ma réponse
            </Button>
            {currentQ < Math.min(4, list.length - 1) && (
              <Button
                variant="outline"
                onClick={() => { setCurrentQ((c) => c + 1); setUserAnswer(''); setFeedback(null); }}
              >
                Suivant
              </Button>
            )}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-accent/5 border border-accent/20 rounded-card p-4"
              >
                <p className="font-semibold text-sm text-accent flex items-center gap-1.5 mb-2">
                  <Sparkles size={14} />
                  Analyse IA
                </p>
                <p className="text-sm text-[#1E293B] leading-relaxed whitespace-pre-line">{feedback}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>
      </>)}
    </motion.div>
  );
}
