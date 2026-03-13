'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  KeyRound, Trash2, CheckCircle, XCircle, Plus, Loader2, Shield,
  AlertTriangle, Terminal, ExternalLink, Clock,
} from 'lucide-react';

const SUPPORTED_SITES = [
  {
    id: 'indeed',
    label: 'Indeed',
    loginUrl: 'https://fr.indeed.com/account/login',
    authType: 'otp' as const,
    note: "Indeed envoie un code par email (pas de mot de passe). Vous devez capturer la session manuellement.",
  },
  {
    id: 'hellowork',
    label: 'HelloWork',
    loginUrl: 'https://www.hellowork.com/fr-fr/connexion.html',
    authType: 'otp' as const,
    note: "HelloWork envoie un code par email. Vous devez capturer la session manuellement.",
  },
  {
    id: 'meteojob',
    label: 'Météo Job',
    loginUrl: 'https://www.meteojob.com/connexion',
    authType: 'password' as const,
    note: null,
  },
  {
    id: 'monster',
    label: 'Monster',
    loginUrl: 'https://www.monster.fr/connexion',
    authType: 'password' as const,
    note: null,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    loginUrl: 'https://www.linkedin.com/login',
    authType: 'password' as const,
    note: null,
  },
  {
    id: 'custom',
    label: 'Autre site',
    loginUrl: '',
    authType: 'password' as const,
    note: null,
  },
];

const SESSION_MAX_AGE_DAYS = 30;

function isSessionExpiringSoon(lastLoginAt: string | null): boolean {
  if (!lastLoginAt) return true;
  const daysSince = (Date.now() - new Date(lastLoginAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > SESSION_MAX_AGE_DAYS;
}

interface ExternalAccount {
  id: string;
  site: string;
  siteLabel: string;
  loginUrl: string;
  email: string;
  isValid: boolean;
  lastTestedAt: string | null;
  lastLoginAt: string | null;
}

interface FormState {
  site: string;
  email: string;
  password: string;
  loginUrl: string;
}

const defaultForm: FormState = { site: 'indeed', email: '', password: '', loginUrl: '' };

// ─── Modal: manual OTP session capture ────────────────────────────────────────

interface CaptureModalProps {
  site: string;
  email: string;
  loginUrl: string;
  siteLabel: string;
  onClose: () => void;
  onSessionSaved: () => void;
}

function CaptureSessionModal({ site, email, loginUrl, siteLabel, onClose, onSessionSaved }: CaptureModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const command = `node scripts/capture-session.cjs ${site} --email "${email}"`;

  async function handleManualLoginLocal() {
    setIsConnecting(true);
    setStatusMsg(`Ouverture de ${siteLabel}… Connectez-vous dans la fenêtre qui s'ouvre, puis attendez.`);
    try {
      const { data } = await api.post('/external-accounts/manual-login', { site, email, loginUrl });
      if (data.success) {
        toast.success(data.message);
        onSessionSaved();
        onClose();
      } else {
        setStatusMsg('❌ ' + data.message);
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setStatusMsg('❌ ' + (msg ?? 'Erreur lors de la connexion'));
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-[#1A1F2E] border border-white/10 rounded-2xl p-6 max-w-lg w-full space-y-4">
        <div className="flex items-center gap-2">
          <Terminal size={18} className="text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Connexion à {siteLabel}</h3>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm">
          <p className="font-medium text-amber-300 mb-1">⚠️ {siteLabel} n'utilise pas de mot de passe</p>
          <p className="text-amber-400/80 text-xs">
            {siteLabel} envoie un code OTP par email. Vous devez vous connecter manuellement une fois —
            CareerPilot sauvegarde ensuite votre session pour postuler automatiquement.
          </p>
        </div>

        {isLocal ? (
          /* Dev: headless:false → browser opens on screen */
          <div className="space-y-3">
            <p className="text-sm text-[#94A3B8]">
              Un navigateur va s'ouvrir. Connectez-vous à {siteLabel} normalement
              (email → code OTP → connexion). CareerPilot capture automatiquement les cookies.
            </p>
            {statusMsg && (
              <p className="text-xs text-[#94A3B8] bg-black/30 rounded-lg px-3 py-2 leading-relaxed">{statusMsg}</p>
            )}
            <button
              onClick={handleManualLoginLocal}
              disabled={isConnecting}
              className="w-full bg-purple-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-purple-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isConnecting ? <><Loader2 size={14} className="animate-spin" /> Connexion en cours… (max 2 min)</> : `🔐 Ouvrir ${siteLabel} et capturer la session`}
            </button>
          </div>
        ) : (
          /* Production: guide to run local script */
          <div className="space-y-4">
            <p className="text-sm text-[#94A3B8]">
              La capture de session nécessite un navigateur local. Lancez cette commande
              dans le terminal du projet CareerPilot :
            </p>

            <div>
              <p className="text-xs text-[#64748B] font-medium uppercase tracking-wider mb-1.5">
                1 — Commande à lancer localement
              </p>
              <div className="bg-black/60 rounded-lg px-4 py-3 flex items-start gap-3">
                <Terminal size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                <code className="text-xs text-cyan-300 break-all font-mono flex-1">{command}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(command); toast.success('Copié !'); }}
                  className="text-[#64748B] hover:text-cyan-400 transition-colors shrink-0 text-lg leading-none"
                  title="Copier"
                >📋</button>
              </div>
            </div>

            <div>
              <p className="text-xs text-[#64748B] font-medium uppercase tracking-wider mb-1.5">
                2 — Un navigateur s'ouvre
              </p>
              <p className="text-xs text-[#475569]">
                Connectez-vous à {siteLabel} (email + code OTP). Le script capture les cookies
                et les envoie directement à CareerPilot.
              </p>
            </div>

            <a
              href={loginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink size={11} /> Ouvrir {siteLabel} dans un onglet (pour vérifier votre session)
            </a>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-white/20 rounded-xl text-[#94A3B8] hover:text-white transition-colors text-sm"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ExternalAccountsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [captureModal, setCaptureModal] = useState<null | {
    site: string; email: string; loginUrl: string; siteLabel: string;
  }>(null);

  const { data: accounts = [], isLoading } = useQuery<ExternalAccount[]>({
    queryKey: ['external-accounts'],
    queryFn: () => api.get('/external-accounts').then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (payload: {
      site: string; siteLabel: string; loginUrl: string; email: string; password?: string;
    }) => api.post('/external-accounts', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['external-accounts'] });
      setShowForm(false);
      setForm(defaultForm);
      toast.success('Compte enregistré');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erreur';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/external-accounts/${id}`).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['external-accounts'] }); toast.success('Compte supprimé'); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  async function handleTest(account: ExternalAccount) {
    setTestingId(account.id);
    try {
      const { data } = await api.post(`/external-accounts/${account.id}/test`);
      qc.invalidateQueries({ queryKey: ['external-accounts'] });
      if (data.success) toast.success(`✅ Connexion réussie sur ${account.siteLabel}`);
      else toast.error(`❌ Échec : ${data.message}`);
    } catch {
      toast.error('Erreur lors du test de connexion');
    } finally {
      setTestingId(null);
    }
  }

  function handleAdd() {
    const siteConfig = SUPPORTED_SITES.find((s) => s.id === form.site);
    addMutation.mutate({
      site: form.site,
      siteLabel: siteConfig?.label ?? form.site,
      loginUrl: form.site === 'custom' ? form.loginUrl : (siteConfig?.loginUrl ?? ''),
      email: form.email,
      ...(selectedSite?.authType === 'password' && { password: form.password }),
    });
  }

  function handleOtpConnect() {
    if (!form.email) { toast.error('Entrez votre email d\'abord'); return; }
    const siteConfig = SUPPORTED_SITES.find((s) => s.id === form.site);
    setCaptureModal({
      site: form.site,
      email: form.email,
      loginUrl: form.site === 'custom' ? form.loginUrl : (siteConfig?.loginUrl ?? ''),
      siteLabel: siteConfig?.label ?? form.site,
    });
  }

  const selectedSite = SUPPORTED_SITES.find((s) => s.id === form.site);
  const isOtp = selectedSite?.authType === 'otp';
  const canSubmit = !!form.email &&
    (form.site !== 'custom' || !!form.loginUrl) &&
    (isOtp || form.password.length >= 6);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {captureModal && (
        <CaptureSessionModal
          {...captureModal}
          onClose={() => setCaptureModal(null)}
          onSessionSaved={() => {
            qc.invalidateQueries({ queryKey: ['external-accounts'] });
            setShowForm(false);
            setForm(defaultForm);
          }}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-500/10 rounded-xl">
            <KeyRound size={20} className="text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mes comptes externes</h1>
        </div>
        <p className="text-[#94A3B8] text-sm leading-relaxed">
          Configurez vos sessions pour que CareerPilot postule automatiquement sans vous demander de vous reconnecter.
        </p>
        <div className="mt-4 flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <Shield size={15} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300">
            Mots de passe chiffrés AES-256. Sessions OTP (Indeed, HelloWork) stockées en tant que cookies chiffrés — jamais accessibles en clair.
          </p>
        </div>
      </div>

      {/* Account list */}
      <div className="space-y-3 mb-6">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-cyan-400" />
          </div>
        )}
        {!isLoading && accounts.length === 0 && (
          <p className="text-[#64748B] text-sm text-center py-6">
            Aucun compte configuré. Ajoutez vos premiers identifiants ci-dessous.
          </p>
        )}

        {accounts.map((account) => {
          const siteConfig = SUPPORTED_SITES.find((s) => s.id === account.site);
          const isOtpAccount = siteConfig?.authType === 'otp';
          const sessionExpiring = isOtpAccount && account.isValid && isSessionExpiringSoon(account.lastLoginAt);

          return (
            <div key={account.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white text-sm">{account.siteLabel}</span>
                  {isOtpAccount && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
                      OTP
                    </span>
                  )}
                  {account.isValid ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                      <CheckCircle size={11} /> Connecté
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">
                      <XCircle size={11} /> Non vérifié
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#64748B] mt-0.5 truncate">{account.email}</p>
                {!isOtpAccount && account.lastTestedAt && (
                  <p className="text-xs text-[#475569] mt-0.5">
                    Testé le {new Date(account.lastTestedAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
                {isOtpAccount && account.lastLoginAt && (
                  <p className="text-xs text-[#475569] mt-0.5 flex items-center gap-1">
                    <Clock size={10} /> Session du {new Date(account.lastLoginAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
                {sessionExpiring && (
                  <p className="text-xs text-amber-400 mt-0.5 flex items-center gap-1">
                    <AlertTriangle size={10} /> Session peut être expirée — renouvelez
                  </p>
                )}
              </div>

              <div className="flex gap-2 shrink-0 ml-3">
                {!isOtpAccount && (
                  <button
                    onClick={() => handleTest(account)}
                    disabled={testingId === account.id}
                    className="text-xs px-3 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50 transition-colors"
                  >
                    {testingId === account.id ? <Loader2 size={12} className="animate-spin" /> : 'Tester'}
                  </button>
                )}
                {isOtpAccount && (
                  <button
                    onClick={() => setCaptureModal({
                      site: account.site,
                      email: account.email,
                      loginUrl: account.loginUrl,
                      siteLabel: account.siteLabel,
                    })}
                    className="text-xs px-3 py-1.5 rounded-lg border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition-colors"
                  >
                    Renouveler
                  </button>
                )}
                <button
                  onClick={() => {
                    if (window.confirm(`Supprimer le compte ${account.siteLabel} ?`)) {
                      deleteMutation.mutate(account.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add form */}
      {showForm ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-white mb-1">Ajouter un compte</h3>

          <div>
            <label className="block text-xs text-[#94A3B8] mb-1">Site</label>
            <select
              value={form.site}
              onChange={(e) => setForm((f) => ({ ...f, site: e.target.value, loginUrl: '', password: '' }))}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/60"
            >
              {SUPPORTED_SITES.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#1A1F2E]">{s.label}</option>
              ))}
            </select>
          </div>

          {/* OTP notice */}
          {isOtp && selectedSite?.note && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
              <span className="text-amber-300 text-xs">{selectedSite.note}</span>
            </div>
          )}

          {form.site === 'custom' && (
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1">URL de connexion</label>
              <input
                type="url"
                placeholder="https://site.com/login"
                value={form.loginUrl}
                onChange={(e) => setForm((f) => ({ ...f, loginUrl: e.target.value }))}
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-[#475569] focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          )}

          {form.site !== 'custom' && !isOtp && selectedSite && (
            <p className="text-xs text-[#475569]">URL de connexion : {selectedSite.loginUrl}</p>
          )}

          <div>
            <label className="block text-xs text-[#94A3B8] mb-1">Email</label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              autoComplete="off"
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-[#475569] focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {/* Password only for non-OTP sites */}
          {!isOtp && (
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1">Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                autoComplete="new-password"
                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-[#475569] focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {isOtp ? (
              <button
                onClick={handleOtpConnect}
                disabled={!form.email}
                className="flex-1 bg-purple-600 text-white font-medium py-2 rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Terminal size={14} /> Se connecter à {selectedSite?.label}
              </button>
            ) : (
              <button
                onClick={handleAdd}
                disabled={!canSubmit || addMutation.isPending}
                className="flex-1 bg-cyan-500 text-black font-medium py-2 rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {addMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Enregistrement…
                  </span>
                ) : 'Enregistrer'}
              </button>
            )}
            <button
              onClick={() => { setShowForm(false); setForm(defaultForm); }}
              className="px-4 py-2 border border-white/20 rounded-lg text-[#94A3B8] hover:text-white transition-colors text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full border border-dashed border-white/20 rounded-xl py-3 text-[#64748B] hover:border-cyan-500/50 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Plus size={16} /> Ajouter un compte
        </button>
      )}
    </div>
  );
}

