'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';
import {
  KeyRound, Trash2, CheckCircle, XCircle, Loader2, Shield,
  AlertTriangle, Clock, ChevronLeft, Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BrowserViewer } from '@/components/BrowserViewer';

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPPORTED_SITES = [
  { id: 'indeed',    label: 'Indeed',     emoji: '🔵', authType: 'otp' as const,      loginUrl: 'https://fr.indeed.com/account/login' },
  { id: 'hellowork', label: 'HelloWork',  emoji: '👋', authType: 'otp' as const,      loginUrl: 'https://www.hellowork.com/fr-fr/connexion.html' },
  { id: 'meteojob',  label: 'Météo Job',  emoji: '☀️', authType: 'password' as const, loginUrl: 'https://candidat.meteojob.com' },
  { id: 'monster',   label: 'Monster',    emoji: '👾', authType: 'password' as const, loginUrl: 'https://www.monster.fr/connexion' },
  { id: 'linkedin',  label: 'LinkedIn',   emoji: '💼', authType: 'password' as const, loginUrl: 'https://www.linkedin.com/login' },
  { id: 'custom',    label: 'Autre site', emoji: '🌐', authType: 'password' as const, loginUrl: '' },
];

const SESSION_MAX_DAYS = 30;

// ─── Types ────────────────────────────────────────────────────────────────────

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

type Step = 'list' | 'select-site' | 'enter-credentials' | 'browser-session' | 'confirming';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSessionExpiring(lastLoginAt: string | null): boolean {
  if (!lastLoginAt) return true;
  return (Date.now() - new Date(lastLoginAt).getTime()) / 86_400_000 > SESSION_MAX_DAYS;
}



// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExternalAccountsPage() {
  const [accounts, setAccounts] = useState<ExternalAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [step, setStep] = useState<Step>('list');

  // Wizard state
  const [selectedSite, setSelectedSite] = useState<typeof SUPPORTED_SITES[0] | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customLoginUrl, setCustomLoginUrl] = useState('');
  const [wsUrl, setWsUrl] = useState('');
  const [sessionId, setSessionId] = useState('');

  // Feedback
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  // ── Load accounts ────────────────────────────────────────────────────────

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const res = await api.get<ExternalAccount[]>('/external-accounts');
      setAccounts(res.data);
    } catch {
      // silently ignore
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  // ── Reset wizard ─────────────────────────────────────────────────────────

  function resetWizard() {
    setStep('list');
    setSelectedSite(null);
    setEmail('');
    setPassword('');
    setCustomLoginUrl('');
    setWsUrl('');
    setSessionId('');
    setStatusMsg(null);
  }

  // ── Save credentials (password sites) ───────────────────────────────────

  async function handleSaveCredentials() {
    if (!selectedSite) return;
    setBusy(true);
    setStatusMsg({ type: 'info', text: 'Enregistrement...' });
    try {
      await api.post('/external-accounts', {
        site: selectedSite.id,
        siteLabel: selectedSite.label,
        loginUrl: selectedSite.id === 'custom' ? customLoginUrl : selectedSite.loginUrl,
        email,
        password,
      });
      toast.success('Compte enregistré');
      await loadAccounts();
      resetWizard();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setStatusMsg({ type: 'error', text: msg ?? 'Erreur lors de l\'enregistrement' });
    } finally {
      setBusy(false);
    }
  }

  // ── Ouvrir session navigateur (sites OTP) ─────────────────────────────

  async function handleStartSession() {
    if (!selectedSite) return;
    setBusy(true);
    setStatusMsg({ type: 'info', text: 'Démarrage du navigateur…' });
    try {
      const res = await api.post<{ sessionId: string; wsUrl: string }>('/external-accounts/start-session', { site: selectedSite.id, email });
      setWsUrl(res.data.wsUrl);
      setSessionId(res.data.sessionId);
      setStatusMsg(null);
      setStep('browser-session');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setStatusMsg({ type: 'error', text: msg ?? 'Impossible d\'ouvrir la fenêtre de connexion' });
    } finally {
      setBusy(false);
    }
  }

  // ── Capture cookies after user is logged in ───────────────────────────────

  async function handleCaptureCookies() {
    if (!selectedSite) return;
    setBusy(true);
    setStep('confirming');
    setStatusMsg({ type: 'info', text: 'Vérification de votre connexion…' });
    try {
      const res = await api.post<{ success: boolean; message: string }>('/external-accounts/capture-cookies', { site: selectedSite.id, sessionId });
      if (res.data.success) {
        setStatusMsg({ type: 'success', text: res.data.message });
        await loadAccounts();
        setTimeout(resetWizard, 3000);
      } else {
        setStatusMsg({ type: 'error', text: res.data.message });
        setStep('browser-session');
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Erreur lors de la capture. Réessayez.' });
      setStep('browser-session');
    } finally {
      setBusy(false);
    }
  }

  // ── Delete account ────────────────────────────────────────────────────────

  async function handleDelete(account: ExternalAccount) {
    if (!window.confirm(`Supprimer le compte ${account.siteLabel} (${account.email}) ?`)) return;
    try {
      await api.delete(`/external-accounts/${account.id}`);
      toast.success('Compte supprimé');
      setAccounts(prev => prev.filter(a => a.id !== account.id));
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }

  // ── Test password account ─────────────────────────────────────────────────

  const [testingId, setTestingId] = useState<string | null>(null);

  async function handleTest(account: ExternalAccount) {
    setTestingId(account.id);
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/external-accounts/${account.id}/test`);
      await loadAccounts();
      if (res.data.success) toast.success(`✅ Connexion réussie sur ${account.siteLabel}`);
      else toast.error(`❌ ${res.data.message}`);
    } catch {
      toast.error('Erreur lors du test de connexion');
    } finally {
      setTestingId(null);
    }
  }

  // ── Renew OTP session ─────────────────────────────────────────────────────

  function handleRenew(account: ExternalAccount) {
    const site = SUPPORTED_SITES.find(s => s.id === account.site);
    if (!site) return;
    setSelectedSite(site);
    setEmail(account.email);
    setStep('enter-credentials');
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const isOtp = selectedSite?.authType === 'otp';
  const canSaveCredentials = !!email &&
    password.length >= 6 &&
    (selectedSite?.id !== 'custom' || !!customLoginUrl);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-accent/10 rounded-xl">
            <KeyRound size={20} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Mes comptes externes</h1>
        </div>
        <p className="text-[#64748B] text-sm">
          Connectez vos comptes une fois. CareerPilot postule automatiquement sans vous redemander de vous reconnecter.
        </p>
        <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <Shield size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Credentials chiffrés AES-256. Sessions OTP (Indeed, HelloWork) stockées en tant que cookies chiffrés — jamais accessibles en clair.
          </p>
        </div>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm border ${
          statusMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
          statusMsg.type === 'error'   ? 'bg-red-50 border-red-200 text-red-700' :
                                         'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* ── LIST ─────────────────────────────────────────────────────────── */}
      {step === 'list' && (
        <>
          <div className="space-y-3 mb-6">
            {loadingAccounts && (
              <div className="flex justify-center py-8">
                <Loader2 size={22} className="animate-spin text-cyan-400" />
              </div>
            )}
            {!loadingAccounts && accounts.length === 0 && (
              <p className="text-[#64748B] text-sm text-center py-6">Aucun compte configuré.</p>
            )}

            {accounts.map(account => {
              const site = SUPPORTED_SITES.find(s => s.id === account.site);
              const isOtpAccount = site?.authType === 'otp';
              const expiring = isOtpAccount && isSessionExpiring(account.lastLoginAt);

              return (
                <div key={account.id} className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 gap-3" style={{ boxShadow: '0 1px 4px rgba(15,52,96,0.06)' }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#1E293B] text-sm">{account.siteLabel}</span>
                      {isOtpAccount && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">OTP</span>
                      )}
                      {account.isValid ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          <CheckCircle size={10} /> Connecté
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                          <XCircle size={10} /> Non vérifié
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5 truncate">{account.email}</p>
                    {!isOtpAccount && account.lastTestedAt && (
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Testé le {new Date(account.lastTestedAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {isOtpAccount && account.lastLoginAt && (
                      <p className="text-xs text-[#94A3B8] mt-0.5 flex items-center gap-1">
                        <Clock size={10} /> Session du {new Date(account.lastLoginAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    {expiring && (
                      <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                        <AlertTriangle size={10} /> Session expirée — cliquez Renouveler
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {isOtpAccount ? (
                      <button
                        onClick={() => handleRenew(account)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors font-medium"
                      >
                        Renouveler
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTest(account)}
                        disabled={testingId === account.id}
                        className="text-xs px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-accent hover:bg-accent/5 disabled:opacity-50 transition-colors font-medium"
                      >
                        {testingId === account.id ? <Loader2 size={12} className="animate-spin" /> : 'Tester'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(account)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setStep('select-site')}
            className="w-full border border-dashed border-[#CBD5E1] rounded-xl py-3 text-[#64748B] hover:border-accent/50 hover:text-accent transition-colors text-sm flex items-center justify-center gap-2 bg-white"
          >
            <Plus size={15} /> Connecter un compte
          </button>
        </>
      )}

      {/* ── SELECT SITE ──────────────────────────────────────────────────── */}
      {step === 'select-site' && (
        <div className="space-y-3">
          <p className="text-sm text-[#64748B] mb-2">Quel site souhaitez-vous connecter ?</p>
          {SUPPORTED_SITES.map(site => (
            <button
              key={site.id}
              onClick={() => { setSelectedSite(site); setStep('enter-credentials'); }}
              className="w-full flex items-center gap-3 bg-white hover:bg-[#F7F8FC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-left transition-colors"
            >
              <span className="text-2xl">{site.emoji}</span>
              <div>
                <div className="font-semibold text-[#1E293B] text-sm">{site.label}</div>
                <div className="text-xs text-[#64748B]">
                  {site.authType === 'otp' ? 'Connexion par code email (OTP)' : 'Email + mot de passe'}
                </div>
              </div>
            </button>
          ))}
          <button onClick={resetWizard} className="w-full text-center text-sm text-[#64748B] hover:text-[#1E293B] py-2 flex items-center justify-center gap-1 transition-colors">
            <ChevronLeft size={14} /> Retour
          </button>
        </div>
      )}

      {/* ── ENTER CREDENTIALS ────────────────────────────────────────────── */}
      {step === 'enter-credentials' && selectedSite && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">{selectedSite.emoji}</span>
            <h2 className="text-lg font-semibold text-[#1E293B]">Connexion {selectedSite.label}</h2>
          </div>

          {isOtp && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              <strong>{selectedSite.label}</strong> envoie un code de vérification par email.
              Cliquez sur "Ouvrir {selectedSite.label}" — une fenêtre apparaîtra ici même.
              Connectez-vous normalement, CareerPilot capture votre session automatiquement.
            </div>
          )}

          {selectedSite.id === 'custom' && (
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">URL de connexion</label>
              <input
                type="url"
                placeholder="https://site.com/login"
                value={customLoginUrl}
                onChange={e => setCustomLoginUrl(e.target.value)}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#1E293B] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">Email</label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="off"
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#1E293B] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>

          {!isOtp && (
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#1E293B] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
            </div>
          )}

          <div className="flex gap-2">
            {isOtp ? (
              <button
                onClick={handleStartSession}
                disabled={!email || busy}
                className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {busy ? <><Loader2 size={14} className="animate-spin" /> Préparation…</> : `🔐 Ouvrir ${selectedSite.label}`}
              </button>
            ) : (
              <button
                onClick={handleSaveCredentials}
                disabled={!canSaveCredentials || busy}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {busy ? <><Loader2 size={14} className="animate-spin" /> Enregistrement…</> : 'Enregistrer'}
              </button>
            )}
            <button
              onClick={() => setStep('select-site')}
              className="px-4 py-3 border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] text-sm transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      )}

      {/* ── BROWSER SESSION (stream WebSocket canvas) ────────────────────── */}
      {step === 'browser-session' && selectedSite && wsUrl && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedSite.emoji}</span>
            <div>
              <h2 className="text-lg font-semibold text-[#1E293B]">Connectez-vous à {selectedSite.label}</h2>
              <p className="text-xs text-[#64748B]">
                Entrez votre email, attendez le code OTP, saisissez-le. Puis cliquez sur &quot;J&apos;ai fini&quot;.
              </p>
            </div>
          </div>

          <BrowserViewer
            wsUrl={wsUrl}
            sessionId={sessionId}
            onConfirm={handleCaptureCookies}
            loading={busy}
          />
        </div>
      )}

      {/* ── CONFIRMING ───────────────────────────────────────────────────── */}
      {step === 'confirming' && (
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl animate-pulse">⏳</div>
          <p className="text-[#64748B]">Vérification de votre connexion en cours…</p>
        </div>
      )}

    </div>
  );
}
