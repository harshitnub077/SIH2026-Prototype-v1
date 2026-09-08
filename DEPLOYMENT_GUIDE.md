# MetroLens — Local Setup & Deployment Guide (SIH26034)

## Part A: Local Setup (Execution)

Follow these steps in this exact order:

1. **Install PostgreSQL** on your laptop. Then, using `psql` or pgAdmin, run:
   ```sql
   CREATE DATABASE metrolens_db;
   ```
2. **Backend `.env` Configuration**:
   - In the `backend` folder, copy `.env.example` to `.env`.
   - Fill in your local database credentials: `DB_USER`, `DB_PASSWORD`, `DB_NAME=metrolens_db`, and `DB_PORT` (default is 5432).
3. **Install Dependencies**:
   - Open a terminal in the `frontend` folder and run `npm install`.
   - Open a terminal in the `backend` folder and run `npm install`.
4. **Install Tesseract OCR (Crucial)**:
   - **Windows**: Use the UB-Mannheim installer. Add `C:\Program Files\Tesseract-OCR` to your system `PATH`.
   - **Mac**: Run `brew install tesseract`.
   - **Linux**: Run `sudo apt install tesseract-ocr`.
   *Note: Restart your terminal after installing so the PATH updates take effect.*
5. **Seed the Database**:
   - Inside the `backend` folder, run `npm run db:seed`.
   - *(If this errors, it means PostgreSQL isn't running or your `.env` credentials are incorrect. Fix that before proceeding).*
6. **Run the Application**:
   - Open two terminals:
     - Terminal 1 (`backend`): `npm run dev` (starts on port 5000)
     - Terminal 2 (`frontend`): `npm run dev` (starts on port 3000)
   - Visit `http://localhost:3000` in your browser.
7. **Domain Verification (Do this before demo day)**:
   - Download the actual **Legal Metrology (Packaged Commodities) Rules 2011 PDF** from `consumeraffairs.gov.in`.
   - Open `backend/rules_engine.js` and cross-check every rule ID (e.g., `Rule 6(1)(a)`) against the real clause text in the official document.
   - Fix any mismatches directly in the code to ensure it's "judge-proof".

---

## Part B: Free Deployment (Safety Net & Mentorship)

Deploying gives you a safety net if your laptop fails on stage and allows judges/mentors to access it from anywhere.

### Tech Stack for Free Deployment
| Component | Hosting | Why |
|---|---|---|
| **Frontend** | Vercel (Free Tier) | Built for Next.js, auto-deploys from GitHub. |
| **Backend** | Render (Free Tier) | Supports Node.js, allows system package installs (Tesseract). |
| **Database** | Render / Neon.tech | Free hosted PostgreSQL instances. |
| **OCR** | Inside Render | We can install Tesseract via `apt-get` during Render's build phase. |
| **LLM** | Gemini Vision API | Uses the same API key, just configured as a cloud environment variable. |

### Deployment Steps
1. **GitHub Setup**: Push your code to GitHub (either as one repository with `frontend` and `backend` folders, or two separate repositories).
2. **Database Setup (Neon or Render)**:
   - Create a free PostgreSQL instance.
   - Copy the provided connection string URI.
3. **Backend on Render**:
   - Create a new "Web Service" on Render and connect your GitHub repository (set root directory to `backend`).
   - The included `render.yaml` automatically configures the environment to install Tesseract OCR (`apt-get install -y tesseract-ocr`).
   - Go to the **Environment** tab on Render and add your variables (e.g., `DATABASE_URL`, `GEMINI_API_KEY`). **Never commit your `.env` file to GitHub.**
   - Once deployed, run your seed script against the remote database using Render's "Shell" or as a deployment hook.
4. **Frontend on Vercel**:
   - Production URL: [https://metrolens.vercel.app](https://metrolens.vercel.app)
   - Import your repository to Vercel and set the root directory to `frontend`.
   - In Vercel's Environment Variables settings, add `NEXT_PUBLIC_API_URL` and set it to your deployed Render backend URL (e.g., `https://metrolens-backend.onrender.com/api/v1`).
   - Domain Assignment: In Vercel Project Settings → Domains, ensure `metrolens.vercel.app` is assigned.
5. **Test**:
   - Upload a real photo on the live Vercel URL ([https://metrolens.vercel.app](https://metrolens.vercel.app)) to confirm OCR, Gemini fallback, and the rules engine work end-to-end.

> **Caution for Free Tiers**: Render's free web services spin down after 15 minutes of inactivity. **Ping your deployed link 5-10 minutes before your judging slot** so it is "warm". Do not let the first live request in front of judges be a slow cold-start! Always keep your local version working as a backup.

---

## Part C: Sharing with Your Mentor
Once deployed, send your mentor a complete review package:
1. The Live Vercel URL: [https://metrolens.vercel.app](https://metrolens.vercel.app)
2. The GitHub Repository Link: [https://github.com/harshitnub077/SIH2026-Prototype-v1](https://github.com/harshitnub077/SIH2026-Prototype-v1)
3. The `SIH26034_PS_and_Solution.md` document

This provides a complete, reviewable package without needing your laptop running.
