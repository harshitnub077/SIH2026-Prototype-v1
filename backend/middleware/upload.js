// backend/middleware/upload.js
// ============================================================
// Multer image upload middleware — Spec 04 Step 1 constraints
// Accept: JPG/PNG only, max 10 MB
// Resolution check happens in ocr_service after disk write.
// ============================================================
const multer = require('multer');
const path = require('path');
const { randomUUID: uuidv4 } = require('crypto');
const fs = require('fs');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE_MB = 35;

if (!fs.existsSync(UPLOAD_DIR)) { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); }

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${uuidv4()}${path.extname(file.originalname || '.jpg')}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif', '.bmp'];
  const ext = path.extname(file.originalname || '').toLowerCase();
  const isImageMime = !file.mimetype || file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream';

  if (!isImageMime && ext && !allowed.includes(ext)) {
    return cb(
      Object.assign(
        new Error(`Unsupported file type. Received: ${file.mimetype || ext}`),
        { code: 'INVALID_FILE_TYPE' }
      ),
      false
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // 35 MB
    files: 4, // Max 4 images per request
  },
});

// ─── Error handler wrapper for Multer errors ─────────────────────────────────
// Call this instead of raw upload.single() in routes that want clean JSON errors
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: `File too large — maximum size is ${MAX_FILE_SIZE_MB}MB. Compress the image and try again.`,
        code: 'FILE_TOO_LARGE',
      });
    }
    return res.status(400).json({ error: err.message, code: err.code });
  }

  if (err?.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ error: err.message, code: err.code });
  }

  if (err) {
    return res.status(400).json({ error: err.message });
  }

  next();
}

module.exports = upload;
module.exports.handleUploadError = handleUploadError;
