import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import your actual route files
import authRouter from './routes/auth.js';
import quotesRouter from './routes/quotes.js';
import subscriptionsRouter from './routes/subscriptions.js';
import adsRouter from './routes/ads.js';
import audioRouter from './routes/audio.js';
import adminRouter from './routes/admin.js';
import backupRouter from './routes/backup.js';

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting Spiritual Awakening Backend...');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  FRONTEND_URL: process.env.FRONTEND_URL ? '✅ Set' : '❌ Missing'
});

logger.info('🚀 Starting Spiritual Awakening Backend...', {
  environment: process.env.NODE_ENV,
  port: PORT,
  frontendUrl: process.env.FRONTEND_URL ? 'Set' : 'Missing'
});

// ============================================
// VALIDATE ENVIRONMENT VARIABLES
// ============================================

const requiredEnvVars = ['FRONTEND_URL', 'JWT_SECRET', 'NODE_ENV'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  logger.error('Missing required environment variables', { missingEnvVars });
  process.exit(1);
}

// ============================================
// SECURITY HEADERS
// ============================================

app.use(helmet());

// ============================================
// CORS CONFIGURATION - CRITICAL FOR FRONTEND
// ============================================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked: ${origin}`);
      logger.warn('CORS blocked request', { origin });
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200,
  maxAge: 86400
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

console.log(`✅ CORS configured for: ${process.env.FRONTEND_URL}`);
logger.info('CORS configured', { frontendUrl: process.env.FRONTEND_URL });

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  req.id = uuidv4();
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  logger.http('Request received', {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  next();
});

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Backend is running! 🙏'
  });
});

// ============================================
// YOUR ACTUAL ROUTES - REGISTER THEM HERE
// ============================================

// Authentication routes
app.use('/api/auth', authRouter);

// Quotes routes
app.use('/api/quotes', quotesRouter);

// Subscriptions routes
app.use('/api/subscriptions', subscriptionsRouter);

// Ads routes
app.use('/api/ads', adsRouter);

// Audio routes
app.use('/api/audio', audioRouter);

// Admin routes (protected with admin middleware)
app.use('/api/admin', adminRouter);

// Backup routes (protected with admin middleware)
app.use('/api/backup', backupRouter);

console.log('✅ All routes registered:');
console.log('   - /api/auth (authRouter)');
console.log('   - /api/quotes (quotesRouter)');
console.log('   - /api/subscriptions (subscriptionsRouter)');
console.log('   - /api/ads (adsRouter)');
console.log('   - /api/audio (audioRouter)');
console.log('   - /api/admin (adminRouter - protected)');
console.log('   - /api/backup (backupRouter - protected)');

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  console.warn(`⚠️ 404 Not Found: ${req.method} ${req.path}`);
  logger.warn('404 Not Found', {
    method: req.method,
    path: req.path,
    requestId: req.id
  });
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.id}:`, err.message);
  logger.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    requestId: req.id,
    method: req.method,
    path: req.path,
    status: err.status || 500
  });

  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    requestId: req.id
  });
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
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(30)} ║
║   Status: ✅ READY FOR CONNECTIONS                ║
║   Port: ${String(PORT).padEnd(41)} ║
║                                                    ║
║   CORS Enabled for:                                ║
║   ${process.env.FRONTEND_URL.padEnd(48)} ║
║                                                    ║
║   Available Endpoints:                             ║
║   ✅ GET  /api/health                              ║
║   ✅ POST /api/auth/register                       ║
║   ✅ POST /api/auth/login                          ║
║   ✅ GET  /api/quotes                              ║
║   ✅ GET  /api/subscriptions/status                ║
║   ✅ GET  /api/ads                                 ║
║   ✅ GET  /api/audio                               ║
║                                                    ║
╚════════════════════════════════════════════════════╝
  `);

  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL
  });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const handleShutdown = (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  logger.info('Shutdown signal received', { signal });

  server.close(() => {
    console.log('Server closed');
    logger.info('Server shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after 30 seconds');
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  logger.error('Uncaught exception', {
    message: err.message,
    stack: err.stack
  });
  process.exit(1);
});

export default app;