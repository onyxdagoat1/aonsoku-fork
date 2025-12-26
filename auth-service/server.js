require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const session = require('express-session');
const { initDatabase } = require('./config/database');
const { configurePassport } = require('./config/passport');
const { createAuthRoutes } = require('./routes/auth');
const { createUserRoutes } = require('./routes/users');
const { createCommentRoutes } = require('./routes/comments');
const { generalLimiter } = require('./middleware/rateLimit');

const PORT = process.env.PORT || 3005;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session middleware (for OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Rate limiting
app.use(generalLimiter);

// Initialize database
let db;
try {
  db = initDatabase();
  console.log('✅ Database initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize database:', error);
  process.exit(1);
}

// Initialize Passport
const passport = configurePassport(db);
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'aonsoku-auth-service',
    version: '1.0.0',
    database: db.type,
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', createAuthRoutes(db));
app.use('/api/users', createUserRoutes(db));
app.use('/api/comments', createCommentRoutes(db));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🎵 Aonsoku Auth Service');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`💾 Database: ${db.type}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST   /api/auth/register');
  console.log('  POST   /api/auth/login');
  console.log('  POST   /api/auth/logout');
  console.log('  POST   /api/auth/refresh');
  console.log('  GET    /api/auth/me');
  console.log('  GET    /api/auth/google');
  console.log('  GET    /api/auth/discord');
  console.log('  GET    /api/users/:id');
  console.log('  PUT    /api/users/profile');
  console.log('  GET    /api/users/:id/stats');
  console.log('  GET    /api/comments/song/:songId');
  console.log('  GET    /api/comments/album/:albumId');
  console.log('  POST   /api/comments');
  console.log('  DELETE /api/comments/:id');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  if (db && db.close) {
    db.close();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  if (db && db.close) {
    db.close();
  }
  process.exit(0);
});
