import { create } from 'zustand';
import { api, setAccessToken } from '@/lib/axios';
import type { User } from '@/types';

// ─── Dev mock auth (used when backend is unavailable) ────────────────────────
const MOCK_STORE_KEY = 'cp_mock_users';
const MOCK_SESSION_KEY = 'cp_mock_session';

function getMockUsers(): Record<string, User & { password: string }> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(MOCK_STORE_KEY) ?? '{}'); } catch { return {}; }
}
function saveMockUsers(users: Record<string, User & { password: string }>) {
  if (typeof window !== 'undefined') localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(users));
}
function getMockSession(): User | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(MOCK_SESSION_KEY) ?? 'null'); } catch { return null; }
}
function saveMockSession(user: User | null) {
  if (typeof window !== 'undefined') {
    if (user) localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(MOCK_SESSION_KEY);
  }
}
const isMockMode = () => typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL;

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  login: async (email, password) => {
    set({ isLoading: true });
    if (isMockMode()) {
      const users = getMockUsers();
      const entry = users[email.toLowerCase()];
      if (!entry || entry.password !== password) {
        set({ isLoading: false });
        throw new Error('Email ou mot de passe incorrect');
      }
      const { password: _p, ...user } = entry;
      saveMockSession(user);
      setAccessToken('mock-token');
      // Set a non-httpOnly cookie so middleware can detect mock session
      document.cookie = 'cp_mock=1; path=/; max-age=604800; SameSite=Strict';
      set({ user, isLoading: false });
      window.location.href = '/dashboard';
      return;
    }
    try {
      const res = await api.post('/auth/login', { email, password });
      setAccessToken(res.data.accessToken);
      const me = await api.get('/users/me');
      set({ user: me.data, isLoading: false });
      window.location.href = '/dashboard';
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (firstName, lastName, email, password) => {
    set({ isLoading: true });
    if (isMockMode()) {
      const users = getMockUsers();
      const key = email.toLowerCase();
      if (users[key]) {
        set({ isLoading: false });
        throw new Error('Email déjà utilisé');
      }
      const user: User = {
        id: `mock_${Date.now()}`,
        firstName,
        lastName,
        email,
        plan: 'FREE',
        emailVerified: false,
        onboardingDone: false,
        targetContract: [],
        targetSectors: [],
        targetLocations: [],
        createdAt: new Date().toISOString(),
      };
      users[key] = { ...user, password };
      saveMockUsers(users);
      saveMockSession(user);
      setAccessToken('mock-token');
      // Set a non-httpOnly cookie so middleware can detect mock session
      document.cookie = 'cp_mock=1; path=/; max-age=604800; SameSite=Strict';
      set({ user, isLoading: false });
      window.location.href = '/dashboard';
      return;
    }
    try {
      const res = await api.post('/auth/register', { firstName, lastName, email, password });
      setAccessToken(res.data.accessToken);
      const me = await api.get('/users/me');
      set({ user: me.data, isLoading: false });
      window.location.href = '/dashboard';
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    if (isMockMode()) {
      saveMockSession(null);
      setAccessToken(null);
      document.cookie = 'cp_mock=; path=/; max-age=0';
      set({ user: null });
      window.location.href = '/connexion';
      return;
    }
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      set({ user: null });
      window.location.href = '/connexion';
    }
  },

  fetchMe: async () => {
    if (isMockMode()) {
      const user = getMockSession();
      if (user) setAccessToken('mock-token');
      set({ user, isInitialized: true });
      return;
    }
    try {
      const res = await api.get('/users/me');
      set({ user: res.data, isInitialized: true });
    } catch {
      set({ user: null, isInitialized: true });
    }
  },

  updateUser: (updates) =>
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
}));
