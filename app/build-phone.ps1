$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$localJdk = Join-Path $PSScriptRoot '.jdk\jdk-17.0.20.1+1'
# Fall back to the system JDK 17 (JAVA_HOME) when the project-local JDK is not present.
if (Test-Path $localJdk) { $env:JAVA_HOME = $localJdk }
$env:ANDROID_HOME = Join-Path $PSScriptRoot '.android-sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:GRADLE_USER_HOME = 'C:\ALL Project\.g'
$env:NODE_ENV = 'production'
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
Set-Location (Join-Path $PSScriptRoot 'android')
$localGradle = Join-Path $PSScriptRoot '.build-tools\gradle-9.3.1\bin\gradle.bat'
$gradle = if (Test-Path $localGradle) { $localGradle } else { '.\gradlew.bat' }
& $gradle :app:assembleRelease --no-daemon --max-workers=2 '-PreactNativeArchitectures=arm64-v8a' --init-script "$PSScriptRoot\android-windows.init.gradle"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output 'APK ready: android/app/build/outputs/apk/release/app-release.apk'
