import axios from 'axios';

// Smart URL resolution: if running inside preview iframe or dev server, prioritize /api proxy
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
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

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
});

// Add a request interceptor to include the auth token or guest token
axiosInstance.interceptors.request.use(
  (config) => {
    const userToken = sessionStorage.getItem('token');
    const guestToken = sessionStorage.getItem('guest_token') || localStorage.getItem('guest_token');
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

// Add a response interceptor for better error tracking
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
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
