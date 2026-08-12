// SQLite row type — mirrors the flat schema created by scripts/migrate.ts.
// These are raw DB shapes; the app-facing Model type lives in lib/models.ts.
// Arrays (modalities, capabilities, strengths, weaknesses) are stored as
// JSON strings and parsed in lib/db/models.ts before being returned.

export type DbModelRow = {
  id: string;
  name: string;
  provider: string;
  family: string;
  release_date: string;
  context_window: number;
  license: string;
  last_verified: string | null;
  // JSON-encoded arrays
  modalities: string;
  capabilities: string;
  strengths: string;
  weaknesses: string;
  // Pricing (nullable)
  pricing_input: number | null;
  pricing_output: number | null;
  // Benchmarks (nullable)
  benchmark_mmlu: number | null;
  benchmark_humaneval: number | null;
  benchmark_mt_bench: number | null;
  // Links (nullable)
  docs_url: string | null;
  paper_url: string | null;
};
