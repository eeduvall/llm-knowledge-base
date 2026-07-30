// Database row types — mirror the PostgreSQL schema in lib/db/migrations/001_create_models.sql
// These are raw DB shapes; the app-facing Model type lives in lib/models.ts.

export type DbModel = {
  id: string
  name: string
  provider: string
  family: string
  release_date: string
  context_window: number
  license: string
  last_verified: string | null
  created_at: string
  updated_at: string
}

export type DbModelModality = {
  model_id: string
  modality: string
}

export type DbModelCapability = {
  model_id: string
  capability: string
}

export type DbModelPricing = {
  model_id: string
  input_price: number | null
  output_price: number | null
}

export type DbModelBenchmarks = {
  model_id: string
  mmlu: number | null
  humaneval: number | null
  mt_bench: number | null
}

export type DbModelStrength = {
  id: number
  model_id: string
  strength: string
  sort_order: number
}

export type DbModelWeakness = {
  id: number
  model_id: string
  weakness: string
  sort_order: number
}

export type DbModelLinks = {
  model_id: string
  docs_url: string | null
  paper_url: string | null
}
