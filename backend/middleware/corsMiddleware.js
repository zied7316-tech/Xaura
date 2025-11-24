/**
 * CORS Middleware - Strict Origin Control
 * Only allows specific origins for security
 */

const cors = require('cors');

// Allowed origins - EXACT matches only
const allowedOrigins = [
  'https://www.xaura.pro',
  'https://xaura.pro',
  'http://localhost:5173',
  'http://localhost:3000'
];

// CORS options with strict origin checking
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    // But log them for debugging
    if (!origin) {
      console.log('[CORS] Request with no origin - allowing (mobile/Postman/curl)');
      return callback(null, true);
    }
    
    console.log(`[CORS] Checking origin: ${origin}`);
    
    // Check if origin is in allowed list (exact match)
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`[CORS] ✅ Origin allowed: ${origin}`);
      return callback(null, true);
    }
    
    // Reject all other origins - but log for debugging
    console.log(`[CORS] ❌ Origin NOT allowed: ${origin}`);
    console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
    console.log(`[CORS] Received origin: "${origin}"`);
    console.log(`[CORS] Type check - origin is string: ${typeof origin === 'string'}`);
    
    // Return error - the cors package will handle setting headers
    callback(new Error(`Not allowed by CORS policy. Origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'Content-Length',
    'Content-Type'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400 // 24 hours
};

// Create CORS middleware
const corsMiddleware = cors(corsOptions);

// Manual preflight handler for OPTIONS requests
const handlePreflight = (req, res, next) => {
  // If it's an OPTIONS request, handle it immediately
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    
    // Check if origin is allowed
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      // Set CORS headers manually
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
      res.setHeader('Access-Control-Max-Age', '86400');
      
      console.log(`[CORS] ✅ Preflight OPTIONS request handled for: ${origin || 'no origin'}`);
      return res.status(200).end();
    } else {
      console.log(`[CORS] ❌ Preflight OPTIONS rejected for: ${origin}`);
      return res.status(403).json({
        success: false,
        message: 'CORS policy: Origin not allowed'
      });
    }
  }
  
  // For non-OPTIONS requests, continue to next middleware
  next();
};

module.exports = {
  corsMiddleware,
  handlePreflight,
  corsOptions
};

