$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:JAVA_HOME = Join-Path $PSScriptRoot '.jdk\jdk-17.0.20.1+1'
$env:ANDROID_HOME = Join-Path $PSScriptRoot '.android-sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:GRADLE_USER_HOME = 'C:\ALL Project\.g'
$env:NODE_ENV = 'production'
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
Set-Location (Join-Path $PSScriptRoot 'android')
& "$PSScriptRoot\.build-tools\gradle-9.3.1\bin\gradle.bat" :app:assembleRelease --no-daemon --max-workers=2 '-PreactNativeArchitectures=arm64-v8a' --init-script "$PSScriptRoot\android-windows.init.gradle"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output 'APK ready: android/app/build/outputs/apk/release/app-release.apk'
