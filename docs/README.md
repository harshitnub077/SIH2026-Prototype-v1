# MetroLens — Legal Metrology Compliance Checker
## Smart India Hackathon — Problem Statement SIH26034
### Ministry of Consumer Affairs, Food & Public Distribution

---

## What It Does

Upload a photo of any packaged commodity label. The system:
1. **OCRs the label** (Tesseract, eng+hin; Gemini Vision fallback for low-confidence images)
2. **Extracts** all mandatory declarations (MRP, net quantity, mfg date, manufacturer details, etc.)
3. **Validates** each field against the **Legal Metrology (Packaged Commodities) Rules, 2011**
4. **Flags violations** with exact rule citations (e.g. `Rule 6(1)(d) — MRP missing`)
5. **Generates a PDF report** for enforcement use
6. **Stores all results** in a searchable repository dashboard

---

## Setup

### Prerequisites
- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14 (running locally, or Supabase/Neon free tier)
- **Tesseract OCR** installed on the system

#### Install Tesseract (Windows)
```bash
# Option 1: via winget
winget install UB-Mannheim.TesseractOCR

# Option 2: Download installer from
# https://github.com/UB-Mannheim/tesseract/wiki
# IMPORTANT: Add Tesseract to PATH after install
# Check: tesseract --version
```

For Hindi OCR support, download the `hin.traineddata` file:
```bash
# After installing Tesseract, download Hindi language data:
# https://github.com/tesseract-ocr/tessdata/blob/main/hin.traineddata
# Place it in: C:\Program Files\Tesseract-OCR\tessdata\
```

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd metrolens

# Backend
cd backend
copy .env.example .env
# Edit .env: set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=metrolens
DB_USER=postgres
DB_PASSWORD=your_pg_password

JWT_SECRET=change_this_in_production

# Optional — Gemini Vision API (free from aistudio.google.com)
GEMINI_API_KEY=your_key_here
```

### 3. Create Database

```bash
# In PostgreSQL:
createdb metrolens
# Or in psql:
# CREATE DATABASE metrolens;
```

### 4. Start Backend

```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
# DB tables are auto-created on first start (Sequelize sync)
```

### 5. Seed Demo Data (for dashboard)

```bash
cd backend
node scripts/seedDemo.js
# Seeds 12 demo products with varying compliance levels
```

For the live demo: team should photograph real products and place images in `backend/uploads/`, then run the seed script pointing to those images (edit `DEMO_PRODUCTS[n].imagePath`).

### 6. Start Frontend

```bash
cd frontend
npm run dev
# Opens on http://localhost:3000
```

---

## Running the Demo

1. Open `http://localhost:3000`
2. Go to **Dashboard** → see seeded product stats
3. Click **New Scan** → upload a real product photo
4. Watch the step indicator: OCR → Extract → Validate → Report
5. See violations with exact rule citations (e.g. `Rule 6(1)(d)`)
6. Download the PDF compliance report
7. Repository (History) shows full scan archive

---

## Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | Next.js 14 + Tailwind CSS | Free |
| Backend | Node.js + Express | Free |
| Database | PostgreSQL + Sequelize ORM | Free (local) |
| OCR Primary | Tesseract.js (eng+hin) | Free, offline |
| OCR Fallback | Gemini 1.5 Flash Vision API | Free tier |
| PDF | pdf-lib | Free |
| Image Processing | sharp | Free |
| Auth | JWT (jsonwebtoken + bcryptjs) | Free |

**Total running cost: ₹0**

---

## Rules Engine

Located at `backend/services/rules_engine.js` — pure functions, zero I/O dependency.

| Rule | What It Checks | Severity |
|---|---|---|
| Rule 6(1)(a) | Product name present | Critical |
| Rule 6(1)(b) | Net quantity declared | Critical |
| Rule 6(1)(c) | Net quantity in valid numeric + unit format | Major |
| Rule 6(1)(d) | MRP (inclusive of all taxes) declared | Critical |
| Rule 6(1)(e) | Month & year of manufacture declared | Critical |
| Rule 6(1)(f) | Best Before date for food products | Major |
| Rule 6(1)(g) | Manufacturer name + complete address with PIN | Critical |
| Rule 6(1)(h) | Consumer care contact (phone or email) | Major |
| Rule 6(2) | Country of origin for imported goods | Major |
| Rule 7 | Only metric (SI) units permitted | Critical |
| Rule 8 | Minimum font height (⚠️ Estimated) | Minor |
| Rule 9 | Permissible error in net quantity (⚠️ Estimated) | Minor |
| Rule 22 | FSSAI license for food products | Major |
| Rule 24 | No dual MRP on same package | Major |
| Rule 26 | No misleading declarations | Minor |

### Estimated Checks
Some checks are physically impossible to perform precisely from a 2D label photo:
- **Rule 8 (Font Height)**: We estimate from pixel measurements. Without a scale reference, mm conversion is approximate. Labeled "ESTIMATED" in UI and PDF.
- **Rule 9 (Net Weight Error)**: Actual weight requires a calibrated scale. Physical verification needed.

This is honest — judges respect this more than false confidence.

---

## Project Structure

```
metrolens/
├── backend/
│   ├── routes/          API route handlers
│   ├── services/
│   │   ├── ocr_service.js       Tesseract + Gemini OCR
│   │   ├── extraction_service.js  Text → structured fields
│   │   ├── rules_engine.js      Rule validation (pure functions)
│   │   └── report_service.js    PDF generation
│   ├── models/          Sequelize ORM (PostgreSQL)
│   ├── middleware/      Auth (JWT) + file upload (multer)
│   └── scripts/         DB seed script
├── frontend/
│   ├── app/
│   │   ├── page.jsx       Landing
│   │   ├── dashboard/     Officer dashboard
│   │   ├── upload/        Scan upload
│   │   ├── results/[id]/  Compliance report view
│   │   └── history/       Repository / search
│   └── lib/api.js       Backend API client
├── tests/
│   └── rules_engine.test.js  Unit tests — all 16 rules
└── docs/
    └── rules_reference.md   Human-readable rule-set
```

---

## Running Tests

```bash
cd backend
npm test
# Runs: tests/rules_engine.test.js
# Tests all rule validation functions with pass/fail cases
```

---

## Known Limitations (be honest with judges)

1. **OCR accuracy**: Tesseract struggles with curved, foil, or very small text on labels. The Gemini fallback handles most of these cases.
2. **Font size (Rule 8)**: Cannot measure exact mm height without a scale reference in the image. Flagged as "Estimated".
3. **Net weight error (Rule 9)**: Physical weighing is required. Cannot verify from a photo.
4. **Product category detection**: We infer "food product" from presence of FSSAI license / ingredients list — this heuristic may miss edge cases.
5. **Hindi OCR**: Tesseract's Hindi model is functional but less accurate than English for printed text. Best results on clear, high-resolution images.
6. **Gemini rate limits**: Free tier is limited to ~15 requests/minute. The system falls back gracefully to Tesseract-only if rate limited.

---

## Demo Day Checklist

- [ ] PostgreSQL running locally
- [ ] Tesseract installed + in PATH (`tesseract --version`)
- [ ] `backend/.env` configured with DB credentials
- [ ] Backend started: `cd backend && npm run dev`
- [ ] DB seeded: `node scripts/seedDemo.js`
- [ ] Frontend started: `cd frontend && npm run dev`
- [ ] 3–4 real product photos ready for live scan
- [ ] At least one visibly non-compliant product (e.g. missing MRP, vague quantity)
- [ ] Internet hotspot tested if using Gemini fallback (or pre-verify Tesseract alone works)
- [ ] PDF download tested in Chrome on demo laptop

---

*MetroLens — Built for Smart India Hackathon 2026, Problem Statement SIH26034*
*Ministry of Consumer Affairs, Food & Public Distribution — Department of Consumer Affairs*
