import { create } from 'zustand';
import { api, setAccessToken } from '@/lib/axios';
import type { User } from '@/types';

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
      const me = await api.get('/users/me');
      set({ user: me.data, isLoading: false });
      window.location.href = '/dashboard';
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
    } catch {
      set({ user: null, isInitialized: true });
    }
  },

  updateUser: (updates) =>
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
}));
