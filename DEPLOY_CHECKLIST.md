# DEPLOYMENT AUTOMATION CHECKLIST

Here is the exact status of the deployment automation.

### Fully Automated by Antigravity
- [x] **Backend `.env.example`**: Generated with clear comments for all required variables (`DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `DATABASE_URL`, `GEMINI_API_KEY`, `PORT`, `JWT_SECRET`, etc.).
- [x] **Setup Scripts**: Created `setup.sh` (Mac/Linux) and `setup.ps1` (Windows) at the root to check dependencies (PostgreSQL, Tesseract), install npm packages, and output clear instructions.
- [x] **Database Seed Script**: Verified `backend/scripts/seedDatabase.js` seeds 12+ products, scans, and violations. Confirmed it's wired in `package.json` as `npm run db:seed`.
- [x] **Render config**: Verified the root `render.yaml` is valid for Render, points at the backend Docker service, and keeps API keys out of source control.
- [x] **Frontend API connection**: Verified `frontend/lib/api.js` correctly falls back to `http://localhost:5000/api/v1` locally but prioritizes `process.env.NEXT_PUBLIC_API_URL` when deployed. Generated `vercel.json`.
- [x] **Rule Citation Verification**: Cross-checked `backend/rules_engine.js`.
- [x] **GitHub Repo Creation**: Executed `gh repo create` to push the codebase to GitHub.
- [x] **Vercel Frontend Deployment**: Deployed and configured for [https://metrolens.vercel.app](https://metrolens.vercel.app).

### Manual Steps Remaining For You
Because some tools (`render`, `psql`) are not installed/authenticated on your machine, or require accessing a web dashboard for API keys, you must do these manually:

1. **Get your Gemini API Key**: Go to Google AI Studio and grab a free API key. Add this to your backend `.env` (local) and Render environment (cloud).
2. **Setup Cloud Database (Neon.tech or Render)**:
   - Create a free Postgres instance.
   - Copy the `DATABASE_URL` (Connection String).
3. **Deploy Backend to Render**:
   - Go to the Render Dashboard -> New Web Service.
   - Connect the GitHub repo (that I just pushed for you).
   - Set the root directory to `backend`.
   - Add the Environment Variables (`DATABASE_URL`, `GEMINI_API_KEY`, `NODE_ENV=production`).
   - Click Deploy.
4. **Seed the Cloud Database**:
   - In Render, once the backend is deployed, go to the "Shell" tab.
   - Run `npm run db:seed`.
5. **Connect Vercel to Render**:
   - Go to your Vercel Dashboard for the frontend deployment.
   - Go to Settings -> Environment Variables.
   - Add `NEXT_PUBLIC_API_URL` and set it to your new Render backend URL (e.g. `https://metrolens-backend.onrender.com/api/v1`).
   - Trigger a redeploy on Vercel so it picks up the environment variable.
