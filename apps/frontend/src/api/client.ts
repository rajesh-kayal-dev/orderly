import axios, { type AxiosInstance } from 'axios';

// Smart URL resolution: if running inside preview iframe or dev server, prioritize /api proxy
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // If not running purely on standalone localhost:8000, route through Vite proxy /api
    const isCloudPreview =
      window.location.hostname.includes('.run.app') ||
      window.location.hostname.includes('googleusercontent') ||
      window.location.hostname.includes('webcontainer') ||
      window.location.hostname.includes('ais-');

    if (isCloudPreview || window.location.port === '3000') {
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
    const userToken = sessionStorage.getItem('token');
    const guestToken = sessionStorage.getItem('guest_token') || localStorage.getItem('guest_token');
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

// Response interceptor for consistent error propagation
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized handler
    }
    return Promise.reject(error);
  }
);

export default apiClient;
