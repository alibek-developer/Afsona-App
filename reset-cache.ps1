# reset-cache.ps1
Write-Host "🧹 Starting deep cache reset..." -ForegroundColor Cyan

# Remove lock files and node_modules
Write-Host "🗑️ Removing node_modules and lock files..."
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Remove Expo cache
Write-Host "🗑️ Removing Expo cache..."
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# Remove Android/iOS build artifacts
Write-Host "🗑️ Removing Android/iOS build artifacts..."
Remove-Item -Recurse -Force android/.gradle -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android/app/build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ios/build -ErrorAction SilentlyContinue

# Reinstall dependencies
Write-Host "📦 Reinstalling dependencies..." -ForegroundColor Yellow
npm install

# Start Expo with cleared cache
Write-Host "🚀 Starting Expo with cleared cache..." -ForegroundColor Green
npx expo start -c
