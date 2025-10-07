# NeoCure Backend Startup Script
# Run this from PowerShell: .\start-backend.ps1

Write-Host "🏥 NeoCure Backend Startup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green

# Navigate to backend directory
Set-Location backend

# Check if .env exists
if (-Not (Test-Path .env)) {
    Write-Host "⚠️  No .env file found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ Created .env file. Please edit it with your credentials if needed." -ForegroundColor Green
}

# Start Docker Compose
Write-Host ""
Write-Host "🚀 Starting backend services with Docker Compose..." -ForegroundColor Cyan
docker-compose up --build

# Note: This will block. Press Ctrl+C to stop.
