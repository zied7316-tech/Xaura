# 💈 Tunisia Salon Management SaaS Platform

A comprehensive multi-tenant SaaS platform for salon management, built specifically for the Tunisian market with local payment methods and bilingual support (English/French).

## 🌟 Features

### For Super Admins
- 📊 Platform-wide analytics and growth tracking
- 🏢 Salon and user management
- 💰 Billing and revenue management (TND)
- 📧 Email campaign system
- 🎫 Support ticket management
- 📝 Activity logs and audit trails
- 📈 Advanced reports (PDF/Excel export)
- 💳 Subscription management

### For Salon Owners
- 🏪 Multi-salon management (manage multiple locations)
- 👥 Staff (worker) management
- ✂️ Service catalog management
- 📅 Appointment scheduling
- 💰 Financial tracking and reports
- 📦 Inventory management
- 🎁 Loyalty and rewards program
- 📱 SMS/Email reminders
- 👤 Client database
- 💼 Worker payment and analytics

### For Workers/Barbers
- 📅 Personal appointment calendar
- ⏰ Availability management
- 💬 Client chat system
- 💰 Commission and earnings tracking
- 📊 Performance analytics
- 🔔 Real-time notifications

### For Clients
- 🔍 Search and discover salons
- 📅 Easy appointment booking
- 🔄 Recurring and group bookings
- 💬 Direct chat with barbers
- 🎁 Loyalty points and rewards
- 📱 QR code salon joining
- ⭐ Reviews and ratings

## 🇹🇳 Tunisia-Specific Features

- **Currency**: Tunisian Dinar (TND) - د.ت
- **Local Payment Methods**:
  - Cash
  - Bank Transfer
  - CCP (Postal Account)
  - D17 (Electronic Dinar)
  - Flouci (Mobile Payment)
  - Cheque
  - Card payments

- **Bilingual Support**: 
  - 🇬🇧 English
  - 🇫🇷 French
  - Easy language switching

## 🏗️ Tech Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Context API** for state management
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Query** for data fetching
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads
- **Node-cron** for scheduled tasks
- **PDFKit** & **ExcelJS** for report generation

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd web
npm install
```

4. **Configure Environment Variables**

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/salon-saas
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=30d
NODE_ENV=development

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Stripe (Optional - for international payments)
STRIPE_SECRET_KEY=your-stripe-key
```

Create `web/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

5. **Start the Application**

Backend (from backend directory):
```bash
npm run dev
```

Frontend (from web directory):
```bash
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

## 👤 Default Accounts

### Super Admin
- **Email**: `superadmin@salon.com`
- **Password**: `SuperSecure123!`

### Test Owner
- **Email**: `owner@test.com`
- **Password**: `password123`

### Test Worker
- **Email**: `worker@test.com`
- **Password**: `password123`

### Test Client
- **Email**: `client@test.com`
- **Password**: `password123`

## 💳 Subscription Plans

### Free Trial
- **Duration**: 2 months
- **Features**: Basic features to get started

### Basic Plan
- **Price**: 45 TND/month
- **Features**: 3 workers, 100 appointments/month

### Professional Plan
- **Price**: 85 TND/month
- **Features**: 10 workers, unlimited appointments

### Enterprise Plan
- **Price**: 150 TND/month
- **Features**: Unlimited everything + priority support

## 📱 API Documentation

The API follows RESTful conventions. Key endpoints:

- `/api/auth/*` - Authentication
- `/api/salons/*` - Salon management
- `/api/appointments/*` - Booking system
- `/api/users/*` - User management
- `/api/chat/*` - Messaging system
- `/api/subscriptions/*` - Subscription management

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Secure file upload handling
- Input validation and sanitization
- Protected API routes
- Activity logging

## 🌐 Multi-Language Support

The platform supports:
- English (Default)
- French

Language switcher available in navbar. Translations stored in `/web/src/locales/`.

## 📚 Documentation

Additional documentation available in project:
- `MULTI_SALON_OWNER_GUIDE.md` - Multi-salon management guide
- `SUPER_ADMIN_PASSWORD_FIXED.md` - Super admin setup guide

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd web
npm run build
# Deploy the dist/ folder
```

### Backend (Heroku/Railway/DigitalOcean)
- Set environment variables
- Deploy from backend directory
- Ensure MongoDB connection string is configured

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 📧 Support

For support, email support@yourdomain.com or create an issue in this repository.

## 🙏 Acknowledgments

Built with ❤️ for the Tunisian salon industry.

---

**Made in Tunisia 🇹🇳 | صنع في تونس**
