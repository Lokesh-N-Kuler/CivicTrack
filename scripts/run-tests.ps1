# CivicTrack Full-Stack Verification Script
Write-Host "Running Backend Automated Tests (Pytest)..." -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir

# 1. Backend tests
Set-Location "$rootDir\backend"
.\venv\Scripts\pytest.exe -v
$backendExit = $LASTEXITCODE

# 2. Frontend build verification
Write-Host "`nRunning Frontend Production Build Check (TypeScript + Vite)..." -ForegroundColor Cyan
Set-Location "$rootDir\frontend"
npm run build
$frontendExit = $LASTEXITCODE

if ($backendExit -eq 0 -and $frontendExit -eq 0) {
    Write-Host "`n[SUCCESS] All backend tests and frontend builds passed with 0 errors!" -ForegroundColor Green
} else {
    Write-Host "`n[FAILURE] Verification encountered issues. Backend Exit: $backendExit, Frontend Exit: $frontendExit" -ForegroundColor Red
}
