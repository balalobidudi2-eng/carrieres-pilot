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

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
// Queue of pending requests waiting for the refresh to complete
let pendingQueue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

// Response interceptor — refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    // Don't retry logout or refresh calls themselves
    const isAuthRoute =
      original.url?.includes('/auth/logout') || original.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise<unknown>((resolve, reject) => {
          pendingQueue.push((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            } else {
              reject(error);
            }
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = res.data.accessToken as string;
        setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        flushQueue(newToken);
        return api(original);
      } catch (refreshError) {
        flushQueue(null);
        // Only log out if the refresh endpoint explicitly rejects (401/403).
        // DO NOT log out on network errors (mobile offline, timeout, DNS failure).
        const refreshStatus = (refreshError as { response?: { status?: number } })?.response?.status;
        if (refreshStatus === 401 || refreshStatus === 403) {
          setAccessToken(null);
          if (typeof document !== 'undefined') {
            document.cookie = 'cp_logged=; path=/; max-age=0';
          }
          if (
            typeof window !== 'undefined' &&
            !window.location.pathname.startsWith('/connexion') &&
            !window.location.pathname.startsWith('/inscription')
          ) {
            window.location.href = '/connexion';
          }
        } else {
          // Network/server error — keep the user's session, just clear the in-memory token
          setAccessToken(null);
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);
