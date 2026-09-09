// backend/server.js
// Express application entry point — SIH26034 MetroLens Backend
// Updated for Spec 05: base path /api/v1, standardized error envelope
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { syncDatabase, User } = require('./models');

// ─── ROUTES ──────────────────────────────────────────────────────────────────
const scansRouter    = require('./routes/scans');
const reportsRouter  = require('./routes/reports');
const dashboardRouter = require('./routes/dashboard');
const authRouter     = require('./routes/auth');
const rulesRouter    = require('./routes/rules');
const modelsRouter   = require('./routes/models');
const debugRouter    = require('./routes/debug');
const metrologyRouter = require('./routes/metrology');

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors());
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically (thumbnails in frontend)
app.use('/uploads', express.static(path.resolve('./uploads')));
// Serve generated reports statically (fallback direct access)
app.use('/reports-static', express.static(path.resolve('./reports')));

// ─── API ROUTES (base: /api/v1) ───────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`,      authRouter);
app.use(`${API}/scans`,     scansRouter);
app.use(`${API}/metrology`, metrologyRouter);
app.use(`${API}/models`,    modelsRouter);
app.use(`${API}/debug`,     debugRouter);
app.use(`${API}/reports`,   reportsRouter);
app.use(`${API}/dashboard`, dashboardRouter);
app.use(`${API}/rules`,     rulesRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get(`${API}/health`, (req, res) => {
  res.json({
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      commit: process.env.RENDER_GIT_COMMIT || 'local',
      service: 'MetroLens — SIH26034 Legal Metrology Compliance Checker',
      geminiEnabled: config.gemini?.enabled ?? false,
    },
  });
});

// ── Legacy /api aliases (backward compat during transition) ──────────────────
// Remove after all frontend calls are updated to /api/v1
app.use('/api/auth',      authRouter);
app.use('/api/scans',     scansRouter);
app.use('/api/reports',   reportsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/rules',     rulesRouter);

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
// Spec 05: all errors use { error: { code, message } } envelope
app.use((err, req, res, next) => {
  console.error('[Error]', err.code || 'INTERNAL', err.message);

  // Multer file-size exceeded
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: { code: 'FILE_TOO_LARGE', message: `File too large. Maximum size is ${config.upload?.maxFileSizeMB || 10}MB.` },
    });
  }

  // Known application error codes (propagated from services)
  if (err.code && typeof err.code === 'string' && err.code === err.code.toUpperCase()) {
    return res.status(err.httpStatus || 400).json({
      error: { code: err.code, message: err.message },
    });
  }

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal server error' },
  });
});

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

// ─── START ────────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    console.log('Environment variable keys:', Object.keys(process.env));
    console.log('Is DATABASE_URL present in env?', !!process.env.DATABASE_URL);
    // Auto-sync database tables and seed default officers on startup
    try {
      await syncDatabase();
      const userCount = await User.count().catch(() => 0);
      if (userCount === 0) {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('officer123', 10);
        await User.create({
          name: 'Inspector Verma',
          email: 'officer@gov.in',
          passwordHash: hash,
          role: 'officer',
        });
        await User.create({
          name: 'Controller General',
          email: 'admin@gov.in',
          passwordHash: hash,
          role: 'admin',
        });
        console.log('✅ Default users seeded: officer@gov.in, admin@gov.in');
      }
    } catch (syncErr) {
      console.error('⚠️ Database auto-sync warning:', syncErr.message);
    }

    

app.listen(config.server.port, () => {
      console.log('');
      console.log('┌────────────────────────────────────────────────┐');
      console.log('│  MetroLens Backend — SIH26034                 │');
      console.log('│  Legal Metrology Compliance Checker             │');
      console.log('├────────────────────────────────────────────────┤');
      console.log(`│  API     : http://localhost:${config.server.port}/api/v1        │`);
      console.log(`│  DB      : ${config.db.name}@${config.db.host}             │`);
      console.log(`│  Gemini  : ${config.gemini?.enabled ? '✓ Enabled (fallback)' : '✗ Not configured (Tesseract-only)'}  │`);
      console.log('└────────────────────────────────────────────────┘');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
