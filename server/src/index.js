import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase, getDatabase } from './database/db.js';
import roomsRouter from './routes/rooms.js';
import availabilityRouter from './routes/availability.js';
import bookingsRouter from './routes/bookings.js';
import channelRouter from './routes/channel.js';
import revenueRouter from './routes/revenue.js';
import createRoomPricesRouter from './routes/room-prices.js';
import uploadRouter from './routes/upload.js';
import roomImagesRouter from './routes/room-images.js';
import { startChannelAutomationScheduler } from './services/channelAutomation.js';
import crmRouter from './routes/crm.js';
import feedbackRouter from './routes/feedback.js';
import authRouter from './routes/auth.js';
import ttlockRouter from './routes/ttlock.js';
import webhooksRouter from './routes/webhooks.js';
import templatesRouter from './routes/templates.js';
import preferencesRouter from './routes/preferences.js';
import recommendationsRouter from './routes/recommendations.js';
import experienceBookingsRouter from './routes/experienceBookings.js';
import { startCrmScheduler, runAutomations } from './services/crmService.js';
import { syncGuestsFromBookings } from './services/guestService.js';
import { isTtlockReady } from './services/ttlockService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Serve static files
const rootDir = path.join(__dirname, '..', '..');
const clientDistPath = path.join(rootDir, 'client', 'dist');

// Serve client build (Vite output)
app.use(express.static(clientDistPath));
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// In development, also serve from root for HTML files
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(rootDir));
  app.use('/client', express.static(path.join(rootDir, 'client')));
}

// Initialize database
await initializeDatabase();
const db = getDatabase();
await syncGuestsFromBookings();

// Routes
app.use('/api/rooms', roomsRouter);
app.use('/api', availabilityRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/channel', channelRouter);
app.use('/api/crm', crmRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/auth', authRouter);
app.use('/api/ttlock', ttlockRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/preferences', preferencesRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/experience-bookings', experienceBookingsRouter);
app.use('/api/revenue', revenueRouter(db));
app.use('/api/room-prices', createRoomPricesRouter(db));
app.use('/api/upload', uploadRouter);
app.use('/api/room-images', roomImagesRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Catch-all: serve client app for non-API routes (SPA routing)
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist', 'index.html');
  res.sendFile(clientDistPath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Route not found' });
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Booking engine server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || '*'}`);
  console.log(`🤖 Revenue Management: Enabled`);
  startChannelAutomationScheduler();
  startCrmScheduler();
  // Run automations once on boot to capture fresh guests
  runAutomations().catch((error) => console.error('CRM automation error:', error));
});

