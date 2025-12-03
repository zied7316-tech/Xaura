@echo off
echo ========================================
echo Building Xaura APK (Administrator Mode)
echo ========================================
echo.
echo NOTE: This script requires Administrator privileges
echo If you see "Access is denied", please:
echo 1. Right-click this file
echo 2. Select "Run as administrator"
echo.
pause

cd /d "%~dp0"

echo.
echo Step 1: Checking permissions...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ERROR: Administrator privileges required!
    echo Please right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo Step 2: Clearing Flutter cache...
call flutter clean
call flutter pub cache repair

echo.
echo Step 3: Getting dependencies...
call flutter pub get

echo.
echo Step 4: Building APK (this may take 5-10 minutes)...
call flutter build apk --release

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Build successful!
    echo ========================================
    echo.
    echo APK location: build\app\outputs\flutter-apk\app-release.apk
    echo.
    echo Copying APK to backend downloads folder...
    if exist "..\backend\downloads" (
        copy "build\app\outputs\flutter-apk\app-release.apk" "..\backend\downloads\xaura.apk"
        if %ERRORLEVEL% EQU 0 (
            echo APK copied successfully!
            echo.
            echo File location: ..\backend\downloads\xaura.apk
        ) else (
            echo Failed to copy APK. Please copy manually.
        )
    ) else (
        echo Backend downloads folder not found. Please create it and copy manually.
    )
) else (
    echo.
    echo ========================================
    echo Build failed!
    echo ========================================
    echo Please check the error messages above.
)

pause


