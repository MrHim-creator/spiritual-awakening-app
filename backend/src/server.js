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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  FRONTEND_URL
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging and ID
app.use((req, res, next) => {
  req.id = uuidv4();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - RequestID: ${req.id}`);
  next();
});

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Apply rate limiting to API routes
app.use('/api/', rateLimiter.apiLimiter);
app.use('/api/auth/login', rateLimiter.authLimiter);
app.use('/api/auth/register', rateLimiter.authLimiter);

// ============================================
// ROUTES
// ============================================

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Spiritual Awakening App Backend is running!'
  });
});

// Auth routes
app.use('/api/auth', authRouter);

// Quotes routes
app.use('/api/quotes', quotesRouter);

// Subscriptions routes
app.use('/api/subscriptions', subscriptionsRouter);

// Ads routes
app.use('/api/ads', adsRouter);

// Audio routes
app.use('/api/audio', audioRouter);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.id}:`, err);

  // Don't leak stack traces in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// ============================================
// SERVER STARTUP
// ============================================

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🙏 SPIRITUAL AWAKENING APP - BACKEND RUNNING    ║
║                                                    ║
║   Server: http://localhost:${PORT}                  ║
║   Frontend: ${FRONTEND_URL}
║   Database: SQLite                                 ║
║   Status: ✓ READY                                  ║
║                                                    ║
║   Built by: MrHim-Creator from South Africa      ║
║                                                    ║
╚════════════════════════════════════════════════════╝
  `);
});

export default app;
