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

// Connect to MongoDB
connectDB();

// CORS Configuration for Production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://xaura-production.up.railway.app', // Backend URL
      'https://www.xaura.pro', // Custom domain
      'https://xaura.pro', // Root domain
    ];
    
    // Allow any Railway domain, custom domain, or exact matches
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      origin.includes('.railway.app') ||
      origin.includes('.up.railway.app') ||
      origin.includes('.xaura.pro')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
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

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/salon-account', require('./routes/salonAccountRoutes')); // Salon-First Registration
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

