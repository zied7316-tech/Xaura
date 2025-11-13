# Walk-in Clients & Price Adjustment Features

## 🎯 **Overview**

Two new features implemented for workers to handle real-world salon scenarios:

1. **Walk-in Clients**: Manually add clients who come without prior booking
2. **Price Adjustment**: Modify service price when completing appointments (when client changes mind about services)

---

## ✨ **Feature 1: Walk-in Clients**

### What It Does
- Workers can manually add a client who walks into the salon without a booking
- Records the service provided and payment immediately
- Automatically creates/finds client account by phone number
- Tracks the service in finances and worker earnings

### How to Access
- **Worker Dashboard** → Big purple "Add Walk-in Client" button at the top
- OR navigate to `/worker/walk-in`

### Form Fields
- **Client Info:**
  - Name (required)
  - Phone number (required) - Used to find/create client account
  - Email (optional)

- **Service & Payment:**
  - Service provided (dropdown from salon services)
  - Final price (auto-filled from service, can adjust)
  - Payment status: Paid or Waiting Payment
  - Payment method (if paid): Cash, Card, Bank Transfer, Other

### Backend Logic
- If phone exists → Link to existing client
- If phone doesn't exist → Create new client account with temp password
- Creates completed appointment (status: Completed, isWalkIn: true)
- Calculates worker earnings based on commission percentage
- Updates worker wallet if client paid
- Records payment in finances

---

## ✨ **Feature 2: Price Adjustment on Completion**

### What It Does
- When completing an appointment, workers can now adjust the final price
- Useful when:
  - Client changes their mind and adds/removes services
  - Client books haircut but decides to add beard trim
  - Price needs adjustment for any reason

### How to Use
1. Worker starts appointment (status: In Progress)
2. Clicks "Complete & Process Payment"
3. **NEW**: Modal now shows "Final Price" input field
4. Can adjust price higher or lower than original
5. Shows warning if price was changed
6. Select payment status and method
7. Complete appointment

### UI Features
- Shows original price clearly
- Editable "Final Price" field
- Warning badge when price is different from original
- Displays comparison: "From: $50 → To: $60"

### Backend Tracking
- Stores `finalPrice` in Appointment model
- Stores both `originalPrice` and `finalPrice` in WorkerEarning model
- Calculates commission on FINAL price (not original)
- Payment amount reflects final price

---

## 📊 **Database Schema Updates**

### Appointment Model
```javascript
finalPrice: Number  // Stores adjusted price if changed
isWalkIn: Boolean   // Flags walk-in appointments
```

### WorkerEarning Model
```javascript
originalPrice: Number  // Original service price
finalPrice: Number     // Adjusted price (if changed)
servicePrice: Number   // Price used for commission calculation
```

---

## 🔌 **API Endpoints**

### Create Walk-in Appointment
```
POST /api/appointment-management/walk-in
Auth: Worker only

Body:
{
  "clientName": "John Doe",
  "clientPhone": "+1234567890",
  "clientEmail": "john@example.com",  // optional
  "serviceId": "service_id",
  "price": 50.00,
  "paymentStatus": "paid" | "waiting",
  "paymentMethod": "cash" | "card" | "bank_transfer" | "other"
}
```

### Complete Appointment (Updated)
```
PUT /api/appointment-management/:id/complete
Auth: Worker only

Body:
{
  "finalPrice": 60.00,  // NEW! Optional, defaults to service price
  "paymentStatus": "paid" | "waiting",
  "paymentMethod": "cash" | "card" | "bank_transfer" | "other"
}
```

---

## 💼 **Use Cases**

### Walk-in Scenario 1: New Client
```
1. Client walks in without booking
2. Worker clicks "Add Walk-in Client"
3. Enters client name: "Sarah"
4. Enters phone: "+1234567890"
5. Selects service: "Haircut - $50"
6. Price auto-filled to $50
7. Client pays cash
8. Submit → Appointment created, wallet updated
```

### Walk-in Scenario 2: Existing Client
```
1. Regular client walks in
2. Worker enters their phone number
3. System finds existing account automatically
4. Links service to existing client profile
5. Complete payment
```

### Price Adjustment Scenario 1: Service Upgrade
```
1. Client books "Haircut" for $50
2. During appointment, adds "Beard Trim" (+$20)
3. Worker completes appointment
4. Changes final price from $50 to $70
5. System calculates commission on $70
6. Records both original ($50) and final ($70) prices
```

### Price Adjustment Scenario 2: Service Downgrade
```
1. Client books "Full Package" for $100
2. Client changes mind, only wants "Haircut"
3. Worker adjusts price from $100 to $50
4. Commission calculated on $50
5. Client pays adjusted amount
```

---

## 🎨 **UI Components**

### Files Created/Modified

**New Files:**
- `web/src/pages/worker/WorkerWalkInPage.jsx` - Walk-in client form

**Modified Files:**
- `web/src/pages/worker/WorkerAppointmentsPage.jsx` - Added price adjustment field
- `web/src/pages/worker/WorkerDashboard.jsx` - Added "Add Walk-in Client" button
- `web/src/services/appointmentManagementService.js` - Added createWalkInAppointment()
- `web/src/App.jsx` - Added `/worker/walk-in` route

**Backend Files:**
- `backend/models/Appointment.js` - Added finalPrice, isWalkIn fields
- `backend/models/WorkerEarning.js` - Added originalPrice, finalPrice fields
- `backend/controllers/appointmentManagementController.js` - Added createWalkInAppointment(), updated completeAppointment()
- `backend/routes/appointmentManagementRoutes.js` - Added POST /walk-in route

---

## 🧪 **Testing Checklist**

### Walk-in Feature
- [ ] Access walk-in page from worker dashboard
- [ ] Create walk-in with new client (paid)
- [ ] Create walk-in with existing client phone (paid)
- [ ] Create walk-in with "waiting payment" status
- [ ] Check client account was created/linked
- [ ] Verify worker wallet updated (if paid)
- [ ] Check appointment shows in worker appointments
- [ ] Verify finances tracked correctly

### Price Adjustment Feature
- [ ] Book regular appointment as client
- [ ] Worker accepts and starts appointment
- [ ] Click "Complete & Process Payment"
- [ ] See original price displayed
- [ ] Adjust price higher (+$20)
- [ ] See warning "Price changed"
- [ ] Complete appointment
- [ ] Verify final price in finances
- [ ] Check worker commission calculated on final price
- [ ] Test with price reduction (-$10)
- [ ] Test with no price change (same as original)

---

## 💰 **Finance Tracking**

### Walk-in Appointments
- Tracked as regular completed appointments
- `isWalkIn: true` flag for reporting
- Commission calculated immediately
- Wallet updated based on payment status

### Price Adjustments
- Original price stored for reference
- Final price used for all calculations
- Commission based on final price
- Salon revenue = finalPrice - workerEarning
- Payment records show final amount

---

## 🎯 **Benefits**

1. **Real-world Flexibility**: Handles common salon scenarios
2. **No Money Lost**: All services tracked even without booking
3. **Accurate Finances**: Commission on actual price charged
4. **Client Tracking**: Walk-ins automatically added to client database
5. **Transparent**: Both original and adjusted prices tracked
6. **Worker Control**: Workers can adjust prices on the spot

---

## 📝 **Notes**

- Walk-in clients get temporary password (they can reset later)
- Email format for walk-ins without email: `{phone}@walkin.temp`
- Walk-in appointments are immediately marked as "Completed"
- Price adjustments tracked for accounting/reporting purposes
- All price changes logged with timestamps

---

**Status**: ✅ Complete
**Date**: November 11, 2025
**Version**: 1.0




