require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

const app = express();

// ---------- CORS ----------
const allowed = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
app.use(cors({
  origin: allowed.includes('*') ? true : allowed
}));

app.use(express.json());

// ---------- database ----------
initDB();

// ---------- routes ----------
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'mojola-backend' }));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/stock', require('./routes/stock'));

// ---------- 404 + error handling ----------
app.use('/api', (req, res) => res.status(404).json({ error: 'Route inconnue.' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mojola backend démarré sur http://localhost:${PORT}`);
});
