// backend/config.js
// Central configuration — reads from .env, provides typed defaults
require('dotenv').config();

const config = {
  server: {
    port: parseInt(process.env.PORT) || 5001,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  db: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'metrolens',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'metrolens_dev_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || null,
    enabled: !!process.env.GEMINI_API_KEY,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || null,
    enabled: !!process.env.GROQ_API_KEY,
  },
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY || null,
    enabled: !!process.env.NVIDIA_API_KEY,
  },
  ocr: {
    confidenceThreshold: parseInt(process.env.OCR_CONFIDENCE_THRESHOLD) || 60,
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB) || 10,
  },
};

module.exports = config;
