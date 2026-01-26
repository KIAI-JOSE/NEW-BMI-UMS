/**
 * SECURE VERIFICATION API SERVER
 * Production-ready Express server for certificate verification
 */

import express from 'express';
import { createServer } from 'http';
import verificationRoutes from './verificationRoutes';

// Initialize Express app
const app = express();
const server = createServer(app);

// Environment configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// API routes
app.use(verificationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'BMI University Certificate Verification API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      verify: '/api/v1/verify/:serial',
      verifyQR: '/api/v1/verify/qr',
      certificateDetails: '/api/v1/certificate/:serial/details',
      bulkVerify: '/api/v1/verify/bulk',
      statistics: '/api/v1/admin/statistics',
      health: '/api/v1/health'
    },
    documentation: 'https://docs.verify.bmi.edu'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 BMI Verification API Server running on port ${PORT}`);
  console.log(`📖 Environment: ${NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;
