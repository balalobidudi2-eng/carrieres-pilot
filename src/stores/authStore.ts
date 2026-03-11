import { create } from 'zustand';
import { api, setAccessToken } from '@/lib/axios';
import type { User } from '@/types';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;

  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
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
    try {
      const res = await api.post('/auth/login', { email, password });
      setAccessToken(res.data.accessToken);
      if (res.data.accountRecovered) {
        toast.success('Votre demande de suppression a été annulée. Bienvenue de retour !', { duration: 6000 });
      }
      const me = await api.get('/users/me');
      set({ user: me.data, isLoading: false });
      window.location.href = me.data?.adminLevel ? '/admin/dashboard' : '/dashboard';
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginDemo: async () => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/demo');
      setAccessToken(res.data.accessToken);
      set({ user: res.data.user, isLoading: false });
      window.location.href = '/dashboard';
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (firstName, lastName, email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', { firstName, lastName, email, password });
      set({ isLoading: false });
      if (res.data.emailPending) {
        // Account created — user must verify email before logging in
        let url = `/verifier-email?email=${encodeURIComponent(email)}`;
        // In dev, pass the preview/verify link so the page can surface it directly
        if (res.data.devPreviewUrl) {
          url += `&dev_link=${encodeURIComponent(res.data.devPreviewUrl)}`;
        }
        window.location.href = url;
        return;
      }
      // Fallback: should not happen with new backend
      window.location.href = '/connexion';
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore backend errors — still clear local state
    }
    setAccessToken(null);
    set({ user: null, isInitialized: false });
    // Force hard navigation to clear all in-memory state
    window.location.href = '/connexion';
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/users/me');
      set({ user: res.data, isInitialized: true });
    } catch (error: unknown) {
      // Only log out if the server explicitly says we are not authenticated
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        if (typeof document !== 'undefined') {
          document.cookie = 'cp_logged=; path=/; max-age=0';
        }
        set({ user: null, isInitialized: true });
      } else {
        // Network / server error — keep current user state, just mark initialized
        set((state) => ({ isInitialized: true, user: state.user }));
      }
    }
  },

  updateUser: (updates) =>
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
}));
