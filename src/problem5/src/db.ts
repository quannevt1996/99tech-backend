import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import BetterSqlite3 from 'better-sqlite3';

export type Database = BetterSqlite3.Database;

const schema = `
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
    target_price REAL NOT NULL CHECK (target_price > 0),
    note TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS alerts_symbol_idx ON alerts (symbol);
`;

export const openDatabase = (path: string): Database => {
  mkdirSync(dirname(path), { recursive: true });

  const db = new BetterSqlite3(path);
  db.pragma('journal_mode = WAL');
  db.exec(schema);
  return db;
};
