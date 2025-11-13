# Salon Account - Complete Specification

## 🏢 Overview

The Salon Account is a **complete business management environment** - not just a booking profile, but an all-in-one digital business hub.

---

## 📋 Core Components

### 1. Salon Profile (Business Identity)

**Contains:**
- Name, address, contact details
- Description and branding
- Working hours (configurable by day)
- Geographic location (for maps/discovery)
- Unique QR code (for client acquisition)
- Business mode (Solo or Team)

**Ownership:**
- Each salon = 1 Owner account
- Owner manages everything from one dashboard

---

### 2. Operating Modes

#### Solo Mode
- Owner works alone
- Owner is the only service provider
- Simplified interface
- All bookings assigned to owner
- All revenue goes to owner

#### Team Mode  
- Owner manages multiple workers
- Each worker has independent login
- Workers have personal schedules
- Commission/salary system active
- Team performance tracking

**Toggle:** Owner can switch between modes anytime

---

### 3. User Roles & Permissions

#### Owner
**Can:**
- ✅ Create, edit, manage all salon data
- ✅ Add/remove workers
- ✅ Create/edit services
- ✅ View all bookings
- ✅ Record expenses
- ✅ View complete financials
- ✅ Generate reports
- ✅ Close the day
- ✅ Export data

**Cannot:**
- ❌ Delete the salon (only deactivate)

#### Worker
**Can:**
- ✅ Login independently
- ✅ View own schedule/appointments
- ✅ Update appointment status (confirm/complete)
- ✅ View own commissions
- ✅ See own performance metrics

**Cannot:**
- ❌ View other workers' data
- ❌ Edit salon settings
- ❌ See full financials
- ❌ Add/remove services
- ❌ Access expenses

#### Client
**Can:**
- ✅ Book appointments
- ✅ View salon details
- ✅ See own booking history
- ✅ Cancel bookings (with policy)
- ✅ Rate services
- ✅ Scan QR codes

**Cannot:**
- ❌ See other clients' data
- ❌ View salon financials
- ❌ Edit salon information

---

### 4. Service Management

**Service Properties:**
- Name (e.g., "Haircut Deluxe")
- Duration (minutes)
- Price
- Category (Haircut, Coloring, Manicure, etc.)
- Description
- Image (optional)

**Service Assignment:**
- **General Availability:** Any worker can provide
- **Worker-Specific:** Linked to specific workers only
- **Owner-Only:** In Solo Mode

**Pricing:**
- Base price (standard)
- Dynamic pricing (peak hours, special days)
- Package deals (combo services)

---

### 5. Booking System (Core Feature)

**Booking Structure:**
```
Booking = {
  client: User (Client role)
  worker: User (Worker role)
  service: Service
  startTime: DateTime
  endTime: DateTime (calculated from service duration)
  price: Number (captured at booking time)
  status: pending | confirmed | completed | cancelled
  paymentStatus: pending | paid | refunded
  notes: String
}
```

**Booking States:**
1. **Pending** - Just created, awaiting confirmation
2. **Confirmed** - Salon confirmed, client notified
3. **Completed** - Service done, payment recorded
4. **Cancelled** - Cancelled by client or salon

**Smart Booking:**
- ✅ Checks worker availability
- ✅ Prevents double-booking
- ✅ Respects salon working hours
- ✅ Considers service duration
- ✅ Suggests alternative slots if unavailable
- ✅ Blocks past dates

---

### 6. QR Code System (Client Acquisition)

**How It Works:**
1. Each salon gets unique QR code on creation
2. QR code contains: `salon_id` and registration link
3. When scanned:
   - Opens registration page
   - Client signs up
   - **Automatically linked to that salon**
   - Client added to salon's customer base
4. Client can immediately book

**Benefits:**
- Organic client acquisition
- No manual salon selection needed
- Salon builds its own client base
- Easy in-store marketing

**QR Code Features:**
- Downloadable (PNG, SVG)
- Printable (A4, flyer size)
- Shareable (link format)
- Trackable (scan analytics)

---

### 7. Notification System

**Current:** Mock SMS/WhatsApp (architecture ready)

**Triggers:**
- 📅 Booking confirmation
- ✅ Booking confirmed by salon
- ❌ Booking cancelled
- 🔔 Reminder (1 day before)
- 💰 Payment confirmation
- ⏰ Day-end summary to owner

**Channels:**
- SMS (Twilio-ready)
- WhatsApp (Cloud API-ready)
- Email (future)
- Push notifications (mobile)

**Notification Templates:**
```
"Hi {client}, your appointment at {salon} for {service} 
on {date} at {time} is confirmed! See you soon!"
```

---

### 8. Financial System (Internal Money Flow)

#### Revenue Tracking

**Booking Completion Flow:**
```
1. Service completed
2. Owner/Worker marks as complete
3. Payment recorded (cash/card/online)
4. System calculates:
   - Total amount
   - Worker commission (based on payment model)
   - Salon net revenue
5. Updates financial dashboard
```

#### Worker Payment Models

**Three Models:**

**Model 1: Fixed Salary**
```
Worker gets: $2000/month (fixed)
Commission: None
Salon keeps: All revenue
```

**Model 2: Percentage Commission**
```
Worker gets: 50% of booking price
Example: $100 service → Worker: $50, Salon: $50
Variable income based on performance
```

**Model 3: Hybrid (Salary + Commission)**
```
Base salary: $1000/month
Commission: 30% of bookings
Example: $5000 in services → Worker: $1000 + $1500 = $2500
```

**Configuration:**
- Owner sets payment model per worker
- Can change monthly
- Automatically calculated
- Tracked in commission reports

#### Expense Tracking

**Categories:**
- 🏠 Rent
- 💡 Utilities (electricity, water, internet)
- 🛒 Product purchases (shampoo, colors, etc.)
- 🔧 Maintenance
- 📱 Marketing
- 🚗 Transport
- 💼 Other

**Each Expense:**
- Date
- Amount
- Category
- Description
- Receipt number (optional)
- Recurring or one-time

**Auto-Deduction:**
```
Net Profit = Total Revenue - Worker Commissions - Expenses
```

#### Financial Reports

**Daily Report:**
- Revenue earned today
- Bookings completed
- Payment methods used (cash vs card)
- Worker performance
- Expenses recorded
- Net profit for the day

**Monthly Report:**
- Total revenue
- Total expenses
- Worker payouts
- Top services
- Best workers
- Net profit
- Profit margin %

**Custom Reports:**
- Any date range
- Filter by worker, service, or payment method
- Export as PDF or Excel

#### Finance Dashboard

**Displays:**
- 📊 Revenue chart (daily/weekly/monthly)
- 💰 Total revenue, expenses, profit
- 👥 Worker payout breakdown
- 🏆 Top-performing services
- 📈 Profit trends
- 💳 Payment method breakdown

---

### 9. "Close the Day" Feature

**What It Does:**
1. Owner clicks "Close Day" at end of business
2. System:
   - Finalizes all bookings for the day
   - Marks no-shows
   - Calculates day's totals
   - Generates daily summary
   - Saves snapshot report
   - Resets daily counters
3. Daily report sent to owner (email/SMS)
4. Financial data archived
5. Ready for next business day

**Daily Summary Includes:**
- Total revenue
- Completed appointments
- No-shows
- Worker performance
- Payment breakdown
- Expenses
- Net profit

---

### 10. AI Insights (Future Enhancement)

**Pattern Recognition:**
- "Your busiest hour is 5 PM"
- "Thursdays are 30% slower than Fridays"
- "Haircut Deluxe is 40% of monthly revenue"
- "Customer retention is 85% (above average!)"

**Recommendations:**
- "Add more appointments between 2-4 PM"
- "Consider raising prices for your most popular service"
- "Worker John has 95% customer satisfaction"
- "Product X is running low, order by Friday"

**Predictive:**
- Revenue forecast for next month
- Busy season predictions
- Staff scheduling suggestions
- Inventory reorder predictions

---

### 11. Platform Subscription (Separate from Salon Finances)

**Subscription Tiers:**
- Free: 1 salon, 2 workers, basic features
- Pro: 1 salon, unlimited workers, advanced features
- Enterprise: Multiple locations, white-label, API access

**Subscription Management:**
- Billing handled separately
- Does NOT affect salon's internal finances
- Salon finances = business bookkeeping
- Platform subscription = SaaS fee

---

### 12. Data Model (Database Collections)

**Core Collections:**
```
users - All user accounts (Owner, Worker, Client)
salons - Salon profiles and settings
services - Available services
appointments - All bookings
workers - Worker-specific data (linked to users)
```

**Financial Collections:**
```
payments - Revenue records
expenses - Business expenses  
commissions - Worker earnings
financialReports - Daily/monthly summaries
dayClosures - End-of-day snapshots
```

**CRM Collections:**
```
customers - Client profiles (linked to salon)
customerNotes - CRM notes and preferences
loyaltyPoints - Reward system
```

**Inventory:**
```
inventories - Product stock
stockMovements - Usage/restock history
suppliers - Supplier information
```

---

## 🎯 Complete Feature Matrix

| Feature | Status | Priority |
|---------|--------|----------|
| Salon Profile | ✅ Built | - |
| Owner/Worker/Client Roles | ✅ Built | - |
| Service Management | ✅ Built | - |
| Booking System | ✅ Built | - |
| QR Code Generation | ✅ Built | - |
| Notifications (Mock) | ✅ Built | - |
| Payment Tracking | ✅ Built | - |
| Commission System | ✅ Built | - |
| Expense Management | ✅ Built | - |
| Financial Reports | ✅ Built | - |
| Customer CRM | ✅ Built | - |
| Inventory | ✅ Built | - |
| **Solo/Team Mode** | ❌ Todo | HIGH |
| **Worker Payment Models** | ❌ Todo | HIGH |
| **Service-Worker Linking** | ❌ Todo | HIGH |
| **QR Auto-Registration** | ❌ Todo | HIGH |
| **Close the Day** | ❌ Todo | MEDIUM |
| **PDF/Excel Export** | ❌ Todo | MEDIUM |
| **AI Insights** | ❌ Todo | FUTURE |
| **Platform Subscription** | ❌ Todo | FUTURE |

---

## 🎊 Summary

**We have ~70% of your vision built!**

**Built:** Core booking, financials, CRM, inventory  
**Need:** Modes, payment models, worker-service linking, close day, exports

---

## 🚀 What Should We Do?

**Tell me:**
- **"implement missing"** - I'll add the 4-5 key missing features
- **"fix web first"** - Get the current app running smoothly
- **"show me what works"** - Demo what's already built
- **"start fresh"** - Rebuild with full spec from scratch

**What's your priority?** 🎯

