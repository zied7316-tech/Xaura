# Fix "Access is Denied" Error

## The Problem
The "Access is denied" and "Unable to determine engine version" error occurs because Flutter needs proper permissions to access its cache and engine files.

## Solution: Run as Administrator

### Method 1: Use the New Admin Script (Recommended)

1. **Right-click** on `build-apk-admin.bat` in the `mobile` folder
2. Select **"Run as administrator"**
3. Click **"Yes"** when Windows asks for permission
4. Wait for the build to complete

### Method 2: Run Command Prompt as Administrator

1. **Close** the current Command Prompt window
2. **Right-click** on Command Prompt in Start Menu
3. Select **"Run as administrator"**
4. Navigate to the mobile folder:
   ```cmd
   cd "C:\Users\ZAD ECT\Desktop\Xaura\saas\mobile"
   ```
5. Run the build:
   ```cmd
   flutter clean
   flutter pub cache repair
   flutter pub get
   flutter build apk --release
   ```

### Method 3: Fix Flutter Permissions

If running as admin doesn't work, check Flutter folder permissions:

1. Go to: `C:\Users\ZAD ECT\flutter\flutter`
2. **Right-click** the `flutter` folder
3. Select **Properties** → **Security** tab
4. Click **Edit**
5. Select your user account
6. Check **"Full control"**
7. Click **Apply** and **OK**
8. Try building again

## Quick Fix Commands (Run as Administrator)

```cmd
cd "C:\Users\ZAD ECT\Desktop\Xaura\saas\mobile"
flutter clean
flutter pub cache repair
flutter pub get
flutter build apk --release
```

## After Build Succeeds

Copy the APK manually if needed:
```cmd
copy "build\app\outputs\flutter-apk\app-release.apk" "..\backend\downloads\xaura.apk"
```


