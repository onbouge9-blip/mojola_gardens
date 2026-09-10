const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'mojola.db'));
db.pragma('journal_mode = WAL');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'nouveau',
      nom TEXT,
      tel TEXT,
      email TEXT,
      personnes TEXT,
      date TEXT,
      heure TEXT,
      occasion TEXT,
      zone TEXT,
      message TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'nouveau',
      nom TEXT,
      tel TEXT,
      mode TEXT,
      date TEXT,
      heure TEXT,
      adresse TEXT,
      notes TEXT,
      total INTEGER DEFAULT 0,
      lines_json TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'nouveau',
      nom TEXT,
      tel TEXT,
      sujet TEXT,
      message TEXT
    );

    CREATE TABLE IF NOT EXISTS stock (
      name TEXT PRIMARY KEY,
      available INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_reservations_created ON reservations(created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
  `);
}

module.exports = { db, initDB };
