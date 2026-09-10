function genId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function requireAdmin(req, res, next) {
  const key = req.header('x-admin-key');
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Non autorisé — clé admin manquante ou invalide.' });
  }
  next();
}

module.exports = { genId, requireAdmin };
