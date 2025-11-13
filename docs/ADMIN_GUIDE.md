# 🔧 Xaura - Administrator & Deployment Guide

## 📚 Technical Documentation

---

## 🚀 **Installation & Setup**

### **Prerequisites:**
- Node.js 16+
- MongoDB (local or Atlas)
- Git

### **Initial Setup:**

```bash
# 1. Clone repository
git clone https://github.com/chaimahannechi114455-prog/BZ.git
cd BZ

# 2. Backend setup
cd backend
npm install

# Create .env file:
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/xaura
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

# Start backend
npm run dev

# 3. Frontend setup
cd ../web
npm install

# Create .env file:
VITE_API_URL=http://localhost:5000/api

# Start frontend
npm run dev

# 4. Open browser
http://localhost:3000
```

---

## 🗄️ **Database Models:**

### **Core Models:**
- User (Owner/Worker/Client)
- Salon
- Service
- Appointment
- Payment
- WorkerEarning
- WorkerWallet
- WorkerInvoice

### **Advanced Models (New):**
- Product (Inventory)
- CustomerProfile (CRM)
- Notification
- ReminderSettings
- LoyaltyProgram
- LoyaltyTransaction
- RecurringAppointment
- GroupBooking
- Review

**Total: 17 models**

---

## 🔌 **API Endpoints:**

### **Categories:**
- Authentication: 3 endpoints
- Salons: 8 endpoints
- Services: 6 endpoints
- Appointments: 8 endpoints
- Appointment Management: 8 endpoints
- Workers: 6 endpoints
- Payments: 5 endpoints
- **Reports: 1 endpoint**
- **Inventory: 8 endpoints**
- **Customers: 5 endpoints**
- **Notifications: 6 endpoints**
- **Reminders: 5 endpoints**
- **Loyalty: 4 endpoints**
- **Advanced Booking: 5 endpoints**
- **Reviews: 5 endpoints**
- **Search: 1 endpoint**

**Total: 84 endpoints**

---

## 📊 **Third-Party Integrations:**

### **SMS (Twilio):**
```env
# Get from: twilio.com
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### **Email (Gmail):**
```env
# Use App Password from: myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=app_password_here
```

---

## 🔐 **Security:**

- JWT authentication
- Bcrypt password hashing
- Role-based access control
- Protected routes
- Input validation
- MongoDB indexes for performance

---

## 📈 **Performance Optimization:**

- Database indexes on all query fields
- Pagination on large lists
- Image optimization recommended
- Auto-delete old notifications (30 days TTL)
- Efficient MongoDB aggregations

---

## 🚀 **Deployment:**

### **Recommended Platforms:**

**Backend:**
- Railway (easiest)
- Render
- Heroku
- DigitalOcean

**Frontend:**
- Vercel
- Netlify
- Railway

**Database:**
- MongoDB Atlas (free tier available)

### **Environment Variables (Production):**

**Backend:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/xaura
JWT_SECRET=generate_secure_random_string
JWT_EXPIRE=7d
```

**Frontend:**
```env
VITE_API_URL=https://your-backend.railway.app/api
```

---

## 📝 **Maintenance Tasks:**

### **Daily:**
- Monitor error logs
- Check notification delivery
- Verify payment processing

### **Weekly:**
- Review database size
- Check for failed notifications
- Monitor API performance

### **Monthly:**
- Database backup
- Review user feedback
- Update dependencies

---

## 🔍 **Monitoring:**

### **Key Metrics:**
- Active users
- Appointments per day
- Revenue trends
- API response times
- Error rates
- Notification delivery rates

---

## 🆘 **Troubleshooting:**

### **Common Issues:**

**Database Connection:**
```bash
# Check MongoDB is running
mongod --version

# Test connection
mongo mongodb://localhost:27017/xaura
```

**Port Already in Use:**
```bash
# Kill process on port 5000
taskkill /F /PID (process_id)
```

**Dependencies:**
```bash
# Clear and reinstall
rm -rf node_modules
npm install
```

---

## 📚 **Documentation Files:**

- `USER_GUIDE.md` - Complete user manual
- `QUICK_START_OWNER.md` - Owner 10-min setup
- `QUICK_START_WORKER.md` - Worker 5-min setup
- `QUICK_START_CLIENT.md` - Client 3-min setup
- `ADMIN_GUIDE.md` - This technical guide
- `DEPLOYMENT.md` - Deployment instructions
- Feature-specific guides (14 files)

---

**For deployment help, see DEPLOYMENT.md** 🚀




