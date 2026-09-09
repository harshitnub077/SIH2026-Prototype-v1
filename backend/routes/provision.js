
// POST /api/auth/provision-officer (Admin only)
router.post('/provision-officer', async (req, res) => {
  try {
    // 1. Verify Admin Token manually for this specific route
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admins can provision accounts' });
    }

    // 2. Create the new user
    const { name, email, password, role = 'officer' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role });

    res.status(201).json({
      success: true,
      message: 'Officer account provisioned successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

