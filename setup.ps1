<#
.SYNOPSIS
Local setup script for SIH26034 MetroLens (Windows)
#>

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "MetroLens (SIH26034) Local Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Check Node.js
try {
    $nodeVer = node -v
    Write-Host "✅ Node.js found: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js (v18+) from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 2. Check PostgreSQL
try {
    $psqlVer = psql --version
    Write-Host "✅ PostgreSQL found: $psqlVer" -ForegroundColor Green
} catch {
    Write-Host "⚠️ PostgreSQL (psql) not found in PATH." -ForegroundColor Yellow
    Write-Host "   Please install PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "   Or if installed, ensure C:\Program Files\PostgreSQL\<version>\bin is in your system PATH." -ForegroundColor Yellow
}

# 3. Check Tesseract
try {
    $tessVer = tesseract --version 2>&1
    Write-Host "✅ Tesseract OCR found." -ForegroundColor Green
} catch {
    Write-Host "⚠️ Tesseract OCR not found in PATH." -ForegroundColor Yellow
    Write-Host "   Please download the UB-Mannheim installer: https://github.com/UB-Mannheim/tesseract/wiki" -ForegroundColor Yellow
    Write-Host "   Ensure C:\Program Files\Tesseract-OCR is in your system PATH." -ForegroundColor Yellow
}

# 4. Install Dependencies
Write-Host "`nInstalling Backend dependencies..." -ForegroundColor Cyan
Set-Location -Path .\backend
npm install
Set-Location -Path ..

Write-Host "Installing Frontend dependencies..." -ForegroundColor Cyan
Set-Location -Path .\frontend
npm install
Set-Location -Path ..

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "Setup complete (dependencies installed)." -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Create database: psql -U postgres -c `"CREATE DATABASE metrolens_db;`""
Write-Host "2. Copy backend/.env.example to backend/.env and update credentials."
Write-Host "3. Seed database: cd backend ; npm run db:seed"
Write-Host "4. Start backend: cd backend ; npm run dev"
Write-Host "5. Start frontend: cd frontend ; npm run dev"
Write-Host "============================================================" -ForegroundColor Cyan
