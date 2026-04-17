import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

// Import middleware
import rateLimiter from './middleware/rateLimiter.js';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth.js';

// Import routes
import authRouter from './routes/auth.js';
import quotesRouter from './routes/quotes.js';
import subscriptionsRouter from './routes/subscriptions.js';
import adsRouter from './routes/ads.js';
import audioRouter from './routes/audio.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// VALIDATE REQUIRED ENVIRONMENT VARIABLES
// ============================================

const requiredEnvVars = [
  'FRONTEND_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ ERROR: Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n📋 Please set these in your .env file or Render environment variables');
  process.exit(1);
}

// ============================================
// SECURITY: HELMET - HTTP SECURITY HEADERS
// ============================================

/**
 * Helmet secures Express app by setting various HTTP headers
 * This includes protections for:
 * - Content Security Policy (CSP)
 * - X-Frame-Options (clickjacking protection)
 * - X-Content-Type-Options (MIME sniffing protection)
 * - Strict-Transport-Security (HSTS for HTTPS)
 * - X-XSS-Protection
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Inline styles only if necessary
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.FRONTEND_URL],
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny' // Prevent clickjacking
  },
  noSniff: true,
  xssFilter: true
}));

// ============================================
// CORS CONFIGURATION - SECURE & FLEXIBLE
// ============================================

/**
 * Build allowed origins dynamically from environment variables
 * This prevents hardcoding URLs and allows easy configuration
 * per environment (dev, staging, production)
 * 
 * SECURITY:
 * - Development origins only in non-production
 * - Frontend URL from environment variable
 * - Support for multiple origins via comma-separated list
 */
const buildAllowedOrigins = () => {
  const origins = new Set();
  
  // Add development origins ONLY if NOT in production
  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:5173');
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:5173');
    origins.add('http://127.0.0.1:3000');
  }
  
  // Add production frontend URL from environment
  if (process.env.FRONTEND_URL) {
    origins.add(process.env.FRONTEND_URL.trim());
  }
  
  // Add additional allowed origins if provided
  // Format: ADDITIONAL_ALLOWED_ORIGINS=https://example.com,https://another.com
  if (process.env.ADDITIONAL_ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.ADDITIONAL_ALLOWED_ORIGINS
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);
    
    additionalOrigins.forEach(origin => origins.add(origin));
  }
  
  return Array.from(origins);
};

const allowedOrigins = buildAllowedOrigins();

// Log allowed origins in development only (never in production logs)
if (process.env.NODE_ENV !== 'production') {
  console.log('🔒 CORS Configuration (Development Only):');
  allowedOrigins.forEach(origin => console.log(`   ✓ ${origin}`));
}

/**
 * CORS Options Configuration
 * 
 * SECURITY NOTES:
 * - credentials: true allows cookies/auth headers (required for JWT auth)
 * - allowedHeaders: Specifies which headers clients can send
 * - exposedHeaders: Specifies which headers client can read
 * - optionsSuccessStatus: Handles preflight requests properly
 * - maxAge: Browser caches preflight responses to reduce requests
 */
const corsOptions = {
  /**
   * Origin validator function
   * - Allows requests with no origin (mobile apps, curl, Postman)
   * - Checks origin against allowlist
   * - Logs blocked origins in development
   */
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Electron, curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Origin not allowed
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️ CORS blocked request from: ${origin}`);
    }
    
    // Don't expose why the origin was blocked (security)
    callback(new Error('CORS policy violation'));
  },
  
  /**
   * credentials: true allows:
   * - Authorization headers (Bearer tokens)
   * - Cookies to be sent/received
   * MUST match frontend's withCredentials: true
   */
  credentials: true,
  
  /**
   * Allowed HTTP methods
   * Include all methods your API uses
   */
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  /**
   * Headers the browser allows client code to send
   * - Content-Type: For JSON data
   * - Authorization: For Bearer tokens
   * - X-Requested-With: Anti-CSRF header
   */
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With'
  ],
  
  /**
   * Headers the browser allows client code to read
   * Add custom headers here if needed
   */
  exposedHeaders: [
    'Content-Type',
    'X-Total-Count', // Useful for pagination info
    'X-Page-Count'
  ],
  
  /**
   * HTTP status code for successful preflight
   * 200 is standard; some older systems need 204
   */
  optionsSuccessStatus: 200,
  
  /**
   * Browser caches preflight results for this duration
   * Reduces preflight requests (improves performance)
   * 86400 = 24 hours
   */
  maxAge: 86400
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle OPTIONS requests explicitly (preflight)
app.options('*', cors(corsOptions));

// ============================================
// REQUEST LOGGING & TRACKING
// ============================================

/**
 * Attach unique request ID for tracking
 * Useful for debugging and logging
 * SECURITY: Never expose request IDs in production responses
 */
app.use((req, res, next) => {
  req.id = uuidv4();
  
  // Log request only in development (prevent logging sensitive info in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ID: ${req.id}`
    );
  }
  
  next();
});

// ============================================
// BODY PARSER MIDDLEWARE
// ============================================

/**
 * Parse JSON request bodies
 * Limit set to 10mb to prevent DoS attacks
 */
app.use(express.json({ limit: '10mb' }));

/**
 * Parse URL-encoded request bodies
 * Used for form submissions
 */
app.use(express.urlencoded({
  limit: '10mb',
  extended: true // Allows rich objects and arrays to be encoded
}));

// ============================================
// SECURITY: RATE LIMITING
// ============================================

/**
 * Rate limiting prevents:
 * - Brute force attacks
 * - DoS attacks
 * - API abuse
 * 
 * Configure different limits for different endpoints:
 * - API endpoints: General rate limit
 * - Auth endpoints: Stricter limit (prevent password guessing)
 */
app.use('/api/', rateLimiter.apiLimiter);
app.use('/api/auth/login', rateLimiter.authLimiter);
app.use('/api/auth/register', rateLimiter.authLimiter);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

/**
 * Health check for monitoring and load balancers
 * Returns minimal info (don't expose sensitive details)
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    // Don't include: version, uptime, or other sensitive info
  });
});

// ============================================
// API ROUTES
// ============================================

/**
 * Authentication routes
 * Handles: register, login, logout, profile, password change
 */
app.use('/api/auth', authRouter);

/**
 * Quotes routes
 * Handles: get quotes, search, categories, favorites
 * Some endpoints require authentication
 */
app.use('/api/quotes', quotesRouter);

/**
 * Subscriptions routes
 * Handles: plans, activation, upgrade, downgrade
 * All endpoints require authentication
 */
app.use('/api/subscriptions', subscriptionsRouter);

/**
 * Ads routes
 * Handles: get ads, tracking
 */
app.use('/api/ads', adsRouter);

/**
 * Audio routes
 * Handles: library, sessions, statistics, achievements
 * Most endpoints require authentication
 */
app.use('/api/audio', audioRouter);

// ============================================
// 404 HANDLER
// ============================================

/**
 * Catch all unmatched routes
 * Returns 404 for requests to non-existent endpoints
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Resource not found',
    path: req.path,
    method: req.method
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

/**
 * Centralized error handler for all routes
 * SECURITY: Never expose stack traces in production
 * 
 * Handles:
 * - Validation errors
 * - Authentication errors
 * - Database errors
 * - Unexpected errors
 */
app.use((err, req, res, next) => {
  // Determine appropriate HTTP status code
  const statusCode = err.status || err.statusCode || 500;
  
  // Log error details (more in development, minimal in production)
  if (process.env.NODE_ENV !== 'production') {
    console.error(`\n[ERROR] RequestID: ${req.id}`);
    console.error(`Status: ${statusCode}`);
    console.error(`Message: ${err.message}`);
    console.error(`Stack: ${err.stack}\n`);
  } else {
    // Production: Log minimal info to avoid exposing details
    console.error(`[ERROR] RequestID: ${req.id}, Status: ${statusCode}, Message: ${err.message}`);
  }
  
  // Don't respond if headers already sent
  if (res.headersSent) {
    return next(err);
  }
  
  // Build error response
  const errorResponse = {
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error'
  };
  
  // Include request ID in development for debugging
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.requestId = req.id;
  }
  
  // Include validation details if available
  if (err.validationErrors) {
    errorResponse.details = err.validationErrors;
  }
  
  // Send error response
  res.status(statusCode).json(errorResponse);
});

// ============================================
// SERVER STARTUP
// ============================================

const server = app.listen(PORT, () => {
  const environmentEmoji = process.env.NODE_ENV === 'production' ? '🚀' : '💻';
  const timestamp = new Date().toISOString();
  
  console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🙏 SPIRITUAL AWAKENING APP - BACKEND SERVER    ║
║                                                    ║
║   ${environmentEmoji} Environment: ${(process.env.NODE_ENV || 'development').padEnd(32)} ║
║   🔐 Status: ✓ READY FOR CONNECTIONS            ║
║   🌐 Port: ${String(PORT).padEnd(39)} ║
║   ⏰ Started: ${timestamp.substring(0, 43)} ║
║                                                    ║
╚════════════════════════════════════════════════════╝
  `);
  
  // Log security status
  if (process.env.NODE_ENV === 'production') {
    console.log('🔒 Security: PRODUCTION MODE');
    console.log('   - Helmet security headers: ENABLED');
    console.log('   - CORS: Restricted to FRONTEND_URL');
    console.log('   - Error details: HIDDEN');
    console.log('   - Request logging: MINIMAL\n');
  }
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

/**
 * Handle shutdown signals gracefully
 * Allows in-flight requests to complete
 * Closes database connections properly
 */
const handleShutdown = (signal) => {
  console.log(`\n\n${signal} received - Graceful shutdown initiated...`);
  
  server.close(() => {
    console.log('✓ Server closed');
    console.log('✓ All connections closed');
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after 30 seconds');
    process.exit(1);
  }, 30000);
};

// Handle termination signals
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// ============================================
// HANDLE UNCAUGHT EXCEPTIONS
// ============================================

/**
 * Catch uncaught exceptions to prevent server crash
 */
process.on('uncaughtException', (err) => {
  console.error('\n❌ UNCAUGHT EXCEPTION:', err);
  console.error(err.stack);
  process.exit(1);
});

/**
 * Catch unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ UNHANDLED REJECTION:');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

export default app;