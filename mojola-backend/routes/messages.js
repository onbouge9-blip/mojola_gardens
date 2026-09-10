const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { genId, requireAdmin } = require('../middleware/auth');

// POST /api/messages — public, called from contact.html
router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.nom || !b.tel || !b.message) {
    return res.status(400).json({ error: 'Nom, téléphone et message sont requis.' });
  }
  const id = genId();
  const created_at = new Date().toISOString();

  db.prepare(`
    INSERT INTO messages (id, created_at, status, nom, tel, sujet, message)
    VALUES (@id, @created_at, 'nouveau', @nom, @tel, @sujet, @message)
  `).run({
    id, created_at,
    nom: b.nom || '',
    tel: b.tel || '',
    sujet: b.sujet || '',
    message: b.message || ''
  });

  res.status(201).json({ id, created_at, status: 'nouveau' });
});

// GET /api/messages — admin only
router.get('/', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all();
  res.json(rows);
});

// PATCH /api/messages/:id — admin only, update status
router.patch('/:id', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'Le champ status est requis.' });
  const result = db.prepare('UPDATE messages SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Message introuvable.' });
  res.json({ ok: true });
});

module.exports = router;
