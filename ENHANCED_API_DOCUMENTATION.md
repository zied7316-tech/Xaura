# Enhanced API Documentation - Business Account Features

## 🆕 New Endpoints for Business Management

---

## 💰 Payment Management

### Record Payment
```http
POST /api/payments
Authorization: Bearer <owner_or_worker_token>
Content-Type: application/json

{
  "appointmentId": "appointment_id_here",
  "paymentMethod": "card",
  "workerCommissionPercentage": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "payment": {
      "amount": 50.00,
      "workerCommission": {
        "percentage": 50,
        "amount": 25.00
      },
      "salonRevenue": 25.00,
      "status": "completed"
    }
  }
}
```

**Features:**
- Automatically calculates worker commission
- Updates appointment status to completed
- Creates commission record
- Tracks payment method

---

### Get Payments
```http
GET /api/payments?status=completed&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <owner_token>
```

---

### Get Revenue Summary
```http
GET /api/payments/revenue?startDate=2024-11-01&endDate=2024-11-30
Authorization: Bearer <owner_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 5000.00,
    "totalCommissions": 2500.00,
    "netRevenue": 2500.00,
    "paymentCount": 100,
    "averageTransaction": 50.00
  }
}
```

---

## 💸 Expense Management

### Create Expense
```http
POST /api/expenses
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "category": "rent",
  "amount": 2000,
  "description": "Monthly rent payment",
  "vendor": "Property Management Co",
  "paymentMethod": "bank_transfer",
  "date": "2024-11-01",
  "isRecurring": true,
  "recurringFrequency": "monthly"
}
```

**Categories:** rent, utilities, supplies, salary, marketing, maintenance, equipment, other

---

### Get Expenses
```http
GET /api/expenses?category=supplies&startDate=2024-11-01
Authorization: Bearer <owner_token>
```

---

## 📊 Business Analytics

### Dashboard Analytics
```http
GET /api/analytics/dashboard
Authorization: Bearer <owner_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 50000,
      "today": 850,
      "thisMonth": 15000
    },
    "appointments": {
      "total": 1000,
      "today": 12,
      "pending": 5,
      "completed": 850
    },
    "customers": {
      "total": 250,
      "new": 45,
      "returning": 205
    },
    "workers": {
      "total": 5,
      "active": 5
    }
  }
}
```

---

### Revenue Trends
```http
GET /api/analytics/revenue-trends?period=month
Authorization: Bearer <owner_token>
```

**Periods:** day (last 30 days), week (last 12 weeks), month (last 12 months)

**Response:**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "period": "2024-10",
        "revenue": 12000,
        "count": 240,
        "average": 50
      },
      {
        "period": "2024-11",
        "revenue": 15000,
        "count": 300,
        "average": 50
      }
    ]
  }
}
```

---

### Profit & Loss
```http
GET /api/analytics/profit-loss?startDate=2024-11-01&endDate=2024-11-30
Authorization: Bearer <owner_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": 15000,
    "expenses": 5000,
    "profit": 10000,
    "profitMargin": "66.67",
    "paymentCount": 300,
    "expenseCount": 25
  }
}
```

---

## 👥 Customer CRM

### Get All Customers
```http
GET /api/customers?status=active&search=john
Authorization: Bearer <owner_token>
```

---

### Get Customer Details
```http
GET /api/customers/:customerId
Authorization: Bearer <owner_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "userId": {...},
      "totalVisits": 15,
      "totalSpent": 750.00,
      "averageSpending": 50.00,
      "lastVisit": "2024-11-08",
      "preferredWorkers": [...],
      "notes": "Prefers short haircuts",
      "status": "vip"
    },
    "appointmentHistory": [...],
    "paymentHistory": [...]
  }
}
```

---

### Update Customer Profile
```http
PUT /api/customers/:customerId
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "notes": "Allergic to specific hair dye",
  "specialRequirements": "Sensitive scalp",
  "tags": ["VIP", "Regular"],
  "status": "vip"
}
```

---

### Get Top Customers
```http
GET /api/customers/top?limit=10
Authorization: Bearer <owner_token>
```

---

## 📦 Inventory Management

### Add Inventory Item
```http
POST /api/inventory
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "productName": "Professional Hair Shampoo",
  "category": "hair_products",
  "brand": "L'Oreal",
  "quantity": 50,
  "unit": "bottle",
  "reorderLevel": 10,
  "costPrice": 8.50,
  "sellingPrice": 15.00,
  "supplier": {
    "name": "Beauty Supply Co",
    "contact": "+1234567890",
    "email": "orders@beautysupply.com"
  }
}
```

---

### Get Inventory
```http
GET /api/inventory?category=hair_products&lowStock=true
Authorization: Bearer <owner_token>
```

---

### Get Low Stock Alerts
```http
GET /api/inventory/alerts
Authorization: Bearer <owner_token>
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": {
    "alerts": [
      {
        "productName": "Hair Color - Brown",
        "quantity": 5,
        "reorderLevel": 10,
        "category": "hair_products"
      }
    ]
  }
}
```

---

### Update Stock
```http
PUT /api/inventory/:itemId
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "quantity": 50,
  "lastRestocked": "2024-11-10"
}
```

---

## 📈 Business Reports

### Daily Report
```http
GET /api/reports/daily?date=2024-11-10
Authorization: Bearer <owner_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-11-10",
    "appointments": {
      "total": 15,
      "completed": 12,
      "cancelled": 2,
      "noShow": 1
    },
    "financial": {
      "revenue": 850.00,
      "expenses": 150.00,
      "profit": 700.00,
      "profitMargin": "82.35"
    },
    "payments": {
      "total": 12,
      "cash": 5,
      "card": 6,
      "online": 1
    }
  }
}
```

---

### Monthly Report
```http
GET /api/reports/monthly?year=2024&month=11
Authorization: Bearer <owner_token>
```

**Includes:**
- Complete monthly summary
- Revenue and expenses
- Top performing services
- Worker performance rankings
- Customer analytics
- Profit margins

---

### Custom Date Range Report
```http
GET /api/reports/custom?startDate=2024-11-01&endDate=2024-11-07
Authorization: Bearer <owner_token>
```

---

## 🎯 Complete Business Account API Summary

### Total Endpoints: 40+

**Authentication:** 4 endpoints
**Salons:** 8 endpoints
**Services:** 5 endpoints
**Appointments:** 5 endpoints
**Notifications:** 4 endpoints
**Payments:** 3 endpoints (NEW)
**Expenses:** 4 endpoints (NEW)
**Analytics:** 3 endpoints (NEW)
**Customers:** 4 endpoints (NEW)
**Inventory:** 5 endpoints (NEW)
**Reports:** 3 endpoints (NEW)

---

## 💡 Integration Examples

### Complete Appointment Flow with Payment:

```javascript
// 1. Client books appointment
POST /api/appointments

// 2. Worker completes service
PUT /api/appointments/:id/status { "status": "completed" }

// 3. Record payment
POST /api/payments {
  "appointmentId": "...",
  "paymentMethod": "card"
}

// 4. System automatically:
//    - Calculates commission
//    - Updates customer spending
//    - Adds to revenue
//    - Sends notifications
//    - Updates dashboard
```

---

## 🎊 Business Account Complete!

**Each salon is now a full business management hub** with:
- Complete financial control
- Customer relationship management
- Inventory tracking
- Business analytics
- Performance reports

**Ready for production use!** 🚀💼

---

**See BUSINESS_ACCOUNT_FEATURES.md for detailed feature documentation**

