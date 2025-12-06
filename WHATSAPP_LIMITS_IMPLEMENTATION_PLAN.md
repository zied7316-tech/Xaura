# 📋 WhatsApp Message Limits Implementation Plan

## ⚠️ IMPORTANT CONFLICT NOTICE

Your requirements conflict with your rules:
- **Requirement**: Replace SMS credits with WhatsApp credits
- **Your Rule**: "Do NOT modify Database models, API routes, Express Router structure"

**This change REQUIRES modifying:**
- Database models (Subscription schema)
- API routes (from `/sms-credits` to `/whatsapp-credits`)
- Controllers (function names and logic)
- Frontend components

**I will proceed carefully by:**
1. Adding NEW fields alongside existing ones (not deleting)
2. Creating migration-safe changes
3. Keeping backward compatibility where possible
4. Explaining each change in detail

---

## 📊 SCANNING REPORT

### Files That Reference SMS Credits:

**Backend:**
1. `backend/config/subscriptionPlans.js` - SMS add-on configuration
2. `backend/models/Subscription.js` - SMS credits schema fields and methods
3. `backend/controllers/subscriptionController.js` - SMS purchase/approval functions
4. `backend/routes/ownerSubscriptionRoutes.js` - SMS purchase route
5. `backend/routes/superAdminRoutes.js` - SMS approval routes
6. `backend/models/UserHistory.js` - SMS credits history type

**Frontend:**
1. `web/src/services/subscriptionService.js` - SMS purchase API call
2. `web/src/services/superAdminService.js` - SMS approval API calls
3. `web/src/pages/owner/SubscriptionPage.jsx` - SMS purchase UI
4. `web/src/pages/superadmin/SubscriptionsPage.jsx` - SMS display
5. `web/src/pages/superadmin/PendingApprovalsPage.jsx` - SMS approval UI

**Total Files to Modify: 11 files**

---

## 🎯 REQUIREMENTS SUMMARY

1. **Add WhatsApp message limits to plans:**
   - Pro Plan: 1500 messages/month
   - Enterprise Plan: 3000 messages/month

2. **Replace SMS credit system with WhatsApp credits:**
   - Change all `smsCredits` → `whatsappCredits`
   - Change all `SMS` text → `WhatsApp` text
   - Keep same credit packages (100, 500, 2000)

---

## 📝 DETAILED IMPLEMENTATION PLAN

### Phase 1: Add WhatsApp Message Limits to Plans ✅ SAFE

**File: `backend/config/subscriptionPlans.js`**
- Add `maxWhatsAppMessages` feature to Pro plan (1500)
- Add `maxWhatsAppMessages` feature to Enterprise plan (3000)
- Basic plan: No limit specified (will default to 0 or unlimited based on logic)

**Impact:** Configuration only, no breaking changes

---

### Phase 2: Replace SMS Credits with WhatsApp Credits ⚠️ REQUIRES MODEL CHANGES

**Why this is necessary:**
- The entire credit system is built around SMS
- We need to track WhatsApp message usage
- Current system has SMS-specific logic

**Strategy:** 
- Add WhatsApp credit fields ALONGSIDE SMS (for migration safety)
- Update all references to use WhatsApp instead
- Keep SMS fields temporarily for data migration later

**Files to Modify:**

1. **`backend/config/subscriptionPlans.js`**
   - Change `smsCredits` add-on to `whatsappCredits`
   - Update package names and descriptions
   - Change `freeSmsCredits` to `freeWhatsAppCredits`

2. **`backend/models/Subscription.js`** ⚠️ DATABASE MODEL
   - Add `whatsappCredits` fields alongside `smsCredits` (for migration)
   - Add `whatsappCreditPurchase` alongside `smsCreditPurchase`
   - Add methods: `useWhatsAppCredits()`, `addWhatsAppCredits()`
   - **Note:** This modifies the database schema

3. **`backend/controllers/subscriptionController.js`**
   - Rename `purchaseSmsCredits` → `purchaseWhatsAppCredits`
   - Rename `getPendingSmsPurchases` → `getPendingWhatsAppPurchases`
   - Rename `approveSmsPurchase` → `approveWhatsAppPurchase`
   - Update all logic to use WhatsApp credits

4. **`backend/routes/ownerSubscriptionRoutes.js`** ⚠️ API ROUTE
   - Change route: `/sms-credits/purchase` → `/whatsapp-credits/purchase`
   - Update function imports

5. **`backend/routes/superAdminRoutes.js`** ⚠️ API ROUTE
   - Change routes: 
     - `/pending-sms` → `/pending-whatsapp`
     - `/approve-sms` → `/approve-whatsapp`

6. **Frontend files** (6 files)
   - Update all SMS references to WhatsApp
   - Update API service calls
   - Update UI text and labels

---

## 🔄 MIGRATION STRATEGY

Since we're modifying the database schema, we have two options:

### Option A: Add New Fields (Safest - Recommended)
- Keep existing SMS fields in database (for backward compatibility)
- Add new WhatsApp fields
- Update code to use WhatsApp fields
- SMS fields become unused but preserved

### Option B: Replace Fields Directly
- Replace SMS fields with WhatsApp fields
- Requires data migration script
- Risk of data loss

**Recommendation: Option A** - Safer, allows rollback if needed

---

## ⚡ CHANGES BREAKDOWN

### Safe Changes (No Breaking):
- ✅ Add `maxWhatsAppMessages` to plan features
- ✅ Update configuration files
- ✅ Update frontend text/labels

### Risky Changes (Require Model/Route Changes):
- ⚠️ Add WhatsApp credit fields to Subscription model
- ⚠️ Change API routes from `/sms-credits` to `/whatsapp-credits`
- ⚠️ Rename controller functions
- ⚠️ Update database schema

---

## ✅ SAFETY MEASURES

1. **Keep SMS fields in database** (don't delete, just stop using them)
2. **Add WhatsApp fields alongside** SMS fields
3. **Maintain backward compatibility** where possible
4. **Test all endpoints** after changes
5. **Update frontend to match backend** changes

---

## 📋 FILES THAT WILL BE MODIFIED

### Backend Files (6 files):
1. `backend/config/subscriptionPlans.js` - Add limits + replace SMS config
2. `backend/models/Subscription.js` - Add WhatsApp credit fields
3. `backend/controllers/subscriptionController.js` - Replace SMS functions
4. `backend/routes/ownerSubscriptionRoutes.js` - Update route
5. `backend/routes/superAdminRoutes.js` - Update routes
6. `backend/models/UserHistory.js` - Update history type

### Frontend Files (5 files):
1. `web/src/services/subscriptionService.js` - Update API calls
2. `web/src/services/superAdminService.js` - Update API calls
3. `web/src/pages/owner/SubscriptionPage.jsx` - Update UI
4. `web/src/pages/superadmin/SubscriptionsPage.jsx` - Update display
5. `web/src/pages/superadmin/PendingApprovalsPage.jsx` - Update approval UI

**Total: 11 files**

---

## 🚀 PROCEED WITH IMPLEMENTATION?

Since you said "apply", I will proceed with the implementation using the safest approach:
- Add WhatsApp fields alongside SMS (don't delete SMS yet)
- Update all references to use WhatsApp
- Keep SMS fields for potential rollback

**Should I proceed?**

