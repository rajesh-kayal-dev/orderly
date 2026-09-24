import axios from 'axios';

// Smart URL resolution: if running inside preview iframe or dev server, prioritize /api proxy
const getBaseUrl = () => {
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

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
});

// Add a request interceptor to include the auth token or guest token
axiosInstance.interceptors.request.use(
  (config) => {
    const userToken = typeof window !== 'undefined'
      ? (localStorage.getItem('token') || sessionStorage.getItem('token'))
      : null;
    const guestToken = typeof window !== 'undefined'
      ? (localStorage.getItem('guest_token') || sessionStorage.getItem('guest_token'))
      : null;
    const effectiveToken = userToken || guestToken;

    if (effectiveToken) {
      config.headers.Authorization = `Bearer ${effectiveToken}`;
      if (guestToken && !userToken) {
        config.headers['x-guest-session'] = guestToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for better error tracking & session cleanup
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // If token expired or was rejected, ensure stale storage is cleaned
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

    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default axiosInstance;
