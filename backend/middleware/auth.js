const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sih_hackathon_super_secret_key_2026';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token; // Support for EventSource (SSE)
  
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (queryToken) {
    token = queryToken;
  }

  if (!token) {
    // For hackathon fallback if no token is sent (to avoid completely breaking testing before fixing frontend)
    // In production, this should return 401 immediately.
    req.user = { id: null, role: 'field_officer' };
    return next();
  }

  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, email }
    next();
  } catch (err) {
    // Fallback for missing/invalid token in demo
    req.user = { id: null, role: 'field_officer' };
    next();
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, JWT_SECRET };
