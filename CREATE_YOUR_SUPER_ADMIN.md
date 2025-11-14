# 🔐 CREATE YOUR OWN SUPER ADMIN ACCOUNT

**Current Default Super Admin:**
- Email: `superadmin@salon.com`
- Password: `SuperSecure123!`

**⚠️ You should replace this with YOUR own account!**

---

## 🎯 METHOD 1: VIA RAILWAY SHELL (RECOMMENDED - 2 MINUTES)

### **Step 1: Open Railway Shell**

1. **Go to Railway** → Your **backend** service
2. **Click "Settings" tab**
3. **Scroll down** and look for **"Shell"** or **"Terminal"**
4. **Click "Open Shell"** or similar button
5. A terminal window will open

### **Step 2: Run the Script**

In the Railway shell, type this command:

```bash
node scripts/createYourSuperAdmin.js
```

### **Step 3: Answer the Questions**

The script will ask you:

```
👤 Your Full Name: [Type your name]
📧 Your Email: [Type your email]
🔑 Your Password: [Type a strong password - min 8 chars]
📱 Your Phone: [Optional - press Enter to skip]
```

### **Step 4: Save Your Credentials!**

The script will show your new credentials. **Save them safely!**

### **Step 5: Login**

1. Go to: https://xaura-production-fd43.up.railway.app/login
2. Use your NEW email and password
3. You're now the Super Admin! ✅

---

## 🎯 METHOD 2: VIA MONGODB ATLAS (5 MINUTES)

If Railway shell doesn't work:

### **Step 1: Register a Normal Account**

1. Go to your frontend: https://xaura-production-fd43.up.railway.app
2. Click "Register"
3. Register with YOUR real email and password
4. Choose any role (e.g., Owner)

### **Step 2: Upgrade to Super Admin**

1. **Go to MongoDB Atlas:** https://cloud.mongodb.com
2. **Login** to your account
3. **Click on Cluster0**
4. **Click "Browse Collections"**
5. **Find the `users` collection**
6. **Find YOUR user** (search by your email)
7. **Click "Edit" (pencil icon)**
8. **Change the `role` field:**
   - From: `owner` (or whatever it is)
   - To: `super-admin`
9. **Click "Update"**

### **Step 3: Login as Super Admin**

1. **Logout** from your frontend
2. **Login again** with your email/password
3. **You're now Super Admin!** ✅

---

## 🎯 METHOD 3: LOCALLY (IF RUNNING LOCALLY)

If you have the project running on your computer:

### **Step 1: Open Terminal**

Navigate to your project:

```bash
cd C:\Users\ZAD ECT\Desktop\saas\backend
```

### **Step 2: Run the Script**

```bash
node scripts/createYourSuperAdmin.js
```

### **Step 3: Answer Questions**

Follow the prompts to create your account.

---

## 🗑️ DELETE THE DEFAULT SUPER ADMIN (IMPORTANT!)

After creating YOUR account:

### **Via MongoDB Atlas:**

1. **Go to MongoDB Atlas** → Cluster0 → Browse Collections
2. **Find `users` collection**
3. **Find the user with email:** `superadmin@salon.com`
4. **Click the trash icon** to delete
5. **Confirm deletion**
6. **Default super admin is removed!** ✅

### **Via Railway Shell:**

Run this command in Railway shell:

```bash
node scripts/deleteSuperAdmin.js superadmin@salon.com
```

---

## 🔒 PASSWORD BEST PRACTICES:

**Use a STRONG password:**
- ✅ At least 12 characters
- ✅ Mix uppercase and lowercase
- ✅ Include numbers
- ✅ Include special characters (!@#$%^&*)
- ✅ Example: `MyXaura2024!Secure#Pass`

**Use YOUR real email:**
- ✅ For password recovery
- ✅ For important notifications
- ✅ For account security

---

## 📝 SUPER ADMIN CREDENTIALS TEMPLATE:

Save this somewhere safe:

```
🌐 Xaura Platform
━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: your-email@gmail.com
🔑 Password: YourSecurePassword123!
👤 Name: Your Full Name
🔗 Login URL: https://xaura-production-fd43.up.railway.app/login
━━━━━━━━━━━━━━━━━━━━━━━
📅 Created: November 14, 2024
```

---

## ✅ AFTER CREATING YOUR ACCOUNT:

**Test it:**
1. ✅ Login with your new credentials
2. ✅ Access Super Admin dashboard
3. ✅ Check all permissions work
4. ✅ Delete the default super admin

**Secure it:**
1. ✅ Save credentials in a password manager
2. ✅ Don't share your password
3. ✅ Enable 2FA if you add it later
4. ✅ Change password regularly

---

## 🆘 TROUBLESHOOTING:

### **"Super Admin already exists" error:**

The script detects the existing super admin. Choose "yes" to replace it.

### **"Cannot connect to MongoDB" error:**

Make sure your `MONGODB_URI` environment variable is set in Railway.

### **"Invalid email or password" when logging in:**

- Double-check your email (case-sensitive)
- Make sure you're using the correct password
- Try the "Forgot Password" feature

---

## 💡 RECOMMENDED: METHOD 1 (Railway Shell)

**Why it's the best:**
- ✅ Interactive and guided
- ✅ Validates your input
- ✅ Automatically hashes password
- ✅ Can replace existing super admin
- ✅ Takes 2 minutes

---

## 🚀 READY TO CREATE YOUR SUPER ADMIN?

**Choose your method:**
1. **Railway Shell** - Fastest and easiest
2. **MongoDB Atlas** - Alternative if shell doesn't work
3. **Locally** - If running on your computer

**Then delete the default super admin for security!**

---

**Good luck! Your platform, your admin account! 🎉**

