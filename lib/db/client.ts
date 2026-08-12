// SQLite client — server-only.
// Do NOT import this file in client components or pages that run in the browser.
// The database file path is resolved relative to the project root.

import Database from 'better-sqlite3';
import path from 'path';

// Lazily-initialised singleton — the client is created on first use so that
// the module can be imported during the Next.js build without throwing when
// the database file does not yet exist (it is created by scripts/build-db.ts).
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dbPath = process.env.SQLITE_DB_PATH ?? path.join(process.cwd(), 'data', 'models.db');
  _db = new Database(dbPath, { readonly: true });
  return _db;
}
