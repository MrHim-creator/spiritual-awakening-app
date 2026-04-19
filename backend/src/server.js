import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting server...');
console.log('Environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  FRONTEND_URL: process.env.FRONTEND_URL ? '✓ Set' : '❌ Missing'
});

// ============================================
// CORS CONFIGURATION
// ============================================

const corsOptions = {
  origin: function (origin, callback) {
    console.log(`🔍 CORS check for origin: ${origin || 'no-origin'}`);
    
    // Allow no origin (mobile, curl)
    if (!origin) {
      console.log('✅ No origin provided, allowing');
      return callback(null, true);
    }
    
    // Check if origin matches FRONTEND_URL
    if (origin === process.env.FRONTEND_URL) {
      console.log('✅ Origin matches FRONTEND_URL');
      callback(null, true);
    } else {
      console.log(`❌ Origin blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Apply CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

console.log(`✅ CORS configured for: ${process.env.FRONTEND_URL}`);

// ============================================
// MIDDLEWARE
// ============================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ============================================
// TEST ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  console.log('✅ Health check endpoint hit');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Backend is running! 🙏'
  });
});

// Test registration
app.post('/api/auth/register', (req, res) => {
  console.log('📝 Register endpoint hit');
  console.log('Request body:', req.body);
  
  const { email, username, password } = req.body;
  
  // Validation
  if (!email || !username || !password) {
    return res.status(400).json({
      error: 'Email, username, and password are required'
    });
  }
  
  if (password.length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters'
    });
  }
  
  // Success response (dummy - replace with real DB logic)
  res.status(201).json({
    message: 'User registered successfully',
    user: {
      email,
      username,
      id: Math.random().toString(36).substr(2, 9)
    }
  });
});

// Test login
app.post('/api/auth/login', (req, res) => {
  console.log('🔑 Login endpoint hit');
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required'
    });
  }
  
  res.json({
    message: 'Login successful',
    token: 'dummy-token-' + Math.random().toString(36).substr(2, 9),
    user: { email }
  });
});

// Test quotes
app.get('/api/quotes/random', (req, res) => {
  console.log('✨ Random quote endpoint hit');
  
  res.json({
    id: 1,
    text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.',
    author: 'Nelson Mandela',
    category: 'wisdom'
  });
});

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    message: 'Endpoint does not exist. Check your API path.'
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error('❌ ERROR:', err.message);
  console.error(err.stack);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🙏 SPIRITUAL AWAKENING APP - BACKEND            ║
║                                                    ║
║   Status: ✅ READY FOR CONNECTIONS                ║
║   Port: ${String(PORT).padEnd(41)} ║
║   CORS: ✅ Enabled                                 ║
║                                                    ║
║   Frontend URL:                                    ║
║   ${(process.env.FRONTEND_URL || 'NOT SET').padEnd(48)} ║
║                                                    ║
║   Available Endpoints:                             ║
║   ✅ GET  /api/health                              ║
║   ✅ POST /api/auth/register                       ║
║   ✅ POST /api/auth/login                          ║
║   ✅ GET  /api/quotes/random                       ║
║                                                    ║
╚════════════════════════════════════════════════════╝
  `);
});

export default app;
