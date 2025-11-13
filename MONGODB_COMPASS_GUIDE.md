# MongoDB Compass - Quick Start Guide

## 🎯 How to View Your Beauty Platform Data

### Step-by-Step Instructions:

---

### Step 1: Open MongoDB Compass ✅
- Launch the MongoDB Compass application

---

### Step 2: Connect to Database 🔌

On the main connection screen, you'll see:

**Connection String Field:**
```
mongodb://localhost:27017
```

**Copy and paste this exactly:**
```
mongodb://localhost:27017
```

Then click the **green "Connect"** button.

---

### Step 3: Find Your Database 🔍

After connecting, look at the **LEFT SIDEBAR**:

You'll see a list of databases:
```
📁 Databases
  ├─ admin
  ├─ config  
  ├─ local
  └─ beauty-platform  ← Click here!
```

**Click on "beauty-platform"**

---

### Step 4: Explore Your Data 📊

You'll now see **10 collections** (like tables in MySQL):

#### Original Collections:
```
✅ users - User accounts (Owner, Worker, Client)
✅ salons - Salon profiles with QR codes
✅ services - Services offered
✅ appointments - All bookings
✅ notifications - Notification history
```

#### New Business Account Collections:
```
🆕 payments - All payment records
🆕 expenses - Business expenses
🆕 commissions - Worker commission tracking
🆕 customers - Customer CRM profiles
🆕 inventories - Product stock management
```

**Click on any collection to see the data!**

---

## 📊 What You'll See

### When You Click "users":
```json
{
  "_id": "...",
  "name": "sami",
  "email": "sami@gmail.com",
  "role": "Owner",
  "phone": "27212019",
  "isActive": true,
  "createdAt": "2024-11-10T..."
}
```

### When You Click "salons":
```json
{
  "_id": "...",
  "name": "Sidi bou coiff",
  "qrCode": "SALON_66a01a6b-fe8a-46cc-98c6-0c67be1da562",
  "phone": "27212019",
  "ownerId": "...",
  "workingHours": {...}
}
```

### When You Click "payments" (new!):
```json
{
  "_id": "...",
  "appointmentId": "...",
  "amount": 50.00,
  "workerCommission": {
    "percentage": 50,
    "amount": 25.00
  },
  "salonRevenue": 25.00,
  "paymentMethod": "card",
  "status": "completed"
}
```

---

## 🛠️ What You Can Do in Compass

### 1. View Data (Read)
- Click any collection
- Scroll through documents
- Expand nested fields
- Search and filter

### 2. Edit Data (Update)
- Double-click any field
- Change the value
- Click "Update"
- Data is saved!

### 3. Add Data (Create)
- Click "ADD DATA" button
- Choose "Insert Document"
- Paste JSON or use editor
- Click "Insert"

### 4. Delete Data (Delete)
- Hover over a document
- Click trash icon
- Confirm deletion

### 5. Run Queries (Advanced)
- Click "FILTER" field
- Enter MongoDB query:
```javascript
{ "role": "Owner" }
{ "status": "completed" }
{ "amount": { "$gt": 100 } }
```

---

## 🎨 Interface Layout

```
┌─────────────────────────────────────────────────────┐
│ MongoDB Compass                                     │
├────────────┬────────────────────────────────────────┤
│            │  [FILTER] [PROJECT] [SORT]             │
│ DATABASES  │                                        │
│            │  Documents (2 found)                   │
│ ▼ beauty..│                                         │
│   ▸ users │  ┌─────────────────────────────────┐  │
│   ▸ salons│  │ _id: ObjectId("...")            │  │
│   ▸ servic│  │ name: "sami"                    │  │
│   ▸ appoin│  │ email: "sami@gmail.com"         │  │
│   ▸ notifi│  │ role: "Owner"                   │  │
│   ▸ paymen│  │ phone: "27212019"               │  │
│   ▸ expens│  │ isActive: true                  │  │
│   ▸ commis│  └─────────────────────────────────┘  │
│   ▸ custom│                                        │
│   ▸ invent│  [Edit] [Clone] [Delete]              │
│            │                                        │
└────────────┴────────────────────────────────────────┘
```

---

## 🔍 Useful Features

### Search & Filter:
```javascript
// Find owners only
{ "role": "Owner" }

// Find completed appointments
{ "status": "completed" }

// Find payments over $50
{ "amount": { "$gt": 50 } }

// Find VIP customers
{ "status": "vip" }

// Find low stock items
{ "$expr": { "$lte": ["$quantity", "$reorderLevel"] } }
```

### Sorting:
- Click column headers to sort
- Ascending/descending order
- Multiple field sorting

### Exporting:
- Click "Export" button
- Choose JSON or CSV format
- Save to file

---

## 💡 Tips & Tricks

### 1. Quick Navigation:
- Use **Ctrl+K** for quick search
- Bookmark favorite queries
- Use tabs for multiple collections

### 2. View Options:
- **List View** (default) - Easy reading
- **JSON View** - Raw data
- **Table View** - Like Excel

### 3. Keyboard Shortcuts:
- **Ctrl+F** - Filter
- **Ctrl+E** - Export
- **Ctrl+N** - New document
- **Ctrl+W** - Close tab

---

## 🎯 Common Tasks

### Check Today's Revenue:
1. Open `payments` collection
2. Filter: `{ "paidAt": { "$gte": "2024-11-10" } }`
3. View all payments for today
4. See revenue in real-time!

### Find VIP Customers:
1. Open `customers` collection
2. Filter: `{ "status": "vip" }`
3. Sort by `totalSpent` (descending)
4. See top spending customers!

### Check Low Stock:
1. Open `inventories` collection
2. Click "Low Stock Alerts" (if available)
3. Or filter: `{ "$expr": { "$lte": ["$quantity", "$reorderLevel"] } }`
4. Order supplies!

---

## 🆘 Troubleshooting

### Can't connect?
- Make sure MongoDB is running: `net start MongoDB`
- Check connection string: `mongodb://localhost:27017`
- Try: `mongosh` in terminal to test

### Database not showing?
- Click refresh button (circular arrow)
- Make sure backend created the database
- Check you're connected to the right server

### Collections empty?
- Create some test data in the web app
- Register users, create salons
- Data will appear automatically

---

## 🎊 You're All Set!

Now you can:
- ✅ View all your salon data
- ✅ Edit records easily
- ✅ Track business metrics
- ✅ Monitor financials
- ✅ Manage customers

**Just like HeidiSQL/phpMyAdmin for MySQL, but for MongoDB!** 🚀

---

**Enjoy exploring your Beauty Platform data!** 💼✨

