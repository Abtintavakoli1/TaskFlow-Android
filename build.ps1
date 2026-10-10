Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
$env:ANDROID_HOME="C:\Android\Sdk"
$env:PATH+=";C:\Android\Sdk\platform-tools;C:\Android\Sdk\cmdline-tools\latest\bin"
Write-Host "ANDROID_HOME=$env:ANDROID_HOME"
npx cap sync android
Set-Location android
./gradlew assembleDebug
Write-Host "APK: android/app/build/outputs/apk/debug/app-debug.apk" -ForegroundColor Green
if (Test-Path "app/build/outputs/apk/debug/app-debug.apk") { Write-Host "BUILD SUCCESS" -ForegroundColor Green; Get-Item "app/build/outputs/apk/debug/app-debug.apk" | Format-Table Name,Length }
