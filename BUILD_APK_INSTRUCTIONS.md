# How to Build the APK - Step by Step

## For Windows Users

### Method 1: Using Command Prompt (CMD)

1. **Open Command Prompt**
   - Press `Windows Key + R`
   - Type `cmd` and press Enter
   - OR search for "Command Prompt" in Start Menu

2. **Navigate to the mobile folder**
   ```cmd
   cd C:\Users\ZAD ECT\Desktop\Xaura\saas\mobile
   ```

3. **Run the build script**
   ```cmd
   build-apk.bat
   ```

4. **Wait for completion** (5-10 minutes)
   - The script will:
     - Clean previous builds
     - Get dependencies
     - Build the APK
     - Copy it to `backend\downloads\xaura.apk`

### Method 2: Using File Explorer (Easiest)

1. **Open File Explorer**
   - Navigate to: `C:\Users\ZAD ECT\Desktop\Xaura\saas\mobile`

2. **Double-click** `build-apk.bat`
   - A Command Prompt window will open
   - The build will start automatically
   - Wait for it to complete

3. **Check the result**
   - The script will tell you if it succeeded
   - The APK will be in: `C:\Users\ZAD ECT\Desktop\Xaura\saas\backend\downloads\xaura.apk`

### Method 3: Using PowerShell

1. **Open PowerShell**
   - Right-click Start Menu → Windows PowerShell
   - OR search for "PowerShell" in Start Menu

2. **Navigate to the mobile folder**
   ```powershell
   cd "C:\Users\ZAD ECT\Desktop\Xaura\saas\mobile"
   ```

3. **Run the build script**
   ```powershell
   .\build-apk.bat
   ```

## What to Expect

When you run the script, you'll see:

```
Building Xaura APK...

Step 1: Cleaning previous build...
[Flutter clean output]

Step 2: Getting dependencies...
[Flutter pub get output]

Step 3: Building APK (this may take 5-10 minutes)...
[Flutter build output - this is the longest part]

========================================
Build successful!
========================================

APK location: build\app\outputs\flutter-apk\app-release.apk

Copying APK to backend downloads folder...
APK copied successfully!
```

## Troubleshooting

### If the script fails:
1. Make sure Flutter is installed: `flutter --version`
2. Make sure you're in the `mobile` folder
3. Check for error messages in the output

### If you get "flutter: command not found":
- Flutter is not in your PATH
- Add Flutter to your system PATH, or use the full path to Flutter

### If build takes too long:
- This is normal! First build can take 10-15 minutes
- Subsequent builds will be faster

## After Build Completes

1. **Verify the APK exists:**
   - Check: `backend\downloads\xaura.apk`
   - File size should be ~20-50MB

2. **Test the download button:**
   - Open your web app
   - Click "Download App" in the sidebar
   - The APK should download

3. **Upload to production (if needed):**
   - Upload `backend\downloads\xaura.apk` to your server
   - Place it in: `backend/downloads/xaura.apk` on the server


