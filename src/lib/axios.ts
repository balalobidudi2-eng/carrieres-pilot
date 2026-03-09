import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send httpOnly refresh cookie
});

// In-memory access token (not stored in localStorage for XSS protection)
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// Request interceptor — attach Bearer token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Flag to prevent refresh loops
let isRefreshing = false;

// Response interceptor — refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    // Don't retry logout or refresh calls themselves
    const isAuthRoute = original.url?.includes('/auth/logout') || original.url?.includes('/auth/refresh');
    if (error.response?.status === 401 && !original._retry && !isAuthRoute && !isRefreshing) {
      original._retry = true;
      isRefreshing = true;
      try {
        const res = await axios.post(
          '/api/auth/refresh',
          {},
          { withCredentials: true },
        );
        const newToken = res.data.accessToken as string;
        setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        setAccessToken(null);
        // Clear the logged-in flag cookie to prevent middleware redirect loop
        document.cookie = 'cp_logged=; path=/; max-age=0';
        // Only redirect if we're not already on a public page
        if (!window.location.pathname.startsWith('/connexion') && !window.location.pathname.startsWith('/inscription')) {
          window.location.href = '/connexion';
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);
