'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import toast from 'react-hot-toast';
import { KeyRound, Trash2, CheckCircle, XCircle, Plus, Loader2, Shield } from 'lucide-react';

const SUPPORTED_SITES = [
  { id: 'indeed',    label: 'Indeed',    loginUrl: 'https://fr.indeed.com/account/login' },
  { id: 'meteojob', label: 'Météo Job', loginUrl: 'https://www.meteojob.com/connexion' },
  { id: 'monster',  label: 'Monster',   loginUrl: 'https://www.monster.fr/connexion' },
  { id: 'linkedin', label: 'LinkedIn',  loginUrl: 'https://www.linkedin.com/login' },
  { id: 'custom',   label: 'Autre site', loginUrl: '' },
];

interface ExternalAccount {
  id: string;
  site: string;
  siteLabel: string;
  loginUrl: string;
  email: string;
  isValid: boolean;
  lastTestedAt: string | null;
}

interface FormState {
  site: string;
  email: string;
  password: string;
  loginUrl: string;
}

const defaultForm: FormState = { site: 'indeed', email: '', password: '', loginUrl: '' };

export default function ExternalAccountsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: accounts = [], isLoading } = useQuery<ExternalAccount[]>({
    queryKey: ['external-accounts'],
    queryFn: () => api.get('/external-accounts').then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (payload: {
      site: string;
      siteLabel: string;
      loginUrl: string;
      email: string;
      password: string;
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['external-accounts'] });
      toast.success('Compte supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  async function handleTest(account: ExternalAccount) {
    setTestingId(account.id);
    try {
      const { data } = await api.post(`/external-accounts/${account.id}/test`);
      qc.invalidateQueries({ queryKey: ['external-accounts'] });
      if (data.success) {
        toast.success(`✅ Connexion réussie sur ${account.siteLabel}`);
      } else {
        toast.error(`❌ Échec : ${data.message}`);
      }
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
      password: form.password,
    });
  }

  const selectedSite = SUPPORTED_SITES.find((s) => s.id === form.site);
  const canSubmit = form.email && form.password.length >= 6 && (form.site !== 'custom' || form.loginUrl);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-cyan-500/10 rounded-xl">
            <KeyRound size={20} className="text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mes comptes externes</h1>
        </div>
        <p className="text-[#94A3B8] text-sm leading-relaxed">
          Configurez vos identifiants pour que CareerPilot postule automatiquement sans vous demander de vous reconnecter.
        </p>

        {/* Security notice */}
        <div className="mt-4 flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <Shield size={15} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300">
            Vos mots de passe sont chiffrés avec AES-256 avant stockage et ne sont jamais accessibles en clair.
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

        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-white text-sm">{account.siteLabel}</span>
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
              {account.lastTestedAt && (
                <p className="text-xs text-[#475569] mt-0.5">
                  Testé le {new Date(account.lastTestedAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>

            <div className="flex gap-2 shrink-0 ml-3">
              <button
                onClick={() => handleTest(account)}
                disabled={testingId === account.id}
                className="text-xs px-3 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50 transition-colors"
              >
                {testingId === account.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  'Tester'
                )}
              </button>
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
        ))}
      </div>

      {/* Add form */}
      {showForm ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-white mb-1">Ajouter un compte</h3>

          {/* Site selector */}
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1">Site</label>
            <select
              value={form.site}
              onChange={(e) => setForm((f) => ({ ...f, site: e.target.value, loginUrl: '' }))}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/60"
            >
              {SUPPORTED_SITES.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#1A1F2E]">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom login URL */}
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

          {form.site !== 'custom' && selectedSite && (
            <p className="text-xs text-[#475569]">URL de connexion : {selectedSite.loginUrl}</p>
          )}

          {/* Email */}
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

          {/* Password */}
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

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={!canSubmit || addMutation.isPending}
              className="flex-1 bg-cyan-500 text-black font-medium py-2 rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {addMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Enregistrement…
                </span>
              ) : (
                'Enregistrer'
              )}
            </button>
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
