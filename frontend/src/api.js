import axios from 'axios';
import { useAuthStore } from './store';

// Base URL WITHOUT /api (we'll add it to each endpoint for clarity)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Auto logout on 401
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ============================================
// AUTHENTICATION API
// ============================================
export const authAPI = {
  register: (email, username, password) =>
    apiClient.post('/api/auth/register', { email, username, password }),

  login: (email, password) =>
    apiClient.post('/api/auth/login', { email, password }),

  getCurrentUser: () =>
    apiClient.get('/api/auth/me'),

  updateProfile: (data) =>
    apiClient.put('/api/auth/me', data)
};

// ============================================
// QUOTES API
// ============================================
export const quotesAPI = {
  getAllQuotes: (page = 1, limit = 10, category = null) =>
    apiClient.get('/api/quotes', { params: { page, limit, category } }),

  getRandomQuote: () =>
    apiClient.get('/api/quotes/random'),

  getQuoteById: (id) =>
    apiClient.get(`/api/quotes/${id}`),

  getCategories: () =>
    apiClient.get('/api/quotes/categories/list'),

  addFavorite: (quoteId) =>
    apiClient.post(`/api/quotes/${quoteId}/favorite`),

  removeFavorite: (quoteId) =>
    apiClient.delete(`/api/quotes/${quoteId}/favorite`),

  getUserFavorites: () =>
    apiClient.get('/api/quotes/user/favorites'),

  searchQuotes: (search, category) =>
    apiClient.get('/api/quotes', { params: { search, category } })
};

// ============================================
// SUBSCRIPTIONS API
// ============================================
export const subscriptionAPI = {
  getPlans: () =>
    apiClient.get('/api/subscriptions/plans'),

  activateFree: () =>
    apiClient.post('/api/subscriptions/activate-free'),

  upgradeToPremium: () =>
    apiClient.post('/api/subscriptions/upgrade-to-premium'),

  getStatus: () =>
    apiClient.get('/api/subscriptions/status'),

  downgradeToFree: () =>
    apiClient.post('/api/subscriptions/downgrade-to-free')
};

// ============================================
// AUDIO API
// ============================================
export const audioAPI = {
  getLibrary: () =>
    apiClient.get('/api/audio'),

  getAudioByType: (audioType, audioId) =>
    apiClient.get(`/api/audio/${audioType}/${audioId}`),

  startSession: (audioType, audioId) =>
    apiClient.post('/api/audio/session/start', { audioType, audioId }),

  endSession: (sessionId, durationSeconds) =>
    apiClient.post('/api/audio/session/end', { sessionId, durationSeconds }),

  getStats: () =>
    apiClient.get('/api/audio/user/stats'),

  getAchievements: () =>
    apiClient.get('/api/audio/user/achievements')
};

// ============================================
// ADS API
// ============================================
export const adsAPI = {
  getAds: () =>
    apiClient.get('/api/ads'),

  getAdById: (adId) =>
    apiClient.get(`/api/ads/${adId}`),

  trackClick: (adId) =>
    apiClient.post(`/api/ads/${adId}/click`)
};

// ============================================
// HEALTH CHECK
// ============================================
export const healthAPI = {
  check: () =>
    apiClient.get('/api/health')  // Fixed: use apiClient and add /api
};

// ============================================
// ERROR HANDLER
// ============================================
export const handleApiError = (error) => {
  if (error.response?.status === 401) {
    return 'You need to login';
  }
  if (error.response?.status === 403) {
    return 'You don\'t have permission';
  }
  if (error.response?.status === 404) {
    return 'Not found';
  }
  if (error.response?.status === 429) {
    return 'Too many requests. Please wait';
  }
  if (error.response?.status >= 500) {
    return 'Server error. Please try again later';
  }
  return error.message || error.error || 'Something went wrong';
};

export default apiClient;