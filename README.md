# TaskFlow - Android App (Capacitor)

## ساختار
- \www/\ : فایل‌های وب (HTML/CSS/JS) - مستقل از نسخه دسکتاپ، localStorage جدا: \	askflow_android_v1\
- \ndroid/\ : پروژه نیتیو اندروید (Capacitor 6, minSdk 24, targetSdk 36)
- \capacitor.config.json\ : appId \com.taskflow.app\
- به گوگل شیت مشترک (\	f_sheet_url\) وصله - همون شیت دسکتاپ

## نیازمندی‌ها برای بیلد APK
- JDK 17 (یا 11) - شما JDK 11 دارید
- Android SDK (cmdline-tools + platform-tools + build-tools + platforms)
- Gradle 8.14.3 (داخل پروژه هست)

## چرا SDK دانلود نشد؟
سرور \dl.google.com\ از این شبکه در دسترس نیست (404). راه‌حل‌ها:

### راه 1: نصب Android Studio (ساده‌ترین)
1. https://developer.android.com/studio را باز کن
2. Android Studio نصب کن
3. SDK را از SDK Manager بگیر
4. بعد بیلد:

`powershell
cd "C:/Users/Abtin/Desktop/Project Ai/TaskFlow-Android"
npx cap sync android
cd android
./gradlew assembleDebug
# APK در android/app/build/outputs/apk/debug/app-debug.apk
`

### راه 2: SDK دستی (بدون Android Studio)
1. https://developer.android.com/studio#command-tools -> cmdline-tools-win را دانلود کن
2. به \C:\Android\Sdk\cmdline-tools\latest\ اکسترکت کن
3. متغیر محیطی:
`powershell
$env:ANDROID_HOME="C:\Android\Sdk"
$env:PATH+=";C:\Android\Sdk\platform-tools;C:\Android\Sdk\cmdline-tools\latest\bin"
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"
`

### راه 3: Cloud Build (بدون نصب SDK)
- پوشه \TaskFlow-Android\ را زیپ کن و در https://appcenter.ms یا GitHub Actions آپلود کن
- یا از https://www.pwabuilder.com استفاده کن: www را آپلود کن و APK بگیر

## تست بدون APK (همین الان)
\\\powershell
cd "C:/Users/Abtin/Desktop/Project Ai/TaskFlow-Android"
npx cap serve
# یا
python -m http.server 8000 --directory www
# در گوشی: http://192.168.x.x:8000  و Add to Home Screen
\\\

## گوگل شیت
همون URL که در دسکتاپ گذاشتی - در اندروید هم در Settings > Google Sheets وارد کن.

## نسخه
2.1 (versionCode 2)
