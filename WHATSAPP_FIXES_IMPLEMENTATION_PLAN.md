# 📋 WhatsApp Fixes Implementation Plan

## 🎯 Requirements Summary

1. ✅ **Add usage tracking to enforce monthly limits**
   - Check subscription limits before sending WhatsApp messages
   - Track monthly usage (reset at start of each month)
   - Deduct from WhatsApp credits if using credit system
   - Enforce plan limits: Pro (1500/month), Enterprise (3000/month)

2. ✅ **Fix client not receiving WhatsApp messages**
   - Investigate why workers receive but clients don't
   - Ensure phone number formatting is correct

3. ✅ **Automatic Tunisian country code (+216)**
   - Automatically add +216 prefix to all phone numbers
   - Format during registration
   - Format when sending WhatsApp messages
   - Users should only enter their number (e.g., "12345678" becomes "+21612345678")

4. ✅ **Registration notification about WhatsApp**
   - Inform users during registration that they should provide a WhatsApp number
   - Update registration forms/UI

---

## 📊 SCANNING REPORT

### Current Phone Number Handling:

**Backend:**
- `backend/services/whatsappService.js` - Formats phone numbers (removes whatsapp: prefix, adds +)
- `backend/services/notificationService.js` - Uses phone numbers from appointment.clientId.phone
- `backend/controllers/authController.js` - Accepts phone during registration (no formatting)
- `backend/models/User.js` - Phone field is required but no validation/formatting

**Frontend:**
- `web/src/pages/auth/RegisterPage.jsx` - Phone input field (placeholder: "+1234567890")
- No automatic country code formatting

### Current WhatsApp Message Flow:

1. Appointment created → `appointmentController.js` calls `notificationService.sendAppointmentConfirmation()`
2. `notificationService.js` gets `appointment.clientId.phone` and `appointment.workerId.phone`
3. Calls `whatsappService.sendWhatsApp(phoneNumber, message)`
4. `whatsappService.js` formats phone number (adds whatsapp: prefix)

### Issues Identified:

1. ❌ **No usage tracking** - Messages sent without checking limits
2. ❌ **No automatic Tunisian country code** - Users must manually add +216
3. ❌ **Client messages may fail** - Phone numbers might not be formatted correctly
4. ❌ **No WhatsApp notification during registration**

---

## 📝 DETAILED IMPLEMENTATION PLAN

### Phase 1: Create Phone Number Utility (Tunisian Formatting) ✅ SAFE

**File: `backend/utils/phoneFormatter.js` (NEW FILE)**
- Create utility to format Tunisian phone numbers
- Automatically add +216 if missing
- Handle various input formats (with/without country code, spaces, dashes)
- Normalize to: `+216XXXXXXXX` format

**Why safe:** New utility file, doesn't modify existing code

---

### Phase 2: Add Usage Tracking for WhatsApp Messages ⚠️ REQUIRES MODEL CHANGES

**Why necessary:**
- Need to track monthly message usage per subscription
- Need to check limits before sending
- Need to reset monthly counter at start of each month

**Files to Modify:**

1. **`backend/models/Subscription.js`** ⚠️ DATABASE MODEL
   - Add `whatsappUsage: { currentMonthCount: Number, lastResetDate: Date }`
   - Add method: `checkAndIncrementWhatsAppUsage()`
   - Add method: `resetMonthlyUsage()` (called on monthly reset)

2. **`backend/services/notificationService.js`**
   - Add usage tracking before sending WhatsApp
   - Check subscription limits (plan limits + credits)
   - Track usage after successful send
   - Handle errors gracefully (don't break appointment flow)

**Why this is safe:**
- Adding new fields to model (backward compatible)
- Existing functionality remains unchanged
- Only adds tracking, doesn't remove anything

---

### Phase 3: Apply Tunisian Country Code Automatically ⚠️ MODIFIES LOGIC

**Files to Modify:**

1. **`backend/utils/phoneFormatter.js` (NEW)**
   - Create phone formatting utility

2. **`backend/controllers/authController.js`** ⚠️ CONTROLLER
   - Format phone number before saving to database
   - Auto-add +216 if missing

3. **`backend/services/whatsappService.js`**
   - Use phone formatter to ensure Tunisian format
   - Auto-add +216 if missing before sending

4. **`backend/controllers/qrRegistrationController.js`**
   - Format phone during QR registration

5. **Frontend registration forms**
   - Update placeholder/hint text
   - Show that WhatsApp number is required

**Why this is safe:**
- Only adds formatting logic
- Doesn't break existing functionality
- Backward compatible (handles numbers with/without +216)

---

### Phase 4: Fix Client Message Issue 🔍 INVESTIGATION NEEDED

**Possible Causes:**
1. Client phone number format incorrect
2. Client phone number missing
3. Phone number not formatted with Tunisian code
4. Twilio rejecting client numbers

**Solution:**
- Add phone number formatting before sending to client
- Add detailed logging to identify issue
- Ensure phone numbers are validated and formatted

---

### Phase 5: Registration WhatsApp Notification ✅ SAFE

**Files to Modify:**

1. **`web/src/pages/auth/RegisterPage.jsx`**
   - Update phone input label/placeholder
   - Add hint text about WhatsApp requirement

2. **`backend/controllers/authController.js`**
   - Add validation message about WhatsApp number

**Why safe:** UI text changes only, no logic changes

---

## 🔍 ISSUES TO FIX

### Issue 1: Client Not Receiving Messages

**Possible causes:**
1. Phone number format incorrect (missing country code)
2. Phone number not populated in database
3. Phone number validation failing

**Fix:**
- Format phone numbers before sending
- Add automatic +216 country code
- Improve error logging

### Issue 2: No Usage Tracking

**Fix:**
- Track messages sent per subscription
- Check limits before sending
- Reset monthly counter

### Issue 3: No Tunisian Country Code Auto-Format

**Fix:**
- Create phone formatter utility
- Apply during registration
- Apply before sending WhatsApp

---

## 📋 FILES TO CREATE/MODIFY

### New Files (1 file):
1. `backend/utils/phoneFormatter.js` - Phone number formatting utility

### Backend Files to Modify (6 files):
1. `backend/models/Subscription.js` - Add usage tracking fields
2. `backend/services/notificationService.js` - Add usage tracking logic
3. `backend/services/whatsappService.js` - Add phone formatting
4. `backend/controllers/authController.js` - Format phone during registration
5. `backend/controllers/qrRegistrationController.js` - Format phone during QR registration

### Frontend Files to Modify (1 file):
1. `web/src/pages/auth/RegisterPage.jsx` - Update phone input UI

**Total: 8 files (1 new + 7 modified)**

---

## ✅ SAFETY MEASURES

1. **Phone formatting is backward compatible** - Handles numbers with/without +216
2. **Usage tracking doesn't block messages** - Logs errors but doesn't break flow
3. **No breaking changes** - All changes are additive
4. **Graceful error handling** - Messages still sent even if tracking fails

---

## 🚀 READY TO IMPLEMENT

All requirements identified and plan created. Proceeding with implementation...

