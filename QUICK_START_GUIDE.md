# 🚀 QUICK START - Super Admin Login

## ⚡ **Easy Way - Just Double Click!**

1. **Find the file:** `START_SERVERS.bat` in your project folder
   ```
   C:\Users\ZAD ECT\Desktop\saas\START_SERVERS.bat
   ```

2. **Double-click it** - Two command windows will open:
   - Backend Server (Port 5000)
   - Frontend Server (Port 3000)

3. **Wait 10-15 seconds** for both to start

4. **Open your browser** to:
   ```
   http://localhost:3000/login
   ```

5. **Login with:**
   ```
   Email: admin@xaura.com
   Password: SuperAdmin123!
   ```

6. **You're in!** 🎉 Your Super Admin Dashboard will open!

---

## 📋 **Manual Way (If needed)**

### Step 1: Kill Existing Processes
Open Command Prompt and run:
```cmd
taskkill /F /IM node.exe
```

### Step 2: Start Backend
```cmd
cd C:\Users\ZAD ECT\Desktop\saas\backend
npm run dev
```
**Keep this window open!** Wait until you see:
```
Server running in development mode on port 5000
MongoDB Connected: localhost
```

### Step 3: Start Frontend (NEW Window)
Open a **NEW** Command Prompt and run:
```cmd
cd C:\Users\ZAD ECT\Desktop\saas\web
npm run dev
```
**Keep this window open too!** Wait until you see:
```
➜  Local:   http://localhost:3000/
```

### Step 4: Login
Open browser → `http://localhost:3000/login`

---

## ✅ **Verification**

### Check if Servers are Running:
Open Command Prompt:
```cmd
netstat -ano | findstr ":5000"
netstat -ano | findstr ":3000"
```

Both should show "LISTENING"

---

## 🐛 **Still Getting ERR_CONNECTION_REFUSED?**

### Option 1: Use the Batch File
Just double-click `START_SERVERS.bat` in your project folder!

### Option 2: Check Manually

**Check Backend:**
Open browser to: `http://localhost:5000/`
- Should see: "Cannot GET /" (this is OK, means backend is running)
- If browser can't connect, backend is not running

**Check Frontend:**
Open browser to: `http://localhost:3000/`
- Should see: The Xaura login page or landing page
- If browser can't connect, frontend is not running

---

## 💡 **Common Issues**

### Issue: "Port already in use"
**Solution:**
```cmd
taskkill /F /IM node.exe
```
Wait 3 seconds, then restart.

### Issue: "MongoDB not connected"
**Solution:**
1. Check if MongoDB is running:
   ```cmd
   net start MongoDB
   ```
2. Or start MongoDB service from Windows Services

### Issue: "npm command not found"
**Solution:**
You need Node.js installed. Download from: https://nodejs.org/

---

## 🎯 **Super Admin Credentials**

```
📧 Email:    admin@xaura.com
🔑 Password: SuperAdmin123!
```

After logging in, you'll see your **Platform Dashboard** with all salon statistics!

---

## ⚠️ **IMPORTANT**

**DO NOT CLOSE** the two command windows while using Xaura!
- One runs the backend
- One runs the frontend
- Closing them stops the servers

To stop the servers properly:
- Press `Ctrl + C` in each command window
- Or just close the windows

---

**TIP:** Create a desktop shortcut to `START_SERVERS.bat` for quick access!

Right-click `START_SERVERS.bat` → Send to → Desktop (create shortcut)




