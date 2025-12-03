#!/bin/bash

echo "Building Xaura APK..."
echo ""

cd "$(dirname "$0")"

echo "Step 1: Cleaning previous build..."
flutter clean

echo ""
echo "Step 2: Getting dependencies..."
flutter pub get

echo ""
echo "Step 3: Building APK (this may take 5-10 minutes)..."
flutter build apk --release

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "Build successful!"
    echo "========================================"
    echo ""
    echo "APK location: build/app/outputs/flutter-apk/app-release.apk"
    echo ""
    echo "Next step: Copy the APK to backend/downloads/xaura.apk"
    echo ""
    echo "Copying APK to backend downloads folder..."
    if [ -d "../backend/downloads" ]; then
        cp "build/app/outputs/flutter-apk/app-release.apk" "../backend/downloads/xaura.apk"
        if [ $? -eq 0 ]; then
            echo "APK copied successfully!"
        else
            echo "Failed to copy APK. Please copy manually."
        fi
    else
        echo "Backend downloads folder not found. Please create it and copy manually."
    fi
else
    echo ""
    echo "========================================"
    echo "Build failed!"
    echo "========================================"
    echo "Please check the error messages above."
fi


