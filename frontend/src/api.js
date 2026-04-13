import axios from 'axios';
import { useAuthStore } from './store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    apiClient.post('/auth/register', { email, username, password }),

  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  getCurrentUser: () =>
    apiClient.get('/auth/me'),

  updateProfile: (data) =>
    apiClient.put('/auth/me', data)
};

// ============================================
// QUOTES API
// ============================================
export const quotesAPI = {
  getAllQuotes: (page = 1, limit = 10, category = null) =>
    apiClient.get('/quotes', { params: { page, limit, category } }),

  getRandomQuote: () =>
    apiClient.get('/quotes/random'),

  getQuoteById: (id) =>
    apiClient.get(`/quotes/${id}`),

  getCategories: () =>
    apiClient.get('/quotes/categories/list'),

  addFavorite: (quoteId) =>
    apiClient.post(`/quotes/${quoteId}/favorite`),

  removeFavorite: (quoteId) =>
    apiClient.delete(`/quotes/${quoteId}/favorite`),

  getUserFavorites: () =>
    apiClient.get('/quotes/user/favorites'),

  searchQuotes: (search, category) =>
    apiClient.get('/quotes', { params: { search, category } })
};

// ============================================
// SUBSCRIPTIONS API
// ============================================
export const subscriptionAPI = {
  getPlans: () =>
    apiClient.get('/subscriptions/plans'),

  activateFree: () =>
    apiClient.post('/subscriptions/activate-free'),

  upgradeToPremium: () =>
    apiClient.post('/subscriptions/upgrade-to-premium'),

  getStatus: () =>
    apiClient.get('/subscriptions/status'),

  downgradeToFree: () =>
    apiClient.post('/subscriptions/downgrade-to-free')
};

// ============================================
// AUDIO API
// ============================================
export const audioAPI = {
  getLibrary: () =>
    apiClient.get('/audio'),

  getAudioByType: (audioType, audioId) =>
    apiClient.get(`/audio/${audioType}/${audioId}`),

  startSession: (audioType, audioId) =>
    apiClient.post('/audio/session/start', { audioType, audioId }),

  endSession: (sessionId, durationSeconds) =>
    apiClient.post('/audio/session/end', { sessionId, durationSeconds }),

  getStats: () =>
    apiClient.get('/audio/user/stats'),

  getAchievements: () =>
    apiClient.get('/audio/user/achievements')
};

// ============================================
// ADS API
// ============================================
export const adsAPI = {
  getAds: () =>
    apiClient.get('/ads'),

  getAdById: (adId) =>
    apiClient.get(`/ads/${adId}`),

  trackClick: (adId) =>
    apiClient.post(`/ads/${adId}/click`)
};

// ============================================
// HEALTH CHECK
// ============================================
export const healthAPI = {
  check: () =>
    axios.get(`${API_URL}/health`)
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