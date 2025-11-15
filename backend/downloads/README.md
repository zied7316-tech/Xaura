# APK Downloads Directory

This directory contains the Android APK file for direct download from the web application.

## How to Add the APK File

1. **Build the Flutter app for Android:**
   ```bash
   cd mobile
   flutter build apk --release
   ```

2. **Copy the APK to this directory:**
   ```bash
   cp mobile/build/app/outputs/flutter-apk/app-release.apk backend/downloads/xaura.apk
   ```

   Or on Windows:
   ```cmd
   copy mobile\build\app\outputs\flutter-apk\app-release.apk backend\downloads\xaura.apk
   ```

3. **Verify the file exists:**
   ```bash
   ls -lh backend/downloads/xaura.apk
   ```

## File Location

The APK file should be named `xaura.apk` and placed directly in this directory.

## Access URL

Once the APK is in place, it will be accessible at:
- Local: `http://localhost:5000/downloads/xaura.apk`
- Production: `https://your-domain.com/downloads/xaura.apk`

## Notes

- The APK file is excluded from Git (see `.gitignore`)
- Make sure to upload the APK file to your production server separately
- The download button in the web app will only appear for Android devices

