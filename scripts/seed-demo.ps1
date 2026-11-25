# CivicTrack Idempotent Demo Seeder Script
Write-Host "Seeding CivicTrack demo data..." -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
Set-Location "$rootDir\backend"

.\venv\Scripts\python.exe -m app.seed
Write-Host "Done. Demo users (citizen@example.com, admin@example.com) and complaints ready." -ForegroundColor Green
