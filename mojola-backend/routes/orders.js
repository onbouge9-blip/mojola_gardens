const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { genId, requireAdmin } = require('../middleware/auth');

// POST /api/orders — public, called from commande.html
router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.nom || !b.tel || !Array.isArray(b.lines) || b.lines.length === 0) {
    return res.status(400).json({ error: 'Nom, téléphone et au moins un produit sont requis.' });
  }
  const id = genId();
  const created_at = new Date().toISOString();

  db.prepare(`
    INSERT INTO orders (id, created_at, status, nom, tel, mode, date, heure, adresse, notes, total, lines_json)
    VALUES (@id, @created_at, 'nouveau', @nom, @tel, @mode, @date, @heure, @adresse, @notes, @total, @lines_json)
  `).run({
    id, created_at,
    nom: b.nom || '',
    tel: b.tel || '',
    mode: b.mode || '',
    date: b.date || '',
    heure: b.heure || '',
    adresse: b.adresse || '',
    notes: b.notes || '',
    total: Number(b.total) || 0,
    lines_json: JSON.stringify(b.lines || [])
  });

  res.status(201).json({ id, created_at, status: 'nouveau' });
});

// GET /api/orders — admin only
router.get('/', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
    .map(r => ({ ...r, lines: JSON.parse(r.lines_json || '[]') }));
  res.json(rows);
});

// PATCH /api/orders/:id — admin only, update status
router.patch('/:id', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'Le champ status est requis.' });
  const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Commande introuvable.' });
  res.json({ ok: true });
});

module.exports = router;
