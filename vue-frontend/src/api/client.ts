import axios from 'axios';

// Support deployed backend URL via environment variable; fallback to '/api' for local dev proxy
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, '') || '/api';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: add Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: handle token expiration or API errors
apiClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    // Session expired or unauthenticated
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
  }
  return Promise.reject(error);
});
