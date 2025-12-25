import express from 'express';
import cors from 'cors';
import config from './config.js';
import uploadRoutes from './routes/upload.js';
import metadataRoutes from './routes/metadata.js';
import HistoryService from './services/HistoryService.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'aonsoku-upload-v2',
    version: '2.0.0',
    config: {
      musicPath: config.musicPath,
      navidromeEnabled: config.navidrome.enabled,
    },
  });
});

// API routes
app.use('/api/upload', uploadRoutes);
app.use('/api/metadata', metadataRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  // Multer errors
  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: error.message || 'Internal server error' });
});

// Start server
async function start() {
  try {
    // Load upload history
    await HistoryService.load();
    console.log('Upload history loaded');

    // Start listening
    app.listen(config.port, () => {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  Aonsoku Upload Service v2.0');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  Server:    http://localhost:${config.port}`);
      console.log(`  Music:     ${config.musicPath}`);
      console.log(`  Navidrome: ${config.navidrome.enabled ? 'Enabled' : 'Disabled'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

start();
