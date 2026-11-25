# CivicTrack Frontend Startup Script
Write-Host "Starting CivicTrack Frontend on http://localhost:5173..." -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
Set-Location "$rootDir\frontend"

if (!(Test-Path ".\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

npm run dev
