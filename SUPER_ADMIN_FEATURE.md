# 👑 Super Admin Feature

## Overview
The Super Admin system allows you (the platform owner) to manage all salons, users, and subscriptions across the entire Xaura platform. This is a multi-tenant architecture where you own the SaaS platform and salon owners are your customers.

## Architecture

### User Hierarchy
```
Super Admin (You - Platform Owner)
  ├── Salon Owners (Your Customers)
  │   ├── Workers (Salon Employees)
  │   └── Clients (Salon Customers)
```

## Features

### 1. Platform Dashboard (`/super-admin/dashboard`)
- **Overview Stats:**
  - Total salons on the platform
  - Total users (owners, workers, clients)
  - Total appointments across all salons
  - Platform-wide revenue

- **Today's Activity:**
  - New appointments today
  - Today's revenue

- **Monthly Stats:**
  - This month's appointments
  - This month's revenue
  - New salons registered

- **Subscription Revenue:**
  - Active subscriptions count
  - Monthly Recurring Revenue (MRR)
  - Total subscription revenue

### 2. Salon Management (`/super-admin/salons`)
- View all registered salons
- See each salon's:
  - Owner information (name, email, phone)
  - Worker count
  - Appointment statistics
  - Revenue generated
  - Subscription plan
  - Creation date

- **Actions:**
  - Suspend/Activate salons
  - View salon details

### 3. User Management (`/super-admin/users`)
- View all users across all salons
- Filter by role (Owner, Worker, Client)
- Search users by name, email, or phone

### 4. Growth Analytics (`/super-admin/analytics/growth`)
- Monthly salon growth trends
- User growth by role
- Revenue growth over time

### 5. Subscriptions (`/super-admin/subscriptions`)
- Track all salon subscriptions
- Manage subscription plans
- View payment history

## Database Models

### Subscription Model
```javascript
{
  salonId: ObjectId,
  ownerId: ObjectId,
  plan: 'free' | 'basic' | 'professional' | 'enterprise',
  monthlyFee: Number,
  status: 'trial' | 'active' | 'suspended' | 'cancelled',
  startDate: Date,
  trialEndDate: Date,
  totalRevenue: Number,
  limits: {
    maxWorkers: Number,
    maxServices: Number,
    maxClients: Number
  }
}
```

## API Endpoints

### Super Admin API (`/api/super-admin/*`)
All endpoints require `SuperAdmin` role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get platform-wide statistics |
| GET | `/salons` | Get all salons with stats |
| PUT | `/salons/:id/status` | Suspend/activate a salon |
| GET | `/users` | Get all users (with filters) |
| GET | `/analytics/growth` | Get growth analytics |

## Creating Your Super Admin Account

### Method 1: Using the Script (Recommended)
```bash
cd backend
node scripts/createSuperAdmin.js
```

**Default credentials:**
- Email: `admin@xaura.com`
- Password: `SuperAdmin123!`

⚠️ **IMPORTANT:** Change these credentials in the script before running!

### Method 2: Manual Database Insert
```javascript
// Connect to MongoDB and run:
db.users.insertOne({
  email: "your-email@example.com",
  password: "$2b$10$...", // Hashed password
  name: "Your Name",
  phone: "+1234567890",
  role: "SuperAdmin",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Security

### Super Admin Protection
1. **Cannot register via API:** Super Admin role is blocked in the registration endpoint.
2. **Script-only creation:** Super Admin accounts can only be created via the backend script.
3. **Role-based access:** All Super Admin routes require authentication and SuperAdmin role.

### Best Practices
1. **Change default credentials immediately** after creating your account
2. **Use a strong password** (minimum 12 characters, mixed case, numbers, symbols)
3. **Enable 2FA** (implement this feature for production)
4. **Limit Super Admin accounts** (only create what you need)
5. **Log all Super Admin actions** (implement audit logging)

## Usage Flow

1. **Setup:**
   ```bash
   # Create Super Admin account
   cd backend
   node scripts/createSuperAdmin.js
   ```

2. **Login:**
   - Navigate to `http://localhost:3000/login`
   - Enter Super Admin credentials
   - You'll be redirected to `/super-admin/dashboard`

3. **Manage Platform:**
   - View all salons and their performance
   - Suspend/activate salons if needed
   - Monitor platform growth
   - Track subscription revenue

## Subscription Plans (Future Enhancement)

You can define different pricing tiers:

### Free Plan (Trial)
- 30-day trial
- 2 workers
- 20 services
- 100 clients

### Basic Plan ($29/month)
- 5 workers
- 50 services
- 500 clients
- Basic features

### Professional Plan ($79/month)
- 15 workers
- Unlimited services
- Unlimited clients
- Advanced features
- Priority support

### Enterprise Plan ($199/month)
- Unlimited workers
- Unlimited everything
- Custom features
- Dedicated support

## Next Steps

1. **Payment Integration:**
   - Integrate Stripe for subscription payments
   - Implement automatic billing
   - Send invoices to salon owners

2. **Usage Limits:**
   - Enforce plan limits (max workers, services, etc.)
   - Block actions when limits are reached
   - Upgrade prompts

3. **Analytics Enhancement:**
   - Advanced growth charts
   - Revenue forecasting
   - Churn analysis
   - Customer lifetime value

4. **Notifications:**
   - Alert when salon reaches plan limits
   - Payment failure notifications
   - New salon sign-ups

5. **Support System:**
   - Ticket system for salon owners
   - Live chat integration
   - Knowledge base

## Files Changed

### Backend
- `backend/models/User.js` - Added SuperAdmin role
- `backend/models/Subscription.js` - New subscription model
- `backend/controllers/superAdminController.js` - Super Admin API logic
- `backend/routes/superAdminRoutes.js` - Super Admin routes
- `backend/controllers/authController.js` - Block SuperAdmin registration
- `backend/scripts/createSuperAdmin.js` - Account creation script
- `backend/server.js` - Added super admin routes

### Frontend
- `web/src/pages/superadmin/SuperAdminDashboard.jsx` - Main dashboard
- `web/src/pages/superadmin/SalonManagementPage.jsx` - Salon management
- `web/src/services/superAdminService.js` - API service
- `web/src/context/AuthContext.jsx` - Added isSuperAdmin flag
- `web/src/components/layout/Sidebar.jsx` - Super Admin navigation
- `web/src/App.jsx` - Super Admin routes

---

**You are now the Super Admin of your Xaura platform! 👑**




