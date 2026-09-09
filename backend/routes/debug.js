const express = require('express');
const router = express.Router();
const { Batch, Scan } = require('../models');

router.get('/batches', async (req, res) => {
  try {
    const batches = await Batch.findAll({ limit: 5, order: [['created_at', 'DESC']] });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
