/**
 * scripts/migrate.ts  (repurposed as the YAML → SQLite build script)
 *
 * Reads data/models.yaml and writes a flat SQLite database at data/models.db.
 * The database is the runtime data store; the YAML file remains the
 * human-editable source of truth.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/migrate.ts
 *   # or via npm:
 *   npm run db:migrate
 *
 * The script is idempotent — running it again rebuilds the database from
 * scratch (DROP + CREATE + INSERT).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import Database from 'better-sqlite3';
import type { Model } from '../lib/models';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const YAML_PATH = path.join(__dirname, '..', 'data', 'models.yaml');
const DB_PATH = path.join(__dirname, '..', 'data', 'models.db');

// ---------------------------------------------------------------------------
// Load & validate YAML
// ---------------------------------------------------------------------------

console.log('📖  Reading', YAML_PATH);
const raw = fs.readFileSync(YAML_PATH, 'utf8');
const models = yaml.load(raw) as Model[];

if (!Array.isArray(models) || models.length === 0) {
  console.error('❌  models.yaml is empty or not an array');
  process.exit(1);
}

console.log(`✅  Loaded ${models.length} models from YAML`);

// ---------------------------------------------------------------------------
// Open / create SQLite database
// ---------------------------------------------------------------------------

// Remove existing DB so the script is fully idempotent
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('🗑   Removed existing', DB_PATH);
}

const db = new Database(DB_PATH);
console.log('🗄   Created', DB_PATH);

// ---------------------------------------------------------------------------
// Schema
// Flat single-table design: arrays are stored as JSON strings.
// This keeps queries simple and avoids joins for a read-only, small dataset.
// ---------------------------------------------------------------------------

db.exec(`
  CREATE TABLE IF NOT EXISTS models (
    id               TEXT    PRIMARY KEY,
    name             TEXT    NOT NULL,
    provider         TEXT    NOT NULL,
    family           TEXT    NOT NULL,
    release_date     TEXT    NOT NULL,
    context_window   INTEGER NOT NULL,
    license          TEXT    NOT NULL,
    last_verified    TEXT,
    modalities       TEXT    NOT NULL DEFAULT '[]',
    capabilities     TEXT    NOT NULL DEFAULT '[]',
    strengths        TEXT    NOT NULL DEFAULT '[]',
    weaknesses       TEXT    NOT NULL DEFAULT '[]',
    pricing_input    REAL,
    pricing_output   REAL,
    benchmark_mmlu      REAL,
    benchmark_humaneval REAL,
    benchmark_mt_bench  REAL,
    docs_url         TEXT,
    paper_url        TEXT,
    latency_first_token_ms          REAL,
    latency_end_to_end_ms           REAL,
    latency_throughput_tokens_per_sec REAL
  );

  CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider);
  CREATE INDEX IF NOT EXISTS idx_models_license  ON models(license);
`);

// ---------------------------------------------------------------------------
// Insert rows
// ---------------------------------------------------------------------------

const insert = db.prepare(`
  INSERT INTO models (
    id, name, provider, family, release_date, context_window, license,
    last_verified, modalities, capabilities, strengths, weaknesses,
    pricing_input, pricing_output,
    benchmark_mmlu, benchmark_humaneval, benchmark_mt_bench,
    docs_url, paper_url,
    latency_first_token_ms, latency_end_to_end_ms, latency_throughput_tokens_per_sec
  ) VALUES (
    @id, @name, @provider, @family, @release_date, @context_window, @license,
    @last_verified, @modalities, @capabilities, @strengths, @weaknesses,
    @pricing_input, @pricing_output,
    @benchmark_mmlu, @benchmark_humaneval, @benchmark_mt_bench,
    @docs_url, @paper_url,
    @latency_first_token_ms, @latency_end_to_end_ms, @latency_throughput_tokens_per_sec
  )
`);

const insertAll = db.transaction((rows: Model[]) => {
  for (const m of rows) {
    insert.run({
      id: m.id,
      name: m.name,
      provider: m.provider,
      family: m.family,
      release_date: m.release_date,
      context_window: m.context_window,
      license: m.license,
      last_verified: m.last_verified ?? null,
      modalities: JSON.stringify(m.modalities ?? []),
      capabilities: JSON.stringify(m.capabilities ?? []),
      strengths: JSON.stringify(m.strengths ?? []),
      weaknesses: JSON.stringify(m.weaknesses ?? []),
      pricing_input: m.pricing?.input ?? null,
      pricing_output: m.pricing?.output ?? null,
      benchmark_mmlu: m.benchmarks?.mmlu ?? null,
      benchmark_humaneval: m.benchmarks?.humaneval ?? null,
      benchmark_mt_bench: m.benchmarks?.mt_bench ?? null,
      docs_url: m.links?.docs ?? null,
      paper_url: m.links?.paper ?? null,
      latency_first_token_ms: m.latency?.first_token_ms ?? null,
      latency_end_to_end_ms: m.latency?.end_to_end_ms ?? null,
      latency_throughput_tokens_per_sec: m.latency?.throughput_tokens_per_sec ?? null,
    });
  }
});

insertAll(models);

console.log(`✅  Inserted ${models.length} rows into models table`);
console.log('\n🎉  Database build complete:', DB_PATH);

db.close();
