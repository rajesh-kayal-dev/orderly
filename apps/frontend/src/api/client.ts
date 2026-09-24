import axios, { type AxiosInstance } from 'axios';

// Smart URL resolution: if running inside preview iframe or dev server, prioritize /api proxy
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const isCloudPreview =
      window.location.hostname.includes('.run.app') ||
      window.location.hostname.includes('googleusercontent') ||
      window.location.hostname.includes('webcontainer') ||
      window.location.hostname.includes('ais-');

    if (isCloudPreview || window.location.port === '3000' || window.location.port === '3001') {
      return '/api';
    }
  }

  return import.meta.env.VITE_API_URL || '/api';
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header if session token or guest token is available
apiClient.interceptors.request.use(
  (config) => {
    const userToken = typeof window !== 'undefined'
      ? (localStorage.getItem('token') || sessionStorage.getItem('token'))
      : null;
    const guestToken = typeof window !== 'undefined'
      ? (localStorage.getItem('guest_token') || sessionStorage.getItem('guest_token'))
      : null;
    const effectiveToken = userToken || guestToken;

    if (effectiveToken && config.headers) {
      config.headers.Authorization = `Bearer ${effectiveToken}`;
      if (guestToken && !userToken) {
        config.headers['x-guest-session'] = guestToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error propagation and session invalidation
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const hadToken = Boolean(localStorage.getItem('token') || sessionStorage.getItem('token'));
      if (hadToken && error.config?.url && !error.config.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('profile');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('profile');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
