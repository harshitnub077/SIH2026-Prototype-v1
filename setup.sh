#!/bin/bash
# Local setup script for SIH26034 MetroLens (Mac/Linux)

echo "============================================================"
echo "MetroLens (SIH26034) Local Setup"
echo "============================================================"

# 1. Check Node.js
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js found: $(node -v)"
else
    echo "❌ Node.js not found. Please install Node.js (v18+) from https://nodejs.org"
    exit 1
fi

# 2. Check PostgreSQL
if command -v psql >/dev/null 2>&1; then
    echo "✅ PostgreSQL found: $(psql --version)"
else
    echo "⚠️ PostgreSQL (psql) not found in PATH."
    echo "   Please install PostgreSQL (e.g. brew install postgresql or sudo apt install postgresql)"
fi

# 3. Check Tesseract
if command -v tesseract >/dev/null 2>&1; then
    echo "✅ Tesseract OCR found."
else
    echo "⚠️ Tesseract OCR not found in PATH."
    echo "   Please install Tesseract (e.g. brew install tesseract or sudo apt install tesseract-ocr)"
fi

# 4. Install Dependencies
echo -e "\nInstalling Backend dependencies..."
cd backend || exit
npm install
cd .. || exit

echo "Installing Frontend dependencies..."
cd frontend || exit
npm install
cd .. || exit

echo -e "\n============================================================"
echo "Setup complete (dependencies installed)."
echo "Next Steps:"
echo "1. Create database: psql -U postgres -c \"CREATE DATABASE metrolens_db;\""
echo "2. Copy backend/.env.example to backend/.env and update credentials."
echo "3. Seed database: cd backend && npm run db:seed"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"
echo "============================================================"
