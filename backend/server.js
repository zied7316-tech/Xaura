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

// API Routes - Load with error handling
try {
  console.log('📦 Loading API routes...');
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/profile', require('./routes/profileRoutes'));
  app.use('/api/salon-account', require('./routes/salonAccountRoutes'));
  app.use('/api/salons', require('./routes/salonRoutes'));
  app.use('/api/services', require('./routes/serviceRoutes'));
  app.use('/api/appointments', require('./routes/appointmentRoutes'));
  app.use('/api/appointment-management', require('./routes/appointmentManagementRoutes'));
  app.use('/api/notifications', require('./routes/notificationRoutes'));
  app.use('/api/payments', require('./routes/paymentRoutes'));
  app.use('/api/expenses', require('./routes/expenseRoutes'));
  app.use('/api/analytics', require('./routes/analyticsRoutes'));
  app.use('/api/customers', require('./routes/customerRoutes'));
  app.use('/api/inventory', require('./routes/inventoryRoutes'));
  app.use('/api/reports', require('./routes/reportsRoutes'));
  app.use('/api/qr', require('./routes/qrRoutes'));
  app.use('/api/day-closure', require('./routes/dayClosureRoutes'));
  app.use('/api/workers', require('./routes/workerRoutes'));
  app.use('/api/upload', require('./routes/uploadRoutes'));
  app.use('/api/worker-finance', require('./routes/workerFinanceRoutes'));
  app.use('/api/salon-search', require('./routes/salonSearchRoutes'));
  app.use('/api/availability', require('./routes/availabilityRoutes'));
  app.use('/api/worker-status', require('./routes/workerStatusRoutes'));
  app.use('/api/worker-tracking', require('./routes/workerTrackingRoutes'));
  app.use('/api/salon-clients', require('./routes/salonClientRoutes'));
  app.use('/api/reminders', require('./routes/reminderRoutes'));
  app.use('/api/loyalty', require('./routes/loyaltyRoutes'));
  app.use('/api/advanced-booking', require('./routes/advancedBookingRoutes'));
  app.use('/api/reviews', require('./routes/reviewRoutes'));
  app.use('/api/search', require('./routes/searchRoutes'));
  app.use('/api/super-admin', require('./routes/superAdminRoutes'));
  app.use('/api/super-admin/activity-logs', require('./routes/activityLogRoutes'));
  app.use('/api/super-admin/reports', require('./routes/reportRoutes'));
  app.use('/api/super-admin/campaigns', require('./routes/emailCampaignRoutes'));
  app.use('/api/tickets', require('./routes/supportTicketRoutes'));
  app.use('/api/chats', require('./routes/chatRoutes'));
  app.use('/api/my-salons', require('./routes/salonOwnershipRoutes'));
  app.use('/api/billing', require('./routes/billingRoutes'));
  app.use('/api/owner/subscription', require('./routes/ownerSubscriptionRoutes'));
  console.log('✅ All API routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading API routes:', error.message);
  console.error('Stack:', error.stack);
  // Don't exit - let server start and show errors on requests
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

