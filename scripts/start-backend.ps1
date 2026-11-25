# CivicTrack Backend Startup Script
Write-Host "Starting CivicTrack Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
Set-Location "$rootDir\backend"

if (!(Test-Path ".\venv\Scripts\python.exe")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    .\venv\Scripts\pip install -r requirements.txt
}

# Run migrations and seed check
Write-Host "Verifying database migrations..." -ForegroundColor Yellow
.\venv\Scripts\alembic.exe upgrade head

# Start uvicorn server
Write-Host "CivicTrack API Docs available at: http://127.0.0.1:8000/docs" -ForegroundColor Green
.\venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
