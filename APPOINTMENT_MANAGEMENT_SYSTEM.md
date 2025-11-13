# Complete Appointment Management System with Payment Processing 💈💰

## Overview
End-to-end appointment booking system where clients book, workers accept/reject, complete services, and process payments with automatic wallet and finance tracking.

---

## Complete Appointment Flow

```
1. CLIENT BOOKS
   Status: Pending
   Payment: Unpaid
   ↓
2. WORKER RECEIVES REQUEST
   - Can Accept or Reject
   ↓
3. WORKER ACCEPTS
   Status: Confirmed
   Payment: Still Unpaid
   ↓
4. WORKER STARTS SERVICE
   Status: In Progress
   ↓
5. SERVICE FINISHED
   Worker clicks "Complete & Process Payment"
   ↓
6. WORKER CHOOSES PAYMENT STATUS:
   
   Option A: CLIENT PAID
   - Status: Completed
   - Payment Status: Paid
   - Amount added to worker's wallet
   - Payment recorded in finances
   - Worker earning calculated
   - Worker set back to "Available"
   
   Option B: WAITING PAYMENT
   - Status: Completed
   - Payment Status: Waiting
   - No wallet/finance updates yet
   - Worker set back to "Available"
   - Payment can be collected later
```

---

## Appointment Statuses

### 1. **Pending** 🟡 (Orange)
- Client just booked
- Waiting for worker acceptance
- Worker must Accept or Reject

### 2. **Confirmed** 🟢 (Green)
- Worker accepted the appointment
- Service scheduled
- Worker can Start Service when client arrives

### 3. **In Progress** 🔵 (Blue)
- Service currently being performed
- Worker clicked "Start Service"
- Worker can Complete when done

### 4. **Completed** ✅ (Green)
- Service finished
- Payment processed (paid or waiting)
- Worker back to available

### 5. **Cancelled** 🔴 (Red)
- Appointment cancelled
- By worker or client

### 6. **No-Show** ⚫ (Gray)
- Client didn't show up
- No payment processed

---

## Payment Statuses

### 1. **Unpaid** (Default)
- No payment processed yet
- Service not yet completed

### 2. **Paid** 💵 (Green)
- Client paid immediately after service
- Amount added to:
  - Worker's wallet (commission)
  - Salon finances (payment record)
- Worker earning calculated automatically

### 3. **Waiting** ⏳ (Orange)
- Service completed but payment pending
- Client will pay later
- No finance/wallet updates yet
- Can be marked as paid later

---

## Backend Implementation

### Appointment Model Updates

Added fields:
```javascript
{
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'No-Show',
  paymentStatus: 'unpaid' | 'paid' | 'waiting',
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'other',
  paidAmount: Number,
  paidAt: Date
}
```

### API Endpoints

#### PUT /api/appointment-management/:id/accept
Worker accepts appointment
- Changes status: Pending → Confirmed
- Sends notification to client (future)

#### PUT /api/appointment-management/:id/reject
Worker rejects appointment
- Changes status: Pending → Cancelled
- Body: `{ reason: "Not available" }`

#### PUT /api/appointment-management/:id/start
Worker starts service
- Changes status: Confirmed → In Progress
- Indicates service has begun

#### PUT /api/appointment-management/:id/complete
Worker completes service and processes payment
- Body:
```json
{
  "paymentStatus": "paid" | "waiting",
  "paymentMethod": "cash" | "card" | "bank_transfer" | "other"
}
```

**If paymentStatus = "paid":**
1. ✅ Creates WorkerEarning record
2. ✅ Updates WorkerWallet (adds to balance)
3. ✅ Creates Payment record in finances
4. ✅ Sets appointment.paymentStatus = 'paid'
5. ✅ Sets appointment.paidAmount = servicePrice
6. ✅ Sets appointment.paidAt = now
7. ✅ Sets worker currentStatus = 'available'

**If paymentStatus = "waiting":**
1. ✅ Sets appointment.paymentStatus = 'waiting'
2. ✅ No wallet/finance updates
3. ✅ Sets worker currentStatus = 'available'
4. ⏳ Payment can be processed later

#### GET /api/appointment-management/worker/pending
Get all pending appointments for worker
- Returns appointments with status: Pending
- Sorted by appointment time

#### GET /api/appointment-management/worker/active
Get today's confirmed/in-progress appointments
- Returns appointments for today only
- Statuses: Confirmed or In Progress

---

## Frontend Implementation

### Worker Appointments Page (`WorkerAppointmentsPage.jsx`)
**Route**: `/worker/appointments`

#### Two Tabs:

**1. Pending Requests Tab:**
Shows appointments waiting for acceptance

Each card displays:
- Client photo/avatar
- Client name
- Service name
- Date & time
- Duration
- Price
- **Accept Button** (green)
- **Reject Button** (red)

**2. Today's Confirmed Tab:**
Shows accepted appointments for today

Each card displays:
- Client info
- Service details
- Date & time
- Phone number
- Current status badge

Action buttons (based on status):
- **Confirmed**: "Start Service" + "Cancel"
- **In Progress**: "Complete & Process Payment"

#### Payment Modal:

Appears when worker clicks "Complete":

**Two Big Selection Buttons:**

1. **Client Paid** ✅
   - Green highlight when selected
   - Shows payment method dropdown
   - Info: "Add to wallet & finances"

2. **Waiting Payment** ⏳
   - Orange highlight when selected
   - Info: "Payment pending"

**Info Messages:**
- If Paid: "💰 Payment will be added to your wallet and salon finances"
- If Waiting: "⏳ Payment will remain pending. Client can pay later."
- Both: "✅ You will be set back to 'Available' status after completing"

**Complete Button:**
- Processes the appointment
- Records payment if paid
- Sets worker back to available
- Shows success toast

---

## Worker Dashboard Flow

### Morning Routine:
```
1. Worker logs in (Status: Offline 🔴)
2. Sets status to "Available" 🟢
3. Opens "Appointments" page
4. Sees "Pending Requests" tab
5. Reviews booking requests
6. Accepts or rejects each one
7. Views "Today's Confirmed" tab
8. Sees all accepted appointments
```

### During Service:
```
1. Client arrives
2. Worker clicks "Start Service"
3. Status changes to "In Progress"
4. Performs haircut/service
5. Service finished
6. Worker clicks "Complete & Process Payment"
7. Modal opens
```

### After Service - Payment Options:

**Option A: Client Pays Now** 💵
```
1. Worker selects "Client Paid"
2. Chooses payment method (Cash/Card/etc)
3. Clicks "Complete Appointment"
4. System records:
   - Payment in finances
   - Earning in worker's wallet
   - Appointment completed
5. Worker set to "Available" 🟢
6. Can accept new bookings
```

**Option B: Client Pays Later** ⏳
```
1. Worker selects "Waiting Payment"
2. Clicks "Complete Appointment"
3. System records:
   - Appointment completed
   - Payment status: Waiting
   - No wallet/finance updates
4. Worker set to "Available" 🟢
5. Payment can be processed later
```

---

## Payment Processing Details

### When Payment Status = "Paid"

**1. Worker Earning Calculation:**
Based on worker's payment model:
- **Percentage Commission**: Worker gets X% of service price
  - Example: 50% of $100 = $50
- **Hybrid**: Worker gets commission % + base salary
  - Example: 30% of $100 = $30 (plus monthly salary)
- **Fixed Salary**: No per-service earning (paid monthly)

**2. Wallet Update:**
```javascript
workerWallet.balance += workerEarning
workerWallet.totalEarned += workerEarning
```

**3. Finance Record:**
```javascript
Payment.create({
  salonId,
  appointmentId,
  clientId,
  amount: servicePrice,
  paymentMethod: 'cash',
  status: 'completed',
  category: 'service_payment'
})
```

**4. Worker Earning Record:**
```javascript
WorkerEarning.create({
  workerId,
  appointmentId,
  servicePrice,
  commissionPercentage,
  workerEarning,
  isPaid: false // Will be paid when owner generates invoice
})
```

**5. Worker Status:**
```javascript
worker.currentStatus = 'available' // Back to available
```

---

## Usage Instructions

### For Clients:

#### Book an Appointment:
1. Search for salons
2. View salon details
3. Choose a service
4. Select date and worker
5. Choose time slot
6. Click "Book Appointment"
7. **Status: Pending** (waiting for worker)

#### After Booking:
- Wait for worker to accept
- Receive notification when confirmed (future)
- Show up at scheduled time

### For Workers:

#### Manage Appointments:
1. Go to **"Appointments"** in sidebar (NEW)
2. See **"Pending Requests"** tab
3. Review each booking request:
   - Client info
   - Service details
   - Time & duration
   - Price
4. Click **"Accept"** or **"Reject"**

#### On Appointment Day:
1. Check **"Today's Confirmed"** tab
2. See all accepted appointments
3. When client arrives:
   - Click **"Start Service"**
4. Perform the service
5. When finished:
   - Click **"Complete & Process Payment"**

#### Process Payment:
1. Modal opens with 2 options
2. **If client pays now:**
   - Select "Client Paid" ✅
   - Choose payment method
   - Click "Complete Appointment"
   - 💰 Money added to your wallet!
3. **If client pays later:**
   - Select "Waiting Payment" ⏳
   - Click "Complete Appointment"
   - Payment pending
4. Automatically set back to "Available" 🟢

---

## Notification System (Future)

### Client Notifications:
- ✅ Appointment Accepted by Worker
- ⏰ Appointment Reminder (24h before)
- 🎉 Appointment Completed
- 💰 Payment Reminder (if waiting)

### Worker Notifications:
- 📱 New Booking Request
- ❌ Client Cancelled
- ⭐ New Review/Feedback

---

## Benefits

### For Workers:
✅ **Control bookings** - Accept or reject requests
✅ **Track today's schedule** - See all confirmed appointments
✅ **Flexible payment** - Mark as paid or waiting
✅ **Automatic earnings** - Wallet updated automatically
✅ **Back to available** - Ready for next booking

### For Clients:
✅ **Easy booking** - Choose worker and time
✅ **Confirmation** - Know when accepted
✅ **Flexible payment** - Pay now or later
✅ **Clear status** - Track appointment progress

### For Owners:
✅ **Worker autonomy** - Workers manage own bookings
✅ **Payment tracking** - All payments recorded
✅ **Financial accuracy** - Real-time wallet updates
✅ **Client relationship** - Track client visits
✅ **Revenue reporting** - Automatic finance records

---

## Database Records Created

### On Booking:
```javascript
Appointment {
  status: 'Pending',
  paymentStatus: 'unpaid',
  clientId, workerId, serviceId, salonId,
  startTime, duration, price
}
```

### On Accept:
```javascript
appointment.status = 'Confirmed'
```

### On Start:
```javascript
appointment.status = 'In Progress'
```

### On Complete (Paid):
```javascript
// 1. Appointment updated
appointment.status = 'Completed'
appointment.paymentStatus = 'paid'
appointment.paidAmount = 100
appointment.paidAt = now

// 2. Worker Earning created
WorkerEarning {
  workerId, appointmentId,
  servicePrice: 100,
  commissionPercentage: 50,
  workerEarning: 50,
  isPaid: false
}

// 3. Wallet updated
workerWallet.balance += 50
workerWallet.totalEarned += 50

// 4. Payment recorded
Payment {
  salonId, appointmentId, clientId,
  amount: 100,
  paymentMethod: 'cash',
  status: 'completed'
}

// 5. Worker status
worker.currentStatus = 'available'
```

---

## Testing Guide

### Test as Client:
1. Search for salon
2. Book appointment with worker
3. Wait for acceptance (see "Pending" status)

### Test as Worker:
1. Login to worker account
2. Go to "Appointments" page
3. See new booking in "Pending Requests"
4. Click "Accept"
5. Booking moves to "Today's Confirmed"
6. Click "Start Service" when client arrives
7. Status changes to "In Progress"
8. Click "Complete & Process Payment"
9. **Choose "Client Paid":**
   - Select "Cash"
   - Click "Complete Appointment"
   - Check your wallet (balance increased!)
10. Try with another appointment:
    - Choose "Waiting Payment"
    - Click "Complete"
    - Check wallet (no change)

### Test as Owner:
1. Go to "Worker Payments"
2. See worker's wallet updated
3. Go to "Finances"  
4. See payment recorded
5. Go to "Client List"
6. See client's appointment count increased

---

## Payment Method Options

- **Cash** 💵 - Physical cash payment
- **Card** 💳 - Credit/Debit card
- **Bank Transfer** 🏦 - Direct bank transfer
- **Other** - Any other method

---

## Security Features

- ✅ Only assigned worker can accept/reject/complete
- ✅ Status progression enforced (Pending → Confirmed → In Progress → Completed)
- ✅ Payment calculations server-side (cannot be manipulated)
- ✅ Duplicate bookings prevented
- ✅ Authorization on all endpoints

---

## Future Enhancements

- [ ] **Mark Paid Later** - Convert "Waiting" to "Paid"
- [ ] **Refund System** - Process refunds for cancelled appointments
- [ ] **Partial Payments** - Allow partial payment amounts
- [ ] **Tips/Gratuity** - Add tip on top of service price
- [ ] **Multiple Services** - Book multiple services at once
- [ ] **Recurring Appointments** - Weekly/monthly bookings
- [ ] **Appointment Notes** - Worker can add service notes
- [ ] **Client Feedback** - Rate service after completion
- [ ] **Photo Upload** - Before/after photos
- [ ] **Appointment History** - Full history view

---

## API Response Examples

### Accept Appointment
```json
{
  "success": true,
  "message": "Appointment accepted",
  "data": {
    "_id": "...",
    "status": "Confirmed",
    "clientId": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "serviceId": {
      "name": "Haircut",
      "price": 50
    }
  }
}
```

### Complete with Payment
```json
{
  "success": true,
  "message": "Appointment completed and payment recorded",
  "data": {
    "_id": "...",
    "status": "Completed",
    "paymentStatus": "paid",
    "paidAmount": 50,
    "paidAt": "2025-11-10T..."
  }
}
```

---

## Real-World Example

### Scenario: Haircut Service ($50, 60 min)

**Client Books:**
```
Time: 2:00 PM today
Worker: John
Status: Pending 🟡
```

**Worker Accepts (1:55 PM):**
```
Status: Confirmed 🟢
Worker notified: "Client arriving in 5 min"
```

**Client Arrives (2:00 PM):**
```
Worker clicks "Start Service"
Status: In Progress 🔵
```

**Service Finished (3:00 PM):**
```
Worker clicks "Complete & Process Payment"
Modal opens
```

**Client Pays Cash:**
```
Worker selects:
- "Client Paid" ✅
- Payment Method: Cash

Worker clicks "Complete Appointment"

System processes:
1. Appointment status → Completed
2. Payment status → Paid
3. Worker earns: $25 (50% commission)
4. Wallet balance: +$25
5. Finance record: +$50 revenue
6. Worker status: → Available 🟢

Worker sees: "✅ Service completed & payment recorded!"
```

**Alternative - Client Pays Later:**
```
Worker selects:
- "Waiting Payment" ⏳

Worker clicks "Complete Appointment"

System processes:
1. Appointment status → Completed
2. Payment status → Waiting
3. No wallet update
4. No finance record yet
5. Worker status: → Available 🟢

Worker sees: "✅ Service completed, payment pending"

Later (when client pays):
- Owner can mark as paid
- Wallet and finances updated then
```

---

## Commission Calculation

### Example Payment Models:

**50% Commission:**
```
Service Price: $100
Worker Commission: 50%
Worker Earns: $50
Salon Keeps: $50
```

**30% Hybrid:**
```
Service Price: $100
Worker Commission: 30%
Worker Earns from this service: $30
Monthly Base Salary: $500 (paid separately)
```

**Fixed Salary:**
```
Service Price: $100
Worker Commission: 0%
Worker Earns from this service: $0
Monthly Salary: $2000 (paid separately)
```

---

## Worker Status Integration

### Automatic Status Management:

**After Completing Appointment:**
```javascript
// System automatically sets:
worker.currentStatus = 'available'

// Worker is now:
- Visible in booking system
- Can receive new requests
- Shows as "Available" 🟢 in navbar
```

**Worker Can Then:**
- Take break (set to "On Break" ☕)
- Accept next appointment
- Go offline when done for the day (set to "Offline" 🔴)

---

## Error Handling

### Prevents:
- ❌ Accepting already accepted appointments
- ❌ Starting non-confirmed appointments
- ❌ Completing without payment choice
- ❌ Completing appointments not assigned to you
- ❌ Invalid payment status values

### Shows Clear Errors:
- "Appointment not found"
- "Not authorized to accept this appointment"
- "Appointment must be confirmed first"
- "Payment status must be either 'paid' or 'waiting'"

---

## Testing Checklist

### Worker Appointment Management:
- ✅ View pending requests
- ✅ Accept appointment
- ✅ Reject appointment
- ✅ Start service
- ✅ Complete with "Paid" status
- ✅ Check wallet updated
- ✅ Complete with "Waiting" status
- ✅ Check wallet not updated
- ✅ Verify status back to "Available"
- ✅ Accept new booking after completing

### Payment Processing:
- ✅ Mark as paid with cash
- ✅ Mark as paid with card
- ✅ Mark as waiting
- ✅ Check finance record created (paid only)
- ✅ Check earning record created (paid only)
- ✅ Verify correct commission calculated

### Status Flow:
- ✅ Pending → Confirmed (on accept)
- ✅ Confirmed → In Progress (on start)
- ✅ In Progress → Completed (on complete)
- ✅ Pending → Cancelled (on reject)

---

**Status**: ✅ **FULLY IMPLEMENTED**
**Version**: 1.0.0
**Date**: November 10, 2025

**Key Features:**
- ✅ Worker accepts/rejects bookings
- ✅ Start and complete services
- ✅ Payment processing (paid/waiting)
- ✅ Automatic wallet updates
- ✅ Finance tracking
- ✅ Worker back to available
- ✅ Real-time updates
- ✅ Complete appointment lifecycle

