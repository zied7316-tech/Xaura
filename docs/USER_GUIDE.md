# 📚 Xaura - Complete User Guide

## Welcome to Xaura!

Your all-in-one salon management platform.

---

## 📖 **Table of Contents**

1. [Getting Started](#getting-started)
2. [Owner Guide](#owner-guide)
3. [Worker Guide](#worker-guide)
4. [Client Guide](#client-guide)
5. [Feature Guides](#feature-guides)
6. [FAQ](#faq)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### What is Xaura?

Xaura is a complete salon management platform that helps:
- **Salon Owners** manage their business
- **Workers** handle appointments and track earnings
- **Clients** book services and earn rewards

### First Time Setup

#### For Salon Owners:
1. Visit Xaura website
2. Click **"Create Salon Account"**
3. Fill in salon details (name, address, phone)
4. Create your owner account
5. ✅ Done! You're in!

#### For Workers:
1. Click **"Sign Up"** → Select **"Worker"**
2. Fill in your details
3. Wait for salon owner to add you to their salon
4. ✅ Start accepting appointments!

#### For Clients:
1. Click **"Sign Up"** → Select **"Client"**
2. Fill in your details
3. Search for salons OR scan salon QR code
4. ✅ Start booking!

---

## 👔 Owner Guide

### Dashboard Overview

Your main dashboard shows:
- 📊 Today's revenue
- 📅 Today's appointments
- 👥 Total customers
- 📈 Quick stats

### Complete Setup Checklist

#### ✅ Step 1: Salon Settings
1. Click **"Salon Settings"** in sidebar
2. Upload salon logo/photo
3. Add description
4. Verify contact info
5. **Save**

#### ✅ Step 2: Add Services
1. Click **"Services"**
2. Click **"Add Service"**
3. Fill in:
   - Name (e.g., "Haircut")
   - Description
   - Price (e.g., $50)
   - Duration (e.g., 30 minutes)
   - Category
4. Upload service image (optional)
5. **Save**
6. Repeat for all services

#### ✅ Step 3: Add Workers
1. Click **"Workers"**
2. Click **"Add Worker"**
3. Enter worker's email
4. Set commission % (e.g., 50%)
5. **Send Invite**
6. Worker receives invitation

#### ✅ Step 4: Set Up Loyalty Program
1. Click **"Loyalty & Rewards"**
2. Toggle **"Enable"**
3. Set points per dollar (default: 1)
4. Configure 4 tiers:
   - Bronze: 0+ points
   - Silver: 500+ points (5% discount)
   - Gold: 1,000+ points (10% discount)
   - Platinum: 2,000+ points (15% discount)
5. Add rewards:
   - Click **"Add Reward"**
   - Name: "$10 Off"
   - Points: 200
   - Discount: $10
6. **Save Settings**

#### ✅ Step 5: Configure Reminders
1. Click **"SMS/Email Reminders"**
2. **For SMS (Twilio):**
   - Enable toggle
   - Enter Account SID
   - Enter Auth Token
   - Enter Phone Number
   - Customize template
   - Test with your phone
3. **For Email:**
   - Enable toggle
   - Enter SMTP details (Gmail recommended)
   - Customize subject & body
   - Test with your email
4. **Save Settings**

#### ✅ Step 6: Stock Your Inventory
1. Click **"Inventory"**
2. Click **"Add Product"**
3. Fill in:
   - Name: "Hair Gel"
   - Category: "Styling Products"
   - Quantity: 50
   - Unit: "Bottles"
   - Low stock alert: 10
   - Cost price: $5
   - Supplier info
4. **Save**
5. Repeat for all products

---

### Managing Appointments

#### View All Appointments:
1. Click **"Appointments"**
2. See 3 sections:
   - **Pending Requests** - Need your action
   - **Today's Confirmed** - Accepted bookings
   - **Past Appointments** - Completed history

#### Accept Appointment:
1. Find pending appointment
2. Click **"Accept"**
3. ✅ Client and worker notified automatically!
4. 🎉 Confetti animation!

#### Reassign Appointment:
1. Find appointment
2. Click **"Reassign Worker"**
3. Select new worker
4. **Confirm**
5. Status resets to "Pending" for new worker

#### View Timeline:
Each appointment shows:
- 🗓️ Booked time
- ✅ Accepted time
- ▶️ Started time
- ✔️ Completed time

---

### Financial Management

#### View Reports & Analytics:
1. Click **"Reports"**
2. Select date range
3. Click **"Update"**
4. See 8 charts:
   - Revenue trends (line chart)
   - Service popularity (bar chart)
   - Status distribution (pie chart)
   - Peak hours (bar chart)
   - Day of week analysis
   - Worker performance table
   - Top clients table
   - Financial breakdown

#### Worker Payments:
1. Click **"Worker Payments"**
2. See all workers with:
   - Paid balance
   - Unpaid earnings
   - Estimated this week
3. Generate invoices for each worker

#### Track Inventory:
1. Click **"Inventory"**
2. View stats:
   - Total products
   - Low stock warnings (orange)
   - Out of stock (red)
   - Total value
3. **Restock:** Click cart icon → Enter quantity
4. Search products by name or SKU
5. Filter by category

---

### Customer Management

#### View Customers (CRM):
1. Click **"Customers"**
2. See all clients with:
   - Total visits
   - Total spent (lifetime value)
   - Average per visit
   - Last visit date
3. **Search** by name, phone, or email
4. **Filter** by All / VIP / Active

#### View Customer Details:
1. Click **"Details"** on any customer
2. See:
   - Contact info
   - Visit statistics
   - Full appointment history
   - All notes
3. Click **"Add Note"**
4. Select category (General, Allergies, Preferences)
5. Check **"Important"** for allergies!
6. **Save**

#### Mark Client as VIP:
1. Go to **"Client List"**
2. Find client with high visits/spending
3. Change status to **"VIP"**
4. **Save**
5. Client sees VIP badge + priority booking

---

### Notifications

#### Check Notifications:
1. Look at **bell icon** (top-right navbar)
2. Red badge shows unread count
3. Click bell → Dropdown opens
4. See all notifications
5. Click notification → Marks as read
6. Click **X** → Delete individual
7. Click **"Mark all"** → All marked as read
8. Click **trash icon** → Clear all

#### Notification Types:
- 📅 New appointments
- ✅ Confirmations
- 💰 Payments received
- 📦 Low stock alerts
- 🎂 Birthday reminders
- ⭐ Reviews received

---

## 💈 Worker Guide

### Dashboard

Your dashboard shows:
- 👥 **Add Walk-in Client** (big purple button)
- 📊 Today's appointments count
- 📅 This week's count
- ✅ Completed count

### Managing Appointments

#### View Appointments:
1. Click **"Appointments"** in sidebar
2. Two tabs:
   - **Pending** - Requests from clients (orange cards)
   - **Active** - Accepted bookings (green cards)

#### Accept Booking Request:
1. Go to **"Pending"** tab
2. See client name (details hidden until accept)
3. Click **"Accept Request"**
4. ✅ Details revealed!
5. 🎉 Confetti! Client notified!

#### Reject Booking:
1. Find pending appointment
2. Click **"Reject"**
3. Confirm
4. Client notified

#### Start Service:
1. Find confirmed appointment
2. Click **"Start Service"**
3. Your status changes to **"Busy"**
4. Timer starts

#### Complete Service:
1. Click **"Complete & Process Payment"**
2. **NEW:** Adjust price if needed (client changed mind)
3. Select payment status:
   - **Client Paid** → Adds to wallet immediately
   - **Waiting Payment** → Stays in unpaid earnings
4. Select payment method (Cash/Card/Bank/Other)
5. **Complete**
6. ✅ Your status back to "Available"
7. 🎁 Client earns loyalty points automatically!

---

### Walk-in Clients

#### Add Walk-in Client:
1. Click **"Add Walk-in Client"** on dashboard
2. **Optional:** Enter client name, phone, email
3. **Required:** Select service
4. **Required:** Enter price (auto-filled from service)
5. Select payment status
6. Click **"Add Walk-in Client"**
7. ✅ Instant tracking in finances!

**💡 Tip:** You can skip client info for super-fast walk-ins!

---

### Finance Dashboard

#### View Your Finances:
1. Click **"My Finances"**
2. See 4 cards:
   - 💰 **Paid Balance** - Money you've earned
   - ⏳ **Unpaid Earnings** - Clients haven't paid yet
   - 📊 **Estimated This Week** - Upcoming confirmed appointments
   - 💸 **Paid Out This Month** - What you've been paid

#### View Details:
3 tabs showing:
- **Paid Earnings** - Services where client paid
- **Unpaid Earnings** - Waiting for client payment
  - Shows client name & phone
  - **"Mark Paid"** button when client pays later
- **Estimated This Week** - Potential earnings (next 7 days)

#### Mark Unpaid as Paid:
1. Go to **"Unpaid Earnings"** tab
2. Find client who paid
3. Click **"Mark Paid"**
4. ✅ Moves to paid balance!

---

### Availability Management

#### Set Your Schedule:
1. Click **"My Availability"**
2. Select days you work
3. Set hours (e.g., 9:00 AM - 6:00 PM)
4. **Save**

#### Toggle Your Status:
- **Navbar** → Status dropdown (top-right)
- Options:
  - 🟢 **Available** - Ready for bookings
  - 🟡 **On Break** - Temporarily unavailable
  - ⚪ **Offline** - Not accepting bookings
- Clients see your status when booking!

---

## 👤 Client Guide

### Finding a Salon

#### Method 1: Search
1. Click **"Find Salons"**
2. Search by name or location
3. Click salon → View details
4. Click **"Join Salon"**
5. ✅ Confirmed!

#### Method 2: QR Code (Faster!)
1. Click **"Join via QR"**
2. Scan salon's QR code
3. ✅ Instant join!

---

### Booking Appointments

#### Standard Booking:
1. From dashboard, click **"Book Appointment"**
2. Select service (browse all services)
3. Choose your preferred worker
4. Pick date
5. Select time slot:
   - 🟢 **Green** = Available
   - 🔴 **Red** = Booked (can't select)
6. Worker status shown:
   - 🟢 Available
   - 🟡 On Break
   - ⚪ Offline
7. Click **"Book Appointment"**
8. ✅ Worker & owner notified!
9. Wait for confirmation

#### Recurring Booking (Auto-book Weekly/Monthly):
1. Click **"Recurring & Groups"**
2. Click **"Set Up Recurring"**
3. Select service & worker
4. Choose frequency:
   - **Weekly** (same day each week)
   - **Bi-weekly** (every 2 weeks)
   - **Monthly** (same date each month)
5. Pick day & time
6. Set start date
7. Optional: Set end date
8. **Confirm**
9. ✅ Next 4 appointments created automatically!

#### Group Booking (Multiple Services):
1. Click **"Recurring & Groups"**
2. Click **"Book Multiple Services"**
3. Add Service 1 (select worker)
4. Add Service 2 (select worker)
5. Add more...
6. Pick date
7. See total: duration + price
8. **Book All**
9. ✅ All services scheduled sequentially!

---

### Loyalty & Rewards

#### View Your Points:
1. Click **"My Rewards"** in sidebar
2. See:
   - 🎯 Your points balance (big number!)
   - 🏆 Your tier (Bronze/Silver/Gold/Platinum)
   - 📊 Progress to next tier
   - 🎁 Available rewards

#### Earn Points:
- Automatically earn after each paid service!
- 💰 1 point per $1 spent (default)
- 🎁 +50 bonus on first visit
- 🎂 +100 bonus on birthday

#### Redeem Rewards:
1. Browse rewards catalog
2. 🟢 Green highlight = You can afford it!
3. Click **"Redeem Now"**
4. Confirm
5. ✅ Points deducted!
6. 🎉 Use reward on next visit

#### Check History:
- Scroll down to see points history
- ➕ Green = Earned
- ➖ Red = Redeemed

---

### Leaving Reviews

#### After Service Completion:
1. Go to **"My Appointments"**
2. Find completed appointment
3. Click **"Leave Review"**
4. Rate overall (1-5 stars) ⭐
5. Optional: Rate quality, punctuality, friendliness
6. Write review (optional)
7. Check "Would recommend"
8. **Submit Review**
9. 🎉 Confetti animation!
10. Worker gets notification

---

### Viewing Appointments

1. Click **"My Appointments"**
2. See 3 sections:
   - **Pending** - Waiting for worker
   - **Confirmed** - Accepted by worker
   - **Past** - Completed/cancelled

#### Check Status:
- 🟠 **Pending** - Waiting for acceptance
- 🟢 **Confirmed** - Worker accepted
- 🔵 **In Progress** - Service happening now
- ✅ **Completed** - Service done
- ❌ **Cancelled** - Booking cancelled

---

## 📋 Feature Guides

### 📊 Reports & Analytics (Owner)

**Access:** Owner sidebar → **"Reports"**

**Features:**
- 📈 Revenue trends over time
- 🏆 Most popular services
- 📊 Appointment status breakdown
- ⏰ Peak hours (busiest times)
- 📅 Busiest days of week
- 👥 Worker performance comparison
- ⭐ Top clients by visits/spending
- 💰 Financial breakdown

**How to Use:**
1. Select date range (default: last 30 days)
2. Click **"Update"**
3. Scroll through all charts
4. Click **"Export PDF"** (coming soon)

**Business Insights:**
- Which services are most profitable?
- When should I schedule more staff?
- Who are my best workers?
- Which clients should I reward?
- What are my peak hours?

---

### 💳 Inventory Management (Owner)

**Access:** Owner sidebar → **"Inventory"**

**Dashboard Shows:**
- 📦 Total products
- ⚠️ Low stock count (orange)
- 🚫 Out of stock count (red)
- 💰 Total inventory value

**Add Product:**
1. Click **"Add Product"**
2. Fill in:
   - Name: "Hair Gel"
   - Category: "Styling Products"
   - SKU: Optional
   - Quantity: 50
   - Unit: "Bottles"
   - Low stock alert: 10
   - Cost price: $5
   - Selling price: $12
   - Supplier info: Name, contact, email
3. **Save**

**Restock Product:**
1. Find product (search by name/SKU)
2. Click **cart icon** 🛒
3. Enter quantity to add
4. **Add to Stock**
5. ✅ Quantity updated!

**Stock Colors:**
- 🟢 **Green** - Adequate stock
- 🟠 **Orange** - Low stock (≤ threshold)
- 🔴 **Red** - Out of stock (0)

---

### 👥 Customer CRM (Owner)

**Access:** Owner sidebar → **"Customers"**

**Dashboard Shows:**
- 👥 Total customers
- ⭐ VIP customers
- 🟢 Active customers (90 days)
- 💰 Total revenue

**View Customer Details:**
1. Click **"Details"** on any customer
2. See:
   - Contact info (phone, email)
   - Statistics (visits, spent, points, tier)
   - Full visit history
   - All notes
3. Click **"Add Note"**
4. Select category:
   - **General** - Normal notes
   - **Allergies** - Mark as important (red!)
   - **Preferences** - Service preferences
   - **Behavior** - Client behavior
5. Check **"Important"** for critical info
6. **Save**

**💡 Pro Tips:**
- Use **Allergies** category for product sensitivities
- Mark important notes so all staff see them
- Track preferences for personalized service
- Note special requests for repeat clients

---

### 📧 SMS/Email Reminders (Owner)

**Access:** Owner sidebar → **"SMS/Email Reminders"**

**SMS Setup (Twilio):**
1. Create account at twilio.com
2. Get phone number ($1-2/month)
3. Copy Account SID & Auth Token
4. Enter in Xaura
5. Customize message template
6. **Test** with your phone
7. Enable toggle
8. **Save**

**Email Setup (Gmail):**
1. Use your salon Gmail
2. Enable 2-Factor Authentication
3. Create App Password: myaccount.google.com/apppasswords
4. Enter in Xaura:
   - Host: smtp.gmail.com
   - Port: 587
   - Username: your@gmail.com
   - Password: (app password)
5. Customize email subject & body
6. **Test** with your email
7. Enable toggle
8. **Save**

**Template Variables:**
- `{clientName}` - Client's name
- `{service}` - Service name
- `{time}` - Appointment time
- `{date}` - Appointment date
- `{worker}` - Worker's name
- `{salon}` - Your salon name

**Results:**
- 📉 Reduce no-shows by 70%!
- 💰 Save thousands per year
- ⭐ Professional image

---

### 🔔 Notifications (All Users)

**Access:** Bell icon (top-right navbar)

**Features:**
- Red badge with unread count
- Click to open dropdown
- See last 20 notifications
- Auto-refresh every 30 seconds

**Actions:**
- Click notification → Mark as read
- Click **✓✓** → Mark all as read
- Click **X** → Delete notification
- Click **🗑️** → Clear all

**Notification Types You'll Receive:**

**Owners:**
- New appointment requests
- Payments received
- Low stock alerts
- New client signups
- Reviews received

**Workers:**
- New appointment requests (HIGH priority!)
- Appointment confirmations
- Status changes
- Reviews received

**Clients:**
- Appointment confirmed
- Service completed
- Reminder (24h before)
- Points earned
- Tier upgrades

---

## ❓ FAQ

### General Questions

**Q: Is Xaura free?**
A: Yes! Xaura is free to use. You only pay for optional SMS (Twilio: ~$0.01/SMS)

**Q: Can I use it on mobile?**
A: Yes! The web app is mobile-responsive. Native mobile app is in development.

**Q: How many users can I have?**
A: Unlimited! Add as many workers and clients as you need.

**Q: Can I have multiple salons?**
A: Currently one salon per owner. Multi-salon support coming soon.

---

### Owner Questions

**Q: How do I get my QR code?**
A: Go to Salon Settings → Your QR code is displayed. Download and print it!

**Q: How do commissions work?**
A: Set commission % per worker. Xaura automatically calculates and tracks earnings.

**Q: What if a client doesn't pay?**
A: Worker marks payment as "Waiting". It stays in "Unpaid Earnings" until you mark it paid.

**Q: Can I change prices after booking?**
A: Yes! Workers can adjust the final price when completing the service.

**Q: How do I generate worker invoices?**
A: Go to Worker Payments → Click "Generate Invoice" → Only paid earnings included.

---

### Worker Questions

**Q: How do I add a walk-in client?**
A: Dashboard → Click big purple "Add Walk-in Client" button. Only service & price required!

**Q: Can I adjust prices?**
A: Yes! When completing appointment, you can change the final price if client added/removed services.

**Q: Where do I see my earnings?**
A: Click "My Finances" → 4 tabs showing Paid, Unpaid, Estimated, and Paid Out.

**Q: What if client says they'll pay later?**
A: Select "Waiting Payment" when completing. It goes to your Unpaid Earnings.

**Q: How do I mark unpaid as paid?**
A: My Finances → Unpaid tab → Find client → Click "Mark Paid"

---

### Client Questions

**Q: How do I earn points?**
A: Automatically! After each paid service, points are added based on amount spent.

**Q: What are the membership tiers?**
A: 
- 🥉 Bronze: 0+ points (everyone starts here)
- 🥈 Silver: 500+ points (5% discount)
- 🥇 Gold: 1,000+ points (10% discount)
- 💎 Platinum: 2,000+ points (15% discount)

**Q: How do I redeem rewards?**
A: My Rewards → Browse catalog → Click "Redeem Now" on any reward you can afford (green highlight).

**Q: Can I book the same appointment every week?**
A: Yes! Use "Recurring & Groups" → Set up weekly/monthly recurring.

**Q: What if I want multiple services?**
A: Use "Group Booking" to book multiple services in one session!

---

## 🔧 Troubleshooting

### Login Issues

**Problem:** Can't login  
**Solution:**
- Check email/password spelling
- Password minimum 6 characters
- Try "Forgot Password" (if available)

**Problem:** Account locked  
**Solution:** Contact salon owner to reactivate

---

### Appointment Issues

**Problem:** Time slot shows as available but won't book  
**Solution:**
- Refresh the page
- Check if worker changed status to "Offline"
- Try different time slot

**Problem:** Appointment not showing  
**Solution:**
- Check correct status tab (Pending/Confirmed/Past)
- Refresh page
- Check if it was cancelled

---

### Payment Issues

**Problem:** Payment not showing in finances  
**Solution:**
- Check if appointment status is "Completed"
- Verify payment status (Paid vs Waiting)
- Check correct tab (Paid vs Unpaid)

**Problem:** Unpaid earnings stuck  
**Solution:**
- Wait for client to pay
- Then click "Mark Paid" button
- Moves to paid balance

---

### Notification Issues

**Problem:** Not receiving notifications  
**Solution:**
- Check bell icon (might not be checking)
- Notifications auto-refresh every 30 seconds
- Refresh browser page

**Problem:** SMS/Email reminders not sending  
**Solution:**
- Owner: Check reminder settings configured
- Test SMS/Email with test buttons
- Verify Twilio/Gmail credentials
- Check "Enabled" toggle is ON

---

### Technical Issues

**Problem:** Page not loading  
**Solution:**
- Refresh browser (Ctrl+R or Cmd+R)
- Clear browser cache
- Check internet connection
- Try different browser

**Problem:** Images not uploading  
**Solution:**
- Check file size (max 5MB recommended)
- Use JPG, PNG, or WebP format
- Try smaller image

---

## 💡 Pro Tips

### For Owners:
1. ✅ Set up SMS reminders → Reduce no-shows 70%
2. ✅ Enable loyalty program → Increase retention 25%
3. ✅ Review reports weekly → Make data-driven decisions
4. ✅ Add worker notes in CRM → Better service
5. ✅ Keep inventory updated → Never run out
6. ✅ Mark VIP clients → Build relationships
7. ✅ Use QR code → Easy client signups

### For Workers:
1. ✅ Use walk-in feature → Track all work
2. ✅ Adjust prices when needed → Accurate records
3. ✅ Mark unpaid earnings → Clean finances
4. ✅ Toggle status appropriately → Clear availability
5. ✅ Check notifications often → Don't miss bookings

### For Clients:
1. ✅ Join salon via QR → Fastest method
2. ✅ Set up recurring bookings → Never forget
3. ✅ Book group services → Save time
4. ✅ Leave reviews → Help others
5. ✅ Check rewards → Free services!
6. ✅ Reach VIP status → Get discounts

---

## 📞 Support

### Need Help?
- 📧 Check this guide first
- 💬 Contact your salon owner
- 📱 Check FAQ section
- 🔍 Search for your issue

### Report a Bug:
- Describe the problem
- Include steps to reproduce
- Note which browser/device
- Screenshot helps!

---

## 🎉 Congratulations!

You now know how to use **all features** of Xaura!

**Xaura helps you:**
- 👔 Owners: Run efficient salons
- 💈 Workers: Track earnings easily
- 👤 Clients: Book & earn rewards

**Enjoy using Xaura!** ✨🚀

---

**Last Updated:** November 11, 2025  
**Version:** 1.0  
**Status:** ✅ Complete




