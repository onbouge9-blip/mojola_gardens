const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { genId, requireAdmin } = require('../middleware/auth');

// POST /api/reservations — public, called from reservation.html
router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.nom || !b.tel) {
    return res.status(400).json({ error: 'Nom et téléphone sont requis.' });
  }
  const id = genId();
  const created_at = new Date().toISOString();

  db.prepare(`
    INSERT INTO reservations (id, created_at, status, nom, tel, email, personnes, date, heure, occasion, zone, message)
    VALUES (@id, @created_at, 'nouveau', @nom, @tel, @email, @personnes, @date, @heure, @occasion, @zone, @message)
  `).run({
    id, created_at,
    nom: b.nom || '',
    tel: b.tel || '',
    email: b.email || '',
    personnes: b.personnes || '',
    date: b.date || '',
    heure: b.heure || '',
    occasion: b.occasion || '',
    zone: b.zone || '',
    message: b.message || ''
  });

  res.status(201).json({ id, created_at, status: 'nouveau' });
});

// GET /api/reservations — admin only
router.get('/', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM reservations ORDER BY created_at DESC').all();
  res.json(rows);
});

// PATCH /api/reservations/:id — admin only, update status
router.patch('/:id', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'Le champ status est requis.' });
  const result = db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Réservation introuvable.' });
  res.json({ ok: true });
});

module.exports = router;
