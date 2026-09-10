const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/stock — PUBLIC. Only products explicitly toggled are stored here;
// any product name absent from this list is considered available by default.
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT name, available, updated_at FROM stock').all();
  res.json(rows.map(r => ({ name: r.name, available: !!r.available, updatedAt: r.updated_at })));
});

// PUT /api/stock/:name — admin only. Body: { available: true|false }
router.put('/:name', requireAdmin, (req, res) => {
  const name = req.params.name;
  const { available } = req.body || {};
  if (typeof available !== 'boolean') {
    return res.status(400).json({ error: 'Le champ "available" (booléen) est requis.' });
  }
  const updated_at = new Date().toISOString();
  db.prepare(`
    INSERT INTO stock (name, available, updated_at) VALUES (@name, @available, @updated_at)
    ON CONFLICT(name) DO UPDATE SET available = @available, updated_at = @updated_at
  `).run({ name, available: available ? 1 : 0, updated_at });

  res.json({ name, available, updatedAt: updated_at });
});

module.exports = router;
