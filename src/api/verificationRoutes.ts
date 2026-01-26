/**
 * SECURE VERIFICATION API ENDPOINTS
 * Production-ready REST API for certificate verification
 * 
 * SECURITY FEATURES:
 * - Rate limiting
 * - Input validation
 * - CORS protection
 * - Request logging
 * - Error handling
 */

import express from 'express';
import { verifyCertificateSecure, verifyQRCodeSecure, generateVerificationUrl } from '../services/secureVerificationService';

const router = express.Router();

// Basic CORS middleware
const corsMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://bmi.edu',
    'https://verify.bmi.edu',
    'https://portal.bmi.edu',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin || '')) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

// Basic security headers middleware
const securityMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000');
  next();
};

// Apply security middleware
router.use(corsMiddleware);
router.use(securityMiddleware);

// Simple rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware
const rateLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;
  
  const record = rateLimitStore.get(clientIp);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(clientIp, {
      count: 1,
      resetTime: now + windowMs
    });
    next();
    return;
  }
  
  if (record.count >= maxRequests) {
    return res.status(429).json({
      valid: false,
      error: 'Too many requests',
      code: 'RATE_LIMITED',
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    });
  }
  
  record.count++;
  next();
};

router.use('/api/v1', rateLimitMiddleware);

// Request logging middleware
router.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${clientIp} - UA: ${userAgent}`);
  
  // Attach client info to request
  req.clientInfo = {
    ip: clientIp,
    userAgent: userAgent,
    timestamp: timestamp
  };
  
  next();
});

/**
 * GET /api/v1/verify/:serial
 * Verify certificate by serial number
 */
router.get('/api/v1/verify/:serial', (req, res) => {
  try {
    const { serial } = req.params;
    const { hash } = req.query;
    
    // Input validation
    if (!serial || typeof serial !== 'string') {
      return res.status(400).json({
        valid: false,
        error: 'Serial number is required',
        code: 'MISSING_SERIAL'
      });
    }
    
    // Verify certificate
    const result = verifyCertificateSecure({
      serial: serial.trim(),
      hash: hash as string,
      method: 'online',
      client_ip: req.clientInfo.ip,
      user_agent: req.clientInfo.userAgent
    });
    
    // Set appropriate status code
    const statusCode = result.valid ? 200 : 
                      result.code === 'RATE_LIMITED' ? 429 :
                      result.code === 'CERT_NOT_FOUND' ? 404 :
                      result.code === 'CERT_REVOKED' ? 410 : 400;
    
    res.status(statusCode).json(result);
    
  } catch (error) {
    console.error('Verification API error:', error);
    res.status(500).json({
      valid: false,
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

/**
 * POST /api/v1/verify/qr
 * Verify certificate via QR code
 */
router.post('/api/v1/verify/qr', (req, res) => {
  try {
    const { qr_data } = req.body;
    
    // Input validation
    if (!qr_data || typeof qr_data !== 'string') {
      return res.status(400).json({
        valid: false,
        error: 'QR data is required',
        code: 'MISSING_QR_DATA'
      });
    }
    
    // Verify QR code
    const result = verifyQRCodeSecure(
      qr_data.trim(),
      req.clientInfo.ip,
      req.clientInfo.userAgent
    );
    
    // Set appropriate status code
    const statusCode = result.valid ? 200 : 
                      result.code === 'RATE_LIMITED' ? 429 :
                      result.code === 'CERT_NOT_FOUND' ? 404 :
                      result.code === 'INVALID_QR' ? 400 : 500;
    
    res.status(statusCode).json(result);
    
  } catch (error) {
    console.error('QR Verification API error:', error);
    res.status(500).json({
      valid: false,
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

/**
 * GET /api/v1/certificate/:serial/details
 * Get extended certificate details (admin only)
 */
router.get('/api/v1/certificate/:serial/details', (req, res) => {
  try {
    const { serial } = req.params;
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    // Simple API key validation (in production, use proper authentication)
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Verify certificate first
    const result = verifyCertificateSecure({
      serial: serial.trim(),
      method: 'online',
      client_ip: req.clientInfo.ip,
      user_agent: req.clientInfo.userAgent
    });
    
    if (!result.valid || !result.certificate) {
      return res.status(404).json({
        error: 'Certificate not found',
        code: 'CERT_NOT_FOUND'
      });
    }
    
    // Return extended details
    res.json({
      certificate: {
        ...result.certificate,
        // Add additional admin-only fields
        issued_by: 'Office of the Registrar',
        verification_history: {
          total_verifications: result.verification?.verification_count || 0,
          first_verified: result.certificate.issue_date,
          last_verified: result.verification?.timestamp
        }
      }
    });
    
  } catch (error) {
    console.error('Certificate Details API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

/**
 * POST /api/v1/verify/bulk
 * Bulk verification (admin only)
 */
router.post('/api/v1/verify/bulk', (req, res) => {
  try {
    const { certificates } = req.body;
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    // Authentication
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Input validation
    if (!Array.isArray(certificates) || certificates.length === 0) {
      return res.status(400).json({
        error: 'Certificates array is required',
        code: 'INVALID_INPUT'
      });
    }
    
    if (certificates.length > 100) {
      return res.status(400).json({
        error: 'Maximum 100 certificates allowed per request',
        code: 'TOO_MANY_CERTIFICATES'
      });
    }
    
    // Process bulk verification
    const results = certificates.map(serial => {
      const result = verifyCertificateSecure({
        serial: serial.trim(),
        method: 'online',
        client_ip: req.clientInfo.ip,
        user_agent: req.clientInfo.userAgent
      });
      
      return {
        serial: serial,
        valid: result.valid,
        status: result.certificate?.status || 'not_found',
        error: result.error
      };
    });
    
    // Generate summary
    const summary = {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length
    };
    
    res.json({
      results,
      summary
    });
    
  } catch (error) {
    console.error('Bulk Verification API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

/**
 * GET /api/v1/admin/statistics
 * Get verification statistics (admin only)
 */
router.get('/api/v1/admin/statistics', (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    
    // Authentication
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Mock statistics (in production, query database)
    const statistics = {
      certificates: {
        total_issued: 1250,
        active: 1200,
        revoked: 45,
        suspended: 5
      },
      verifications: {
        total_verifications: 15420,
        today: 45,
        this_month: 1200,
        unique_verifiers: 890
      },
      by_faculty: {
        Theology: 650,
        ICT: 300,
        Business: 200,
        Education: 100
      },
      by_year: {
        2024: 400,
        2023: 350,
        2022: 300,
        2021: 200
      }
    };
    
    res.json(statistics);
    
  } catch (error) {
    console.error('Statistics API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'SERVICE_ERROR'
    });
  }
});

/**
 * GET /api/v1/health
 * Health check endpoint
 */
router.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'BMI University Certificate Verification API'
  });
});

/**
 * Error handling middleware
 */
router.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    valid: false,
    error: 'Internal server error',
    code: 'SERVICE_ERROR'
  });
});

/**
 * 404 handler
 */
router.use((req, res) => {
  res.status(404).json({
    valid: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

export default router;
