# Build and Deploy APK - Step by Step Guide

## Prerequisites
1. Android Studio installed
2. Flutter SDK installed
3. Android SDK configured

## Step 1: Fix Android Setup

### Install Android Command Line Tools
1. Download from: https://developer.android.com/studio#command-line-tools-only
2. Extract to: `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk\cmdline-tools\latest`
3. Set environment variable:
   - `ANDROID_HOME` = `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk`
   - Add to PATH: `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\tools`

### Or use Android Studio
1. Open Android Studio
2. Tools → SDK Manager
3. Install: Android SDK Platform-Tools, Android SDK Build-Tools
4. Tools → SDK Manager → SDK Tools → Check "Android SDK Command-line Tools"

## Step 2: Build the APK

### Method A: Using Flutter CLI
```bash
cd mobile
flutter clean
flutter pub get
flutter build apk --release
```

### Method B: Using Android Studio
1. Open `mobile` folder in Android Studio
2. Build → Flutter → Build APK
3. Wait for build to complete

## Step 3: Copy APK to Downloads Folder

### Windows Command:
```cmd
copy mobile\build\app\outputs\flutter-apk\app-release.apk backend\downloads\xaura.apk
```

### Or manually:
1. Navigate to: `mobile\build\app\outputs\flutter-apk\`
2. Copy `app-release.apk`
3. Paste to: `backend\downloads\`
4. Rename to: `xaura.apk`

## Step 4: Upload to Production Server

### Using FTP/SFTP:
1. Connect to your server (api.xaura.pro)
2. Navigate to: `backend/downloads/`
3. Upload `xaura.apk` file
4. Ensure file permissions: `chmod 644 xaura.apk`

### Using Git (if downloads folder is tracked):
```bash
git add backend/downloads/xaura.apk
git commit -m "Add APK file"
git push
```

**Note:** APK files are typically large (20-50MB), so Git might not be ideal. Use FTP/SFTP instead.

## Step 5: Verify

1. Visit: `https://api.xaura.pro/downloads/xaura.apk`
2. Should download the file (not show error)
3. Test download button on web app

## Troubleshooting

### If build fails:
- Check `flutter doctor` output
- Install missing Android SDK components
- Ensure `ANDROID_HOME` is set correctly

### If upload fails:
- Check file permissions on server
- Ensure `backend/downloads/` directory exists
- Check server logs for errors

### If download still doesn't work:
- Restart the backend server
- Check that the file exists: `ls -lh backend/downloads/xaura.apk`
- Verify file size is reasonable (not 0 bytes)

