import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, getDatabase } from './database/db.js';
import roomsRouter from './routes/rooms.js';
import availabilityRouter from './routes/availability.js';
import bookingsRouter from './routes/bookings.js';
import channelRouter from './routes/channel.js';
import revenueRouter from './routes/revenue.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Serve static files from public directory if needed
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'));
}

// Initialize database
await initializeDatabase();
const db = getDatabase();

// Routes
app.use('/api/rooms', roomsRouter);
app.use('/api', availabilityRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/channel', channelRouter);
app.use('/api/revenue', revenueRouter(db));

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Booking engine server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || '*'}`);
  console.log(`🤖 Revenue Management: Enabled`);
});

