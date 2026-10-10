@echo off
echo === TaskFlow Android Build ===
set ANDROID_HOME=C:\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\cmdline-tools\latest\bin
echo ANDROID_HOME=%ANDROID_HOME%
call npx cap sync android
cd android
call gradlew assembleDebug
echo.
echo APK: android\app\build\outputs\apk\debug\app-debug.apk
pause
