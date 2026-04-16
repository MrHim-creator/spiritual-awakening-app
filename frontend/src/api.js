import axios from 'axios';
import { useAuthStore } from './store';

// ============================================
// SECURE API CLIENT CONFIGURATION
// ============================================

// Get API URL from environment (set in Vercel env vars, not hardcoded)
const API_URL = import.meta.env.VITE_API_URL;

// Validate that API URL is set
if (!API_URL) {
  console.error('ERROR: VITE_API_URL environment variable is not set');
  console.error('Frontend cannot connect to backend');
}

console.log('🔌 Backend connection: Configured');
// Don't log the actual URL in production

// ============================================
// CREATE AXIOS INSTANCE
// ============================================

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  // Don't send credentials by default (CORS safer)
  withCredentials: false
});

// ============================================
// REQUEST INTERCEPTOR - Add Auth Token
// ============================================

apiClient.interceptors.request.use(
  (config) => {
    // Get token from secure store
    const { token } = useAuthStore.getState();
    
    // Add token to header if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log only in development
    if (import.meta.env.MODE === 'development') {
      console.log(`📤 Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Request setup failed');
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR - Handle Errors
// ============================================

apiClient.interceptors.response.use(
  (response) => {
    // Log only in development
    if (import.meta.env.MODE === 'development') {
      console.log(`📥 Response: ${response.status} ${response.statusText}`);
    }
    
    return response.data;
  },
  (error) => {
    // Handle different error types
    if (!error.response) {
      // Network error - backend is down or unreachable
      console.error('Network error: Backend unreachable');
      return Promise.reject({
        status: 0,
        message: 'Cannot connect to server. Please check your connection.',
        type: 'network_error'
      });
    }

    const { status, data } = error.response;

    // Handle 401 Unauthorized - token expired or invalid
    if (status === 401) {
      console.warn('Unauthorized: Session expired');
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject({
        status: 401,
        message: 'Session expired. Please login again.',
        type: 'auth_error'
      });
    }

    // Handle 403 Forbidden - no permission
    if (status === 403) {
      return Promise.reject({
        status: 403,
        message: 'You do not have permission to access this resource.',
        type: 'permission_error'
      });
    }

    // Handle 404 Not Found
    if (status === 404) {
      return Promise.reject({
        status: 404,
        message: 'Resource not found.',
        type: 'not_found_error'
      });
    }

    // Handle 429 Rate Limit
    if (status === 429) {
      return Promise.reject({
        status: 429,
        message: 'Too many requests. Please wait a moment and try again.',
        type: 'rate_limit_error'
      });
    }

    // Handle 400 Bad Request
    if (status === 400) {
      return Promise.reject({
        status: 400,
        message: data?.message || 'Invalid request. Please check your input.',
        type: 'validation_error',
        details: data?.errors || null // Additional validation errors
      });
    }

    // Handle 500+ Server Errors
    if (status >= 500) {
      console.error(`Server error: ${status}`);
      return Promise.reject({
        status: status,
        message: 'Server error. Please try again later.',
        type: 'server_error'
      });
    }

    // Handle any other error
    return Promise.reject({
      status: status,
      message: data?.message || 'An error occurred. Please try again.',
      type: 'unknown_error'
    });
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
    apiClient.put('/api/auth/me', data),

  logout: () =>
    // Optional: notify backend of logout
    apiClient.post('/api/auth/logout').catch(() => {
      // Even if logout fails, clear local session
      useAuthStore.getState().logout();
    })
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
    apiClient.get('/api/health')
};

// ============================================
// ERROR HANDLER - Safe for UI
// ============================================

export const handleApiError = (error) => {
  // If error is from our interceptor format
  if (error.type) {
    switch (error.type) {
      case 'network_error':
        return 'Network error. Please check your internet connection.';
      case 'auth_error':
        return 'Your session has expired. Please login again.';
      case 'permission_error':
        return 'You do not have permission to perform this action.';
      case 'not_found_error':
        return 'The requested resource was not found.';
      case 'rate_limit_error':
        return 'You are making too many requests. Please wait before trying again.';
      case 'validation_error':
        return error.message || 'Please check your input and try again.';
      case 'server_error':
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }

  // Fallback for unexpected error format
  if (error.response?.status) {
    switch (error.response.status) {
      case 401:
        return 'Please login again.';
      case 403:
        return 'You do not have permission.';
      case 404:
        return 'Resource not found.';
      case 429:
        return 'Too many requests. Please wait.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  return error.message || 'Something went wrong. Please try again.';
};

// ============================================
// DEBUG HELPER - Development Only
// ============================================

export const debugApiHealth = async () => {
  if (import.meta.env.MODE !== 'development') {
    console.warn('Debug function only available in development');
    return;
  }

  try {
    console.log('🔍 Testing API health...');
    const response = await healthAPI.check();
    console.log('✅ Backend is online:', response);
    return true;
  } catch (error) {
    console.error('❌ Backend is offline:', error);
    return false;
  }
};

export default apiClient;