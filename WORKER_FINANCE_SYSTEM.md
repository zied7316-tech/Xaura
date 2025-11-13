# Worker Finance Management System 💰

## Overview
Complete financial management system for tracking worker earnings, managing wallets, and generating invoices with payment history.

## Features

### For Workers 👨‍💼
- **Digital Wallet**: View current balance and earning statistics
- **Unpaid Earnings Tracker**: See all pending earnings from completed appointments
- **Payment History**: Access all invoices and past payments
- **Payment Schedule**: Configure daily, weekly, or monthly payout preferences

### For Salon Owners 👔
- **Worker Payment Dashboard**: View all workers' financial status at a glance
- **Generate Invoices**: Create professional invoices with custom date ranges
- **Payment Processing**: Mark payments as paid and generate receipts
- **Financial Overview**: Track total payouts, pending payments, and worker earnings

---

## Backend Implementation

### 1. Database Models

#### WorkerWallet Model (`WorkerWallet.js`)
Tracks each worker's financial balance:
```javascript
{
  workerId: ObjectId (User),
  salonId: ObjectId (Salon),
  balance: Number,              // Current unpaid balance
  totalEarned: Number,          // Lifetime earnings
  totalPaid: Number,            // Lifetime payouts
  paymentSchedule: 'daily' | 'weekly' | 'monthly',
  lastPayoutDate: Date,
  nextPayoutDate: Date
}
```

#### WorkerInvoice Model (`WorkerInvoice.js`)
Stores payment invoices and receipts:
```javascript
{
  invoiceNumber: String,        // Auto-generated (INV-20250110-0001)
  workerId: ObjectId,
  salonId: ObjectId,
  periodStart: Date,
  periodEnd: Date,
  totalAmount: Number,
  appointmentsCount: Number,
  breakdown: [{
    appointmentId, serviceName, servicePrice,
    workerEarning, commissionPercentage, date
  }],
  status: 'pending' | 'paid' | 'cancelled',
  paidDate: Date,
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'other',
  notes: String,
  generatedBy: ObjectId (Owner)
}
```

#### WorkerEarning Model (`WorkerEarning.js`)
Tracks individual earnings from appointments:
```javascript
{
  workerId: ObjectId,
  salonId: ObjectId,
  appointmentId: ObjectId,
  serviceId: ObjectId,
  servicePrice: Number,
  commissionPercentage: Number,
  workerEarning: Number,
  paymentModelType: String,
  isPaid: Boolean,
  invoiceId: ObjectId (when paid),
  serviceDate: Date
}
```

### 2. API Endpoints

#### Worker Endpoints

**GET /api/worker-finance/wallet**
- Get worker's wallet balance and statistics
- Response: Wallet object with balance, totalEarned, totalPaid

**GET /api/worker-finance/unpaid-earnings**
- Get list of unpaid earnings
- Response: Array of earnings with service details

**GET /api/worker-finance/payment-history**
- Get all invoices and payment history
- Query params: `status`, `startDate`, `endDate`
- Response: Array of invoices

#### Owner Endpoints

**GET /api/worker-finance/all-wallets**
- Get all workers' wallets for the salon
- Response: Array of wallets with worker details

**GET /api/worker-finance/unpaid-earnings/:workerId**
- Get unpaid earnings for specific worker
- Response: Earnings array with total

**GET /api/worker-finance/summary/:workerId**
- Get comprehensive financial summary
- Response: Wallet, unpaid earnings, monthly stats, recent invoices

**POST /api/worker-finance/generate-invoice**
- Generate invoice and process payment
- Body:
```json
{
  "workerId": "...",
  "periodStart": "2025-01-01",
  "periodEnd": "2025-01-31",
  "paymentMethod": "cash",
  "notes": "January payment"
}
```
- Automatically:
  - Creates invoice with unique number
  - Marks earnings as paid
  - Updates wallet balance
  - Records payout date

**POST /api/worker-finance/record-earning**
- Record earning from completed appointment
- Body:
```json
{
  "workerId": "...",
  "appointmentId": "...",
  "serviceId": "...",
  "servicePrice": 50.00
}
```
- Automatically calculates commission based on worker's payment model

---

## Frontend Implementation

### Worker Finance Page (`WorkerFinancePage.jsx`)
**Route**: `/worker/finances`

#### Features:
- **Wallet Overview Cards**:
  - Available Balance (highlighted)
  - Total Earned (all time)
  - Total Paid Out (with last payment date)
  
- **Tabbed Interface**:
  - **Unpaid Earnings Tab**: Table showing all pending earnings
    - Date, Service Name, Service Price, Commission %, Earning Amount
    - Total unpaid at bottom
  - **Payment History Tab**: List of invoices/receipts
    - Invoice number, period, payment method
    - Paid date, total amount
    - Status badges (paid/pending)

### Owner Worker Payments Page (`WorkerPaymentsPage.jsx`)
**Route**: `/owner/worker-payments`

#### Features:
- **Overview Dashboard**:
  - Total Workers count
  - Pending Payments count
  - Total Paid Out
  - Total Earned

- **Worker Wallets Table**:
  - Worker name & avatar
  - Payment model type
  - Current balance (highlighted if > 0)
  - Total earned & paid
  - Last payout date
  - "Generate Invoice" button (enabled if balance > 0)

- **Generate Invoice Modal**:
  - Worker information display
  - Financial summary (unpaid appointments, monthly earnings)
  - Period selection (start/end dates)
  - Payment method dropdown
  - Notes field
  - Unpaid earnings preview table
  - "Generate Invoice & Mark as Paid" button

---

## How It Works

### Earning Flow
```
1. Appointment Completed
   ↓
2. Owner/System calls recordEarning()
   ↓
3. Calculate commission based on worker's payment model
   ↓
4. Create WorkerEarning record
   ↓
5. Add to WorkerWallet balance
```

### Payment Flow
```
1. Owner views Worker Payments page
   ↓
2. Sees workers with unpaid balance
   ↓
3. Clicks "Generate Invoice"
   ↓
4. Selects period & payment method
   ↓
5. System creates invoice
   ↓
6. Marks all earnings as paid
   ↓
7. Deducts from wallet balance
   ↓
8. Updates totalPaid & lastPayoutDate
   ↓
9. Worker can view invoice in Payment History
```

### Payment Model Types

**1. Percentage Commission**
- Worker earns X% of each service
- Example: 50% commission on $100 service = $50 earning

**2. Fixed Salary**
- Monthly flat rate
- No per-appointment earnings tracked
- Paid monthly regardless of appointments

**3. Hybrid**
- Base monthly salary + commission %
- Example: $500/month + 30% commission per service

---

## Usage Instructions

### For Workers:

#### View Your Wallet:
1. Go to **My Finances** in sidebar
2. See your available balance at the top
3. View total earned and total paid statistics

#### Check Unpaid Earnings:
1. Click **Unpaid Earnings** tab
2. See all services you've completed
3. View commission percentage and your earnings
4. Total unpaid shows at bottom

#### View Payment History:
1. Click **Payment History** tab
2. See all invoices and payments
3. Check payment methods and dates
4. View invoice details and notes

### For Owners:

#### View All Workers' Finances:
1. Go to **Worker Payments** in sidebar
2. See overview of all workers
3. Check pending payments and total payouts

#### Generate Invoice & Pay Worker:
1. Find worker with balance > $0
2. Click **"Generate Invoice"**
3. Review worker's unpaid earnings
4. Select period (default: last 30 days)
5. Choose payment method (Cash/Bank Transfer/Check)
6. Add optional notes
7. Click **"Generate Invoice & Mark as Paid"**
8. Invoice is created and earnings are marked as paid

#### Record Earnings (After Appointments):
- Earnings are automatically recorded when appointments are completed
- Or manually record via API if needed

---

## Invoice Number Format
Invoices are automatically numbered with format:
```
INV-YYYYMMDD-XXXX
```
Example: `INV-20250110-0001`
- Year, Month, Day
- Sequential number for that day

---

## Payment Methods
- **Cash**: Physical cash payment
- **Bank Transfer**: Direct bank deposit
- **Check**: Paper check
- **Other**: Custom payment method

---

## API Integration Example

### Record Earning After Appointment
```javascript
// When appointment is completed
await workerFinanceService.recordEarning({
  workerId: "worker123",
  appointmentId: "appt456",
  serviceId: "service789",
  servicePrice: 75.00
})
// Automatically calculates commission and updates wallet
```

### Generate Invoice
```javascript
await workerFinanceService.generateInvoice({
  workerId: "worker123",
  periodStart: "2025-01-01",
  periodEnd: "2025-01-31",
  paymentMethod: "bank_transfer",
  notes: "January 2025 payment"
})
```

---

## Database Queries

### Get Worker's Current Balance
```javascript
const wallet = await WorkerWallet.findOne({ workerId })
console.log(`Balance: $${wallet.balance}`)
```

### Get All Unpaid Earnings
```javascript
const earnings = await WorkerEarning.find({
  workerId,
  isPaid: false
})
const total = earnings.reduce((sum, e) => sum + e.workerEarning, 0)
```

### Get This Month's Earnings
```javascript
const startOfMonth = new Date()
startOfMonth.setDate(1)

const monthlyEarnings = await WorkerEarning.find({
  workerId,
  serviceDate: { $gte: startOfMonth }
})
```

---

## Security Features
- ✅ Workers can only view their own finances
- ✅ Only owners can generate invoices
- ✅ Authorization middleware on all routes
- ✅ Wallet balance protected from going negative
- ✅ Audit trail with generatedBy field on invoices

---

## Future Enhancements
- [ ] Automatic payouts based on schedule
- [ ] Email/SMS notifications for payments
- [ ] PDF invoice generation
- [ ] Tax withholding calculations
- [ ] Multi-currency support
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Expense deductions from earnings
- [ ] Bonus and penalty tracking
- [ ] Detailed earning reports and analytics

---

## Testing Checklist
- ✅ Create worker wallet automatically
- ✅ Record earnings after appointment completion
- ✅ Calculate commission correctly for each payment model
- ✅ Generate unique invoice numbers
- ✅ Mark earnings as paid when invoice generated
- ✅ Update wallet balance correctly
- ✅ Workers can view their finances
- ✅ Owners can see all workers' wallets
- ✅ Owners can generate invoices
- ✅ Payment history displays correctly

---

**Status**: ✅ **FULLY IMPLEMENTED**
**Version**: 1.0.0
**Date**: November 10, 2025

