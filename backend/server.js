const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB (non-blocking - server will start even if DB fails)
connectDB().catch(err => {
  console.error('Database connection failed, but server will continue:', err.message);
});

// CORS Configuration for Production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://xaura-production.up.railway.app',
  'https://www.xaura.pro',
  'https://xaura.pro',
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      console.log('[CORS] Request with no origin - allowing');
      return callback(null, true);
    }
    
    console.log(`[CORS] Checking origin: ${origin}`);
    
    // Check exact matches first
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`[CORS] ✅ Origin allowed (exact match): ${origin}`);
      return callback(null, true);
    }
    
    // Allow any Railway domain
    if (origin.includes('.railway.app') || origin.includes('.up.railway.app')) {
      console.log(`[CORS] ✅ Origin allowed (Railway): ${origin}`);
      return callback(null, true);
    }
    
    // Allow any xaura.pro subdomain
    if (origin.includes('.xaura.pro') || origin === 'https://xaura.pro' || origin === 'https://www.xaura.pro') {
      console.log(`[CORS] ✅ Origin allowed (xaura.pro): ${origin}`);
      return callback(null, true);
    }
    
    console.log(`[CORS] ❌ Origin NOT allowed: ${origin}`);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Additional OPTIONS handler for preflight requests
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Basic health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Beauty Platform API is running',
    version: '1.0.0'
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    errors: err.errors || []
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error('Error:', err);
  process.exit(1);
});

// Handle SIGTERM (Railway shutdown signal)
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 5000;

// Add error handler for server listen
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`✅ Server listening on 0.0.0.0:${PORT}`);
  console.log(`✅ Health check available at: http://0.0.0.0:${PORT}/`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

