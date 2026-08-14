/**
 * scripts/migrate.ts — SQLite migration runner
 *
 * Applies versioned SQL migration files from lib/db/migrations/sqlite/ to
 * data/models.db in lexicographic order. Each migration is recorded in a
 * `schema_migrations` table so it is never applied twice.
 *
 * Usage:
 *   npm run db:migrate
 *   # expands to: ts-node --project tsconfig.scripts.json scripts/migrate.ts
 *
 * Adding a new migration:
 *   1. Create lib/db/migrations/sqlite/NNN_description.sql  (NNN = next number)
 *   2. Run `npm run db:migrate` — only the new file is applied.
 *
 * The runner is idempotent: running it again when all migrations are already
 * applied is a no-op (exits 0, prints "Nothing to migrate").
 *
 * To rebuild from scratch (e.g. in CI or after a destructive schema change):
 *   rm data/models.db && npm run db:migrate
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const DB_PATH = path.join(__dirname, '..', 'data', 'models.db');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'lib', 'db', 'migrations', 'sqlite');

// ---------------------------------------------------------------------------
// Open / create the database
// ---------------------------------------------------------------------------

const isNew = !fs.existsSync(DB_PATH);
const db = new Database(DB_PATH);
if (isNew) {
  console.log('🗄   Created', DB_PATH);
} else {
  console.log('🗄   Opened', DB_PATH);
}

// Enable WAL mode for better concurrent read performance.
db.pragma('journal_mode = WAL');

// ---------------------------------------------------------------------------
// Ensure the migrations tracking table exists
// ---------------------------------------------------------------------------

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version    TEXT    PRIMARY KEY,
    applied_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---------------------------------------------------------------------------
// Discover migration files
// ---------------------------------------------------------------------------

if (!fs.existsSync(MIGRATIONS_DIR)) {
  console.error('❌  Migrations directory not found:', MIGRATIONS_DIR);
  process.exit(1);
}

const migrationFiles = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort(); // lexicographic order — relies on NNN_ prefix convention

if (migrationFiles.length === 0) {
  console.log('⚠️   No migration files found in', MIGRATIONS_DIR);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Determine which migrations have already been applied
// ---------------------------------------------------------------------------

type MigrationRow = { version: string };
const applied = new Set(
  (db.prepare('SELECT version FROM schema_migrations').all() as MigrationRow[]).map(
    (r) => r.version,
  ),
);

// ---------------------------------------------------------------------------
// Apply pending migrations
// ---------------------------------------------------------------------------

const pending = migrationFiles.filter((f) => !applied.has(f));

if (pending.length === 0) {
  console.log(
    '✅  Nothing to migrate — all',
    migrationFiles.length,
    'migration(s) already applied',
  );
  db.close();
  process.exit(0);
}

console.log(`🔄  Applying ${pending.length} pending migration(s)…`);

const recordMigration = db.prepare(`INSERT INTO schema_migrations (version) VALUES (?)`);

for (const file of pending) {
  const filePath = path.join(MIGRATIONS_DIR, file);
  const sql = fs.readFileSync(filePath, 'utf8').trim();

  if (!sql) {
    console.log(`  ⏭   ${file} — empty, skipping`);
    continue;
  }

  // Each migration runs inside its own transaction so a failure leaves the
  // database in a consistent state and the version is not recorded.
  const applyMigration = db.transaction(() => {
    db.exec(sql);
    recordMigration.run(file);
  });

  try {
    applyMigration();
    console.log(`  ✅  ${file}`);
  } catch (err) {
    console.error(`  ❌  ${file} — FAILED`);
    console.error(err instanceof Error ? err.message : String(err));
    db.close();
    process.exit(1);
  }
}

console.log('\n🎉  Migration complete:', DB_PATH);
db.close();
