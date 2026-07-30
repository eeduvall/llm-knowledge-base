// Database query helpers — server-only.
// All functions return the shared Model type from lib/models.ts so the rest
// of the app never has to know about the DB row shape.
// Do NOT import this file in client components.

import { supabase } from './client'
import type { Model, Modality, Capability } from '../models'

// ---------------------------------------------------------------------------
// Internal: assemble a Model from the normalised DB rows
// ---------------------------------------------------------------------------

type RawModelRow = {
  id: string
  name: string
  provider: string
  family: string
  release_date: string
  context_window: number
  license: string
  last_verified: string | null
  model_modalities: { modality: string }[]
  model_capabilities: { capability: string }[]
  model_pricing: { input_price: number | null; output_price: number | null }[]
  model_benchmarks: { mmlu: number | null; humaneval: number | null; mt_bench: number | null }[]
  model_strengths: { strength: string; sort_order: number }[]
  model_weaknesses: { weakness: string; sort_order: number }[]
  model_links: { docs_url: string | null; paper_url: string | null }[]
}

function rowToModel(row: RawModelRow): Model {
  const pricing = row.model_pricing[0] ?? { input_price: null, output_price: null }
  const benchmarks = row.model_benchmarks[0] ?? { mmlu: null, humaneval: null, mt_bench: null }
  const links = row.model_links[0] ?? { docs_url: null, paper_url: null }

  return {
    id: row.id,
    name: row.name,
    provider: row.provider,
    family: row.family,
    release_date: row.release_date,
    context_window: row.context_window,
    license: row.license,
    last_verified: row.last_verified ?? undefined,
    modalities: row.model_modalities.map((m) => m.modality as Modality),
    capabilities: row.model_capabilities.map((c) => c.capability as Capability),
    pricing: {
      input: pricing.input_price,
      output: pricing.output_price,
    },
    benchmarks: {
      mmlu: benchmarks.mmlu,
      humaneval: benchmarks.humaneval,
      mt_bench: benchmarks.mt_bench,
    },
    strengths: row.model_strengths
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => s.strength),
    weaknesses: row.model_weaknesses
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((w) => w.weakness),
    links: {
      docs: links.docs_url,
      paper: links.paper_url,
    },
  }
}

// The Supabase select string used by every query — joins all related tables.
const MODEL_SELECT = `
  id,
  name,
  provider,
  family,
  release_date,
  context_window,
  license,
  last_verified,
  model_modalities ( modality ),
  model_capabilities ( capability ),
  model_pricing ( input_price, output_price ),
  model_benchmarks ( mmlu, humaneval, mt_bench ),
  model_strengths ( strength, sort_order ),
  model_weaknesses ( weakness, sort_order ),
  model_links ( docs_url, paper_url )
`.trim()

// ---------------------------------------------------------------------------
// Public query functions
// ---------------------------------------------------------------------------

/** Return all models, ordered by provider then id. */
export async function getAllModels(): Promise<Model[]> {
  const { data, error } = await supabase
    .from('models')
    .select(MODEL_SELECT)
    .order('provider')
    .order('id')

  if (error) throw new Error(`getAllModels: ${error.message}`)
  return (data as unknown as RawModelRow[]).map(rowToModel)
}

/** Return a single model by its stable id, or null if not found. */
export async function getModelById(id: string): Promise<Model | null> {
  const { data, error } = await supabase
    .from('models')
    .select(MODEL_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(`getModelById(${id}): ${error.message}`)
  if (!data) return null
  return rowToModel(data as unknown as RawModelRow)
}

/** Return all models from a given provider slug (e.g. 'openai'). */
export async function getModelsByProvider(provider: string): Promise<Model[]> {
  const { data, error } = await supabase
    .from('models')
    .select(MODEL_SELECT)
    .eq('provider', provider)
    .order('id')

  if (error) throw new Error(`getModelsByProvider(${provider}): ${error.message}`)
  return (data as unknown as RawModelRow[]).map(rowToModel)
}

/** Return all models that have a given capability tag. */
export async function getModelsByCapability(capability: string): Promise<Model[]> {
  // Filter via the join table: select models whose id appears in model_capabilities
  const { data: capRows, error: capError } = await supabase
    .from('model_capabilities')
    .select('model_id')
    .eq('capability', capability)

  if (capError) throw new Error(`getModelsByCapability(${capability}): ${capError.message}`)

  const ids = (capRows ?? []).map((r: { model_id: string }) => r.model_id)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('models')
    .select(MODEL_SELECT)
    .in('id', ids)
    .order('provider')
    .order('id')

  if (error) throw new Error(`getModelsByCapability(${capability}): ${error.message}`)
  return (data as unknown as RawModelRow[]).map(rowToModel)
}
