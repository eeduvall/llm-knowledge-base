// Database query helpers — server-only.
// All functions return the shared Model type from lib/models.ts so the rest
// of the app never has to know about the DB row shape.
// Do NOT import this file in client components.

import { getDb } from './client';
import type { DbModelRow } from './schema';
import type { Model, Modality, Capability } from '../models';

// ---------------------------------------------------------------------------
// Internal: assemble a Model from a flat SQLite row
// ---------------------------------------------------------------------------

function rowToModel(row: DbModelRow): Model {
  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    family: row.family,
    release_date: row.release_date,
    context_window: row.context_window,
    license: row.license,
    last_verified: row.last_verified ?? undefined,
    modalities: JSON.parse(row.modalities) as Modality[],
    capabilities: JSON.parse(row.capabilities) as Capability[],
    pricing: {
      input: row.pricing_input,
      output: row.pricing_output,
    },
    benchmarks: {
      mmlu: row.benchmark_mmlu,
      humaneval: row.benchmark_humaneval,
      mt_bench: row.benchmark_mt_bench,
    },
    strengths: JSON.parse(row.strengths) as string[],
    weaknesses: JSON.parse(row.weaknesses) as string[],
    links: {
      docs: row.docs_url,
      paper: row.paper_url,
    },
    latency: {
      first_token_ms: row.latency_first_token_ms,
      end_to_end_ms: row.latency_end_to_end_ms,
      throughput_tokens_per_sec: row.latency_throughput_tokens_per_sec,
    },
  };
}

// ---------------------------------------------------------------------------
// Public query functions
// ---------------------------------------------------------------------------

/** Return all models, ordered by provider then id. */
export function getAllModels(): Model[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM models ORDER BY provider, id').all() as DbModelRow[];
  return rows.map(rowToModel);
}

/** Return a single model by its stable id, or null if not found. */
export function getModelById(id: string): Model | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as DbModelRow | undefined;
  return row ? rowToModel(row) : null;
}

/** Return all models from a given provider slug (e.g. 'openai'). */
export function getModelsByProvider(provider: string): Model[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM models WHERE provider = ? ORDER BY id')
    .all(provider) as DbModelRow[];
  return rows.map(rowToModel);
}

/** Return all models that have a given capability tag. */
export function getModelsByCapability(capability: string): Model[] {
  // capabilities is stored as a JSON array; use json_each to filter
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT m.* FROM models m, json_each(m.capabilities) c
       WHERE c.value = ?
       ORDER BY m.provider, m.id`,
    )
    .all(capability) as DbModelRow[];
  return rows.map(rowToModel);
}

/** Return all models that support a given modality (e.g. 'image', 'audio'). */
export function getModelsByModality(modality: string): Model[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT m.* FROM models m, json_each(m.modalities) mod
       WHERE mod.value = ?
       ORDER BY m.provider, m.id`,
    )
    .all(modality) as DbModelRow[];
  return rows.map(rowToModel);
}

/** Return all models matching a list of IDs (preserves requested order). */
export function getModelsByIds(ids: string[]): Model[] {
  if (ids.length === 0) return [];
  const db = getDb();
  const placeholders = ids.map(() => '?').join(', ');
  const rows = db
    .prepare(`SELECT * FROM models WHERE id IN (${placeholders})`)
    .all(...ids) as DbModelRow[];
  // Preserve the caller's requested order
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [rowToModel(row)] : [];
  });
}
