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
// SECURITY HEADERS & CONFIGURATION
// ============================================

app.use(helmet());

// ============================================
// CORS CONFIGURATION - SECURE
// ============================================

// Build allowed origins ONLY from environment variables
// NO hardcoding of URLs
const buildAllowedOrigins = () => {
  const origins = [];
  
  // Add development origins only if NOT in production
  if (process.env.NODE_ENV !== 'production') {
    origins.push(
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    );
  }
  
  // Add frontend URL from environment variable
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  
  // Add additional allowed origins if provided as comma-separated list
  if (process.env.ADDITIONAL_ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.ADDITIONAL_ALLOWED_ORIGINS
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean);
    origins.push(...additionalOrigins);
  }
  
  return origins;
};

const allowedOrigins = buildAllowedOrigins();

// Log origins only in development to avoid exposing in production logs
if (process.env.NODE_ENV !== 'production') {
  console.log('🔒 Allowed CORS Origins (Development Only):');
  allowedOrigins.forEach(origin => console.log(`   ✓ ${origin}`));
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log warning in development only
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️ CORS blocked origin: ${origin}`);
      }
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};

// Apply CORS
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// ============================================
// REQUEST LOGGING & TRACKING
// ============================================

app.use((req, res, next) => {
  req.id = uuidv4();
  
  // Log request in development only (to avoid exposing patterns in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - RequestID: ${req.id}`);
  }
  
  next();
});

// ============================================
// BODY PARSER
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================
// RATE LIMITING
// ============================================

app.use('/api/', rateLimiter.apiLimiter);
app.use('/api/auth/login', rateLimiter.authLimiter);
app.use('/api/auth/register', rateLimiter.authLimiter);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/api/health', (req, res) => {
  // Don't expose sensitive info in health check
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/ads', adsRouter);
app.use('/api/audio', audioRouter);

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Resource not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Log error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${req.id}:`, err.message);
    console.error(err.stack);
  } else {
    // In production, log minimal info to secure logging service
    console.error(`[ERROR] RequestID: ${req.id}, Message: ${err.message}`);
  }

  // Check if response already sent
  if (res.headersSent) {
    return next(err);
  }

  // Build error response - NEVER expose stack traces in production
  const errorResponse = {
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message || 'Internal server error'
  };

  // Only include request ID in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.requestId = req.id;
  }

  res.status(err.status || err.statusCode || 500).json(errorResponse);
});

// ============================================
// SERVER STARTUP
// ============================================

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🙏 SPIRITUAL AWAKENING APP - BACKEND RUNNING    ║
║                                                    ║
║   Environment: ${process.env.NODE_ENV || 'development'}
║   Status: ✓ READY                                  ║
║                                                    ║
╚════════════════════════════════════════════════════╝
  `);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const handleShutdown = (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

export default app;