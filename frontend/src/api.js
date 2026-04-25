import axios from 'axios';
import { useAuthStore } from './store';

// ============================================
// SECURE API CLIENT CONFIGURATION
// ============================================

/**
 * API URL is loaded from environment variables only
 * - Development: VITE_API_URL must be set in .env.local
 * - Production: VITE_API_URL must be set in deployment env vars
 * 
 * SECURITY: Never hardcode API URLs, always use environment variables
 */
const API_URL = import.meta.env.VITE_API_URL;

// Validate configuration
if (!API_URL) {
  console.error('❌ CRITICAL: VITE_API_URL environment variable is not set');
  console.error('   Frontend cannot connect to backend');
  console.error('   Please set VITE_API_URL in your .env.local file');
}

// Log only in development (never expose API URL in production logs)
if (import.meta.env.MODE === 'development') {
  console.log('🔌 Backend API configured');
}

// ============================================
// CREATE AXIOS INSTANCE WITH SECURE DEFAULTS
// ============================================

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout to prevent hanging requests
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest' // Prevent CSRF
  },
  /**
   * SECURITY: withCredentials must match server's CORS config
   * Set to true only if backend explicitly allows credentials
   * Backend has: credentials: true in CORS options
   */
  withCredentials: true,
  
  /**
   * SECURITY: maxRedirects prevents open redirect vulnerabilities
   */
  maxRedirects: 2
});

// ============================================
// REQUEST INTERCEPTOR - ADD AUTH TOKEN
// ============================================

apiClient.interceptors.request.use(
  (config) => {
    // Get token from secure store (not localStorage for sensitive data)
    const { token } = useAuthStore.getState();
    
    // Add Bearer token to Authorization header if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      if (import.meta.env.MODE === 'development') {
        console.log(`📤 Request (Authenticated): ${config.method?.toUpperCase()} ${config.url}`);
      }
    } else {
      if (import.meta.env.MODE === 'development') {
        console.log(`📤 Request (Public): ${config.method?.toUpperCase()} ${config.url}`);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request configuration error:', error.message);
    return Promise.reject({
      status: 0,
      message: 'Failed to configure request',
      type: 'config_error',
      originalError: error
    });
  }
);

// ============================================
// RESPONSE INTERCEPTOR - HANDLE RESPONSES & ERRORS
// ============================================

apiClient.interceptors.response.use(
  /**
   * SUCCESS HANDLER
   * Only return response.data (not the full response object)
   */
  (response) => {
    if (import.meta.env.MODE === 'development') {
      console.log(`📥 Response: ${response.status} ${response.statusText}`);
    }
    
    // Return only the data payload
    return response.data;
  },

  /**
   * ERROR HANDLER
   * Transform axios errors into consistent error objects
   */
  (error) => {
    // CASE 1: Network error (backend unreachable, timeout, etc.)
    if (!error.response) {
      console.error('❌ Network Error - Backend unreachable');
      
      return Promise.reject({
        status: 0,
        message: 'Cannot connect to server. Please check your internet connection and try again.',
        type: 'network_error',
        isNetworkError: true
      });
    }

    const { status, data, config } = error.response;

    // CASE 2: 400 Bad Request (validation errors)
    if (status === 400) {
      console.warn(`⚠️ Validation Error: ${data?.message || 'Invalid request'}`);
      
      return Promise.reject({
        status: 400,
        message: data?.message || 'Invalid request. Please check your input.',
        type: 'validation_error',
        details: data?.errors || null, // Additional validation errors from backend
        isClientError: true
      });
    }

    // CASE 3: 401 Unauthorized (token expired, invalid, or missing)
    if (status === 401) {
      console.warn('⚠️ Authentication failed - Session expired or invalid token');
      
      // Clear auth state and redirect to login
      const authStore = useAuthStore.getState();
      authStore.logout();
      authStore.clearSession();
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      return Promise.reject({
        status: 401,
        message: 'Your session has expired. Please login again.',
        type: 'auth_error',
        isAuthError: true
      });
    }

    // CASE 4: 403 Forbidden (authenticated but not authorized)
    if (status === 403) {
      console.warn('⚠️ Permission Denied - User lacks required permissions');
      
      return Promise.reject({
        status: 403,
        message: 'You do not have permission to access this resource.',
        type: 'permission_error',
        isAuthError: true
      });
    }

    // CASE 5: 404 Not Found
    if (status === 404) {
      console.warn(`⚠️ Resource Not Found: ${config.url}`);
      
      return Promise.reject({
        status: 404,
        message: 'The requested resource was not found.',
        type: 'not_found_error',
        isClientError: true
      });
    }

    // CASE 6: 429 Too Many Requests (rate limited)
    if (status === 429) {
      console.warn('⚠️ Rate Limited - Too many requests');
      
      return Promise.reject({
        status: 429,
        message: 'Too many requests. Please wait a moment and try again.',
        type: 'rate_limit_error',
        isRateLimit: true,
        retryAfter: error.response.headers['retry-after'] || null
      });
    }

    // CASE 7: 500+ Server Errors
    if (status >= 500) {
      console.error(`❌ Server Error: ${status} - ${data?.message || 'Unknown error'}`);
      
      return Promise.reject({
        status: status,
        message: 'Server error. Our team has been notified. Please try again later.',
        type: 'server_error',
        isServerError: true
      });
    }

    // CASE 8: Any other error status
    console.error(`⚠️ Unexpected Error: ${status}`);
    
    return Promise.reject({
      status: status,
      message: data?.message || 'An error occurred. Please try again.',
      type: 'unknown_error',
      originalError: error
    });
  }
);

// ============================================
// AUTHENTICATION API ENDPOINTS
// ============================================

export const authAPI = {
  /**
   * Register new user
   * SECURITY: Password is sent over HTTPS only, never logged
   */
  register: (email, username, password) => {
    if (!email || !username || !password) {
      return Promise.reject({
        status: 400,
        message: 'Email, username, and password are required.',
        type: 'validation_error',
        isClientError: true
      });
    }
    
    return apiClient.post('/api/auth/register', {
      email: email.trim().toLowerCase(),
      username: username.trim(),
      password
    });
  },

  /**
   * Login user
   * SECURITY: Password is never stored or logged
   */
  login: (email, password) => {
    if (!email || !password) {
      return Promise.reject({
        status: 400,
        message: 'Email and password are required.',
        type: 'validation_error',
        isClientError: true
      });
    }
    
    return apiClient.post('/api/auth/login', {
      email: email.trim().toLowerCase(),
      password
    });
  },

  /**
   * Get current user profile (requires authentication)
   */
  getCurrentUser: () => apiClient.get('/api/auth/me'),

  /**
   * Update user profile (requires authentication)
   * SECURITY: Sensitive fields like password should use dedicated endpoint
   */
  updateProfile: (data) => {
    if (!data || typeof data !== 'object') {
      return Promise.reject({
        status: 400,
        message: 'Profile data is required.',
        type: 'validation_error',
        isClientError: true
      });
    }
    
    return apiClient.put('/api/auth/me', data);
  },

  /**
   * Change password (dedicated endpoint for security)
   */
  changePassword: (currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
      return Promise.reject({
        status: 400,
        message: 'Current and new passwords are required.',
        type: 'validation_error',
        isClientError: true
      });
    }
    
    return apiClient.post('/api/auth/change-password', {
      currentPassword,
      newPassword
    });
  },

  /**
   * Logout (notify backend to invalidate session/token)
   * SECURITY: Always clear local state even if logout fails
   */
  logout: async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed, clearing local session anyway');
    } finally {
      // Always clear local auth state
      const authStore = useAuthStore.getState();
      authStore.logout();
      authStore.clearSession();
    }
  }
};

// ============================================
// QUOTES API ENDPOINTS
// ============================================

export const quotesAPI = {
  /**
   * Get paginated list of quotes
   */
  getAllQuotes: (page = 1, limit = 10, category = null) => {
    if (page < 1 || limit < 1) {
      return Promise.reject({
        status: 400,
        message: 'Page and limit must be positive numbers.',
        type: 'validation_error',
        isClientError: true
      });
    }
    
    return apiClient.get('/api/quotes', {
      params: {
        page: Math.floor(page),
        limit: Math.floor(Math.min(limit, 100)), // Cap limit at 100
        ...(category && { category })
      }
    });
  },

  /**
   * Get single random quote
   */
  getRandomQuote: () => apiClient.get('/api/quotes/random'),

  /**
   * Get quote by ID
   */
  getQuoteById: (id) => {
    if (!id) {
      return Promise.reject({
        status: 400,
        message: 'Quote ID is required.',
        type: 'validation_error',
        isClientError: true
      });
    }
    
    return apiClient.get(`/api/quotes/${id}`);
  },

  /**
   * Get all quote categories
   */
  getCategories: () => apiClient.get('/api/quotes/categories/list'),

  /**
   * Add quote to user favorites (requires authentication)
   */
  addFavorite: (quoteId) => {
    if (!quoteId) {
      return Promise.reject({
        status: 400,
        message: 'Quote ID is required.',
        type: 'validation_error',
        isClientError: true
      });
    }
    
    return apiClient.post(`/api/quotes/${quoteId}/favorite`);
  },

  /**
   * Remove quote from user favorites (requires authentication)
   */
  removeFavorite: (quoteId) => {
    if (!quoteId) {
      return Promise.reject({
        status: 400,
        message: 'Quote ID is required.',
        type: 'validation_error',
        isClientError: true
      });
    }
    
    return apiClient.delete(`/api/quotes/${quoteId}/favorite`);
  },

  /**
   * Get user's favorite quotes (requires authentication)
   */
  getUserFavorites: () => apiClient.get('/api/quotes/user/favorites'),

  /**
   * Search quotes by text and/or category
   */
  searchQuotes: (search = '', category = null) => {
    return apiClient.get('/api/quotes', {
      params: {
        ...(search && { search: search.trim() }),
        ...(category && { category })
      }
    });
  }
};

// ============================================
// SUBSCRIPTIONS API ENDPOINTS
// ============================================

export const subscriptionAPI = {
  /**
   * Get available subscription plans
   */
  getPlans: () => apiClient.get('/api/subscriptions/plans'),

  /**
   * Activate free subscription (requires authentication)
   */
  activateFree: () => apiClient.post('/api/subscriptions/activate-free'),

  /**
   * Upgrade to premium subscription (requires authentication)
   * This typically redirects to payment processor
   */
  upgradeToPremium: () => apiClient.post('/api/subscriptions/upgrade-to-premium'),

  /**
   * Get user's current subscription status (requires authentication)
   */
  getStatus: () => apiClient.get('/api/subscriptions/status'),

  /**
   * Downgrade from premium to free (requires authentication)
   */
  downgradeToFree: () => apiClient.post('/api/subscriptions/downgrade-to-free')
};

// ============================================
// AUDIO API ENDPOINTS
// ============================================

export const audioAPI = {
  /**
   * Get user's audio library
   */
  getLibrary: () => apiClient.get('/api/audio'),

  /**
   * Get specific audio by ID
   */
  getAudioById: (audioId) => {
    if (!audioId) {
      return Promise.reject({
        status: 400,
        message: 'Audio ID is required.',
        type: 'validation_error',
        isClientError: true
      });
    }
    
    return apiClient.get(`/api/audio/${audioId}`);
  },

  /**
   * Start an audio listening session
   */
  startSession: (audioId) => {
    if (!audioId) {
      return Promise.reject({
        status: 400,
        message: 'Audio ID is required.',
        type: 'validation_error',
        isClientError: true
      });
    }
    
    return apiClient.post('/api/audio/session/start', { audioId });
  },

  /**
   * End an audio listening session
   */
  endSession: (sessionId, durationSeconds) => {
    if (!sessionId || typeof durationSeconds !== 'number') {
      return Promise.reject({
        status: 400,
        message: 'Session ID and duration are required.',
        type: 'validation_error',
        isClientError: true
      });
    }
    
    return apiClient.post('/api/audio/session/end', {
      sessionId,
      durationSeconds: Math.max(0, Math.floor(durationSeconds))
    });
  },

  /**
   * Get user's audio statistics
   */
  getStats: () => apiClient.get('/api/audio/user/stats'),

  /**
   * Get user's achievements
   */
  getAchievements: () => apiClient.get('/api/audio/user/achievements')
};

// ============================================
// ADS API ENDPOINTS
// ============================================

export const adsAPI = {
  /**
   * Get available ads
   */
  getAds: () => apiClient.get('/api/ads'),

  /**
   * Get specific ad by ID
   */
  getAdById: (adId) => {
    if (!adId) {
      return Promise.reject({
        status: 400,
        message: 'Ad ID is required.',
        type: 'validation_error',
        isClientError: true
      });
    }
    
    return apiClient.get(`/api/ads/${adId}`);
  },

  /**
   * Track ad click for analytics
   */
  trackClick: (adId) => {
    if (!adId) {
      return Promise.reject({
        status: 400,
        message: 'Ad ID is required.',
        type: 'validation_error',
        isClientError: true
      });
    }
    
    return apiClient.post(`/api/ads/${adId}/click`);
  }
};

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

export const healthAPI = {
  /**
   * Check backend health status
   * Use this for debugging connection issues
   */
  check: () => apiClient.get('/api/health')
};

// ============================================
// ERROR HANDLER - USER-FRIENDLY MESSAGES
// ============================================

/**
 * Convert technical errors into user-friendly messages
 * SECURITY: Never expose sensitive backend information
 * 
 * @param {Error} error - Error object from API
 * @returns {string} User-friendly error message
 */
export const handleApiError = (error) => {
  // Handle structured error format from interceptor
  if (error.type) {
    switch (error.type) {
      case 'network_error':
        return 'Network connection error. Please check your internet and try again.';
      
      case 'config_error':
        return 'Failed to configure request. Please contact support.';
      
      case 'auth_error':
        return 'Your session has expired. Please login again.';
      
      case 'permission_error':
        return 'You do not have permission to perform this action.';
      
      case 'not_found_error':
        return 'The requested resource was not found.';
      
      case 'rate_limit_error':
        return 'You are making too many requests. Please wait a moment and try again.';
      
      case 'validation_error':
        // Include specific validation details if available
        if (error.details && Object.keys(error.details).length > 0) {
          const firstError = Object.values(error.details)[0];
          return typeof firstError === 'string' ? firstError : error.message;
        }
        return error.message || 'Please check your input and try again.';
      
      case 'server_error':
        return 'Server error. Our team has been notified. Please try again later.';
      
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }

  // Fallback for axios error format
  if (error.response?.status) {
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        return data?.message || 'Invalid request. Please check your input.';
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
        return data?.message || 'An error occurred. Please try again.';
    }
  }

  // Last resort fallback
  return error.message || 'Something went wrong. Please try again.';
};

// ============================================
// DEVELOPMENT DEBUG HELPERS
// ============================================

/**
 * Test API connectivity (development only)
 * Use this to debug connection issues
 * 
 * SECURITY: Only available in development mode
 */
export const debugApiHealth = async () => {
  if (import.meta.env.MODE !== 'development') {
    console.warn('⚠️ Debug function only available in development mode');
    return false;
  }

  try {
    console.log('🔍 Testing API health...');
    const response = await healthAPI.check();
    console.log('✅ Backend is online:', response);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed');
    console.error('   Status:', error.status);
    console.error('   Message:', error.message);
    console.error('   Check that VITE_API_URL is correctly set');
    return false;
  }
};

/**
 * Log API client configuration (development only)
 * Helps debug CORS and connectivity issues
 */
export const debugApiConfig = () => {
  if (import.meta.env.MODE !== 'development') {
    console.warn('⚠️ Debug function only available in development mode');
    return;
  }

  console.log('🔧 API Client Configuration:');
  console.log('   Base URL:', API_URL || 'NOT SET');
  console.log('   With Credentials:', apiClient.defaults.withCredentials);
  console.log('   Timeout:', apiClient.defaults.timeout + 'ms');
  console.log('   Default Headers:', apiClient.defaults.headers.common);
};

// ============================================
// EXPORT DEFAULT CLIENT
// ============================================

export default apiClient;