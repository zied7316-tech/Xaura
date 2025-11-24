const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');
const { corsMiddleware, handlePreflight } = require('./middleware/corsMiddleware');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB (non-blocking - server will start even if DB fails)
// But retry connection in background
connectDB().catch(err => {
  console.error('Database connection failed, but server will continue:', err.message);
  console.error('Will retry connection in 5 seconds...');
  
  // Retry connection after 5 seconds
  setTimeout(() => {
    console.log('🔄 Retrying MongoDB connection...');
    connectDB().catch(retryErr => {
      console.error('Retry failed:', retryErr.message);
    });
  }, 5000);
});

// ============================================
// CORS MIDDLEWARE - MUST BE FIRST
// ============================================
// Handle preflight OPTIONS requests FIRST (before CORS middleware)
app.use(handlePreflight);

// Apply CORS middleware to all routes
app.use(corsMiddleware);

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Additional OPTIONS handler as fallback
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://www.xaura.pro',
    'https://xaura.pro',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  if (!origin || allowedOrigins.indexOf(origin) !== -1) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  return res.status(403).json({
    success: false,
    message: 'CORS policy: Origin not allowed'
  });
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request timeout middleware - Faster timeout for critical endpoints
app.use((req, res, next) => {
  // Skip timeout for health checks
  if (req.path === '/' || req.path === '/health') {
    return next();
  }

  // Faster timeout for login (12 seconds) - optimized for better UX
  const isLogin = req.path === '/api/auth/login' && req.method === 'POST';
  const timeoutDuration = isLogin ? 12000 : 25000; // 12s for login (optimized), 25s for others

  // Set a timeout for the request
  let timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`⏱️  Request timeout: ${req.method} ${req.path} (${timeoutDuration}ms)`);
      res.status(504).json({
        success: false,
        message: 'Request timeout - the server took too long to respond'
      });
      res.end();
    }
  }, timeoutDuration);

  // Clear timeout when response is sent
  const originalEnd = res.end;
  res.end = function(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    return originalEnd.apply(this, args);
  };

  next();
});

// Request timing middleware - Log slow requests
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    if (duration > 2000) {
      console.warn(`⚠️  Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
    originalEnd.apply(this, args);
  };
  next();
});

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve APK downloads
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Specific handler for APK download with better error handling
app.get('/downloads/xaura.apk', (req, res) => {
  const filePath = path.join(__dirname, 'downloads', 'xaura.apk');
  
  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'xaura.apk', (err) => {
      if (err) {
        console.error('Error downloading APK:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error downloading file'
          });
        }
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'APK file not found. Please contact support or build the app first.',
      instructions: 'To build the APK, run: cd mobile && flutter build apk --release'
    });
  }
});

// Basic health check route - Fast response for Railway health checks
app.get('/', (req, res) => {
  // Fast response without any database checks
  res.json({
    success: true,
    message: 'Beauty Platform API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Dedicated health check endpoint for Railway
app.get('/health', (req, res) => {
  // Ultra-fast health check - no DB, no processing
  res.status(200).json({ 
    status: 'ok', 
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

// API Routes - Load with error handling for each route
const loadRoute = (path, routeFile) => {
  try {
    app.use(path, require(routeFile));
    console.log(`✅ Loaded route: ${path}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to load route ${path}:`, error.message);
    console.error(`   File: ${routeFile}`);
    console.error(`   Stack: ${error.stack}`);
    return false;
  }
};

console.log('📦 Loading API routes...');
let routesLoaded = 0;
let routesFailed = 0;

if (loadRoute('/api/auth', './routes/authRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/profile', './routes/profileRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/salon-account', './routes/salonAccountRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/salons', './routes/salonRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/services', './routes/serviceRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/appointments', './routes/appointmentRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/appointment-management', './routes/appointmentManagementRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/notifications', './routes/notificationRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/payments', './routes/paymentRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/expenses', './routes/expenseRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/analytics', './routes/analyticsRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/customers', './routes/customerRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/inventory', './routes/inventoryRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/reports', './routes/reportsRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/qr', './routes/qrRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/day-closure', './routes/dayClosureRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/workers', './routes/workerRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/upload', './routes/uploadRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/worker-finance', './routes/workerFinanceRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/salon-search', './routes/salonSearchRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/availability', './routes/availabilityRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/worker-status', './routes/workerStatusRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/worker-tracking', './routes/workerTrackingRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/salon-clients', './routes/salonClientRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/reminders', './routes/reminderRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/loyalty', './routes/loyaltyRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/advanced-booking', './routes/advancedBookingRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/reviews', './routes/reviewRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/search', './routes/searchRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/super-admin', './routes/superAdminRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/super-admin/activity-logs', './routes/activityLogRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/super-admin/reports', './routes/reportRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/super-admin/campaigns', './routes/emailCampaignRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/tickets', './routes/supportTicketRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/chats', './routes/chatRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/my-salons', './routes/salonOwnershipRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/billing', './routes/billingRoutes')) routesLoaded++; else routesFailed++;
if (loadRoute('/api/owner/subscription', './routes/ownerSubscriptionRoutes')) routesLoaded++; else routesFailed++;

console.log(`✅ Route loading complete: ${routesLoaded} loaded, ${routesFailed} failed`);
if (routesFailed > 0) {
  console.warn(`⚠️  ${routesFailed} route(s) failed to load. Server will continue but those endpoints will not work.`);
}

// Error handling middleware - MUST include CORS headers
app.use((err, req, res, next) => {
  // Set CORS headers even on errors (including CORS errors)
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://www.xaura.pro',
    'https://xaura.pro',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  // Always set CORS headers if origin is present (even if not allowed, so browser can show error)
  if (origin) {
    // If origin is allowed, set it; otherwise set a generic header
    if (allowedOrigins.indexOf(origin) !== -1) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      // For CORS errors, still set headers so browser can display the error properly
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }
  
  // Log the error
  console.error('[ERROR]', err.message);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  
  // If it's a CORS error, return 403 with CORS headers
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({
      success: false,
      message: err.message,
      origin: origin || 'none'
    });
  }
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    errors: err.errors || []
  });
});

// 404 handler - MUST include CORS headers
app.use((req, res) => {
  // Set CORS headers even on 404
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://www.xaura.pro',
    'https://xaura.pro',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  if (origin && allowedOrigins.indexOf(origin) !== -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION!');
  console.error('Error:', err.name, err.message);
  console.error('Stack:', err.stack);
  // Don't exit immediately - log and let the server try to continue
  // Only exit if it's a critical error
  if (err.code === 'EADDRINUSE' || err.code === 'ECONNREFUSED') {
    console.error('Critical error, exiting...');
    setTimeout(() => process.exit(1), 1000);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  // Don't exit immediately - log and continue
  // This prevents the server from crashing on non-critical promise rejections
});

// Start server
const PORT = process.env.PORT || 5000;

// Declare server variable first (will be assigned below)
let server;

// Handle graceful shutdown
let shuttingDown = false;

function gracefulShutdown(signal) {
  if (shuttingDown) {
    console.log(`⚠️  ${signal} received again, forcing exit...`);
    process.exit(0);
    return;
  }
  shuttingDown = true;
  
  console.log(`⚠️  ${signal} received. Shutting down gracefully...`);
  
  if (server) {
    server.close((err) => {
      if (err) {
        console.error('❌ Error closing server:', err.message);
        process.exit(1);
      }
      console.log('✅ HTTP server closed gracefully');
      
      // Close MongoDB connection (Mongoose 7+ uses Promises, not callbacks)
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        mongoose.connection.close(false)
          .then(() => {
            console.log('✅ MongoDB connection closed');
            process.exit(0);
          })
          .catch((err) => {
            console.error('❌ Error closing MongoDB connection:', err.message);
            process.exit(0); // Exit anyway
          });
      } else {
        process.exit(0);
      }
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      console.log('⚠️  Force exiting after timeout');
      process.exit(0);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Handle SIGTERM (Railway shutdown signal)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Add error handler for server listen
try {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`✅ Server listening on 0.0.0.0:${PORT}`);
    console.log(`✅ Health check available at: http://0.0.0.0:${PORT}/`);
    console.log(`✅ Server will stay alive and handle requests`);
    
    // Set server timeout to 30 seconds (Railway's limit is 30s, but we need buffer)
    if (server) {
      server.timeout = 30000; // Increased from 25s to 30s for better reliability
      server.keepAliveTimeout = 65000; // Keep connections alive for 65 seconds
      server.headersTimeout = 66000; // Headers timeout slightly higher than keepAliveTimeout
      console.log(`✅ Server timeouts configured: timeout=${server.timeout}ms, keepAlive=${server.keepAliveTimeout}ms`);
    }
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err.message);
    console.error('Error code:', err.code);
    console.error('Error stack:', err.stack);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    }
    // Don't exit immediately - let Railway handle it
    setTimeout(() => process.exit(1), 1000);
  });

  server.on('listening', () => {
    console.log('✅ Server is now listening and ready for connections');
  });

  // Keep server alive - prevent unexpected exits
  server.on('close', () => {
    console.log('⚠️  Server close event received');
  });
} catch (error) {
  console.error('❌ Failed to create server:', error.message);
  console.error('Error stack:', error.stack);
  process.exit(1);
}

