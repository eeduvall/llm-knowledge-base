-- Migration 001: Create models table and supporting structures
-- Run this against your PostgreSQL / Supabase database.

-- ---------------------------------------------------------------------------
-- models
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS models (
  id               TEXT        PRIMARY KEY,          -- kebab-case, immutable
  name             TEXT        NOT NULL,
  provider         TEXT        NOT NULL,
  family           TEXT        NOT NULL,
  release_date     DATE        NOT NULL,
  context_window   INTEGER     NOT NULL,
  license          TEXT        NOT NULL,
  last_verified    DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- model_modalities  (normalised many-to-many)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_modalities (
  model_id  TEXT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  modality  TEXT NOT NULL,
  PRIMARY KEY (model_id, modality)
);

-- ---------------------------------------------------------------------------
-- model_capabilities  (normalised many-to-many)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_capabilities (
  model_id   TEXT NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  capability TEXT NOT NULL,
  PRIMARY KEY (model_id, capability)
);

-- ---------------------------------------------------------------------------
-- model_pricing  (one-to-one, nullable fields)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_pricing (
  model_id      TEXT    PRIMARY KEY REFERENCES models(id) ON DELETE CASCADE,
  input_price   NUMERIC(10, 4),   -- USD per 1M tokens, null = unknown
  output_price  NUMERIC(10, 4)
);

-- ---------------------------------------------------------------------------
-- model_benchmarks  (one-to-one, nullable fields)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_benchmarks (
  model_id   TEXT    PRIMARY KEY REFERENCES models(id) ON DELETE CASCADE,
  mmlu       NUMERIC(5, 2),
  humaneval  NUMERIC(5, 2),
  mt_bench   NUMERIC(5, 2)
);

-- ---------------------------------------------------------------------------
-- model_strengths  (ordered list)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_strengths (
  id        SERIAL  PRIMARY KEY,
  model_id  TEXT    NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  strength  TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- model_weaknesses  (ordered list)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_weaknesses (
  id        SERIAL  PRIMARY KEY,
  model_id  TEXT    NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  weakness  TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- model_links  (one-to-one)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS model_links (
  model_id   TEXT    PRIMARY KEY REFERENCES models(id) ON DELETE CASCADE,
  docs_url   TEXT,
  paper_url  TEXT
);

-- ---------------------------------------------------------------------------
-- Indexes for common query patterns
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_models_provider  ON models(provider);
CREATE INDEX IF NOT EXISTS idx_models_family    ON models(family);
CREATE INDEX IF NOT EXISTS idx_models_license   ON models(license);
CREATE INDEX IF NOT EXISTS idx_model_modalities_model_id    ON model_modalities(model_id);
CREATE INDEX IF NOT EXISTS idx_model_capabilities_model_id  ON model_capabilities(model_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_models_updated_at ON models;
CREATE TRIGGER trg_models_updated_at
  BEFORE UPDATE ON models
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
