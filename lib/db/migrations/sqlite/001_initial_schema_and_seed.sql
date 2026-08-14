-- Migration 001: Initial schema and seed data
-- Creates the flat models table and inserts all 11 base model rows.
-- Arrays (modalities, capabilities, strengths, weaknesses) are stored as
-- JSON strings. This keeps queries simple and avoids joins for a
-- read-only, small dataset.

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------

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
  latency_first_token_ms            REAL,
  latency_end_to_end_ms             REAL,
  latency_throughput_tokens_per_sec REAL
);

CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider);
CREATE INDEX IF NOT EXISTS idx_models_license  ON models(license);

-- ---------------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------------

INSERT INTO models (
  id, name, provider, family, release_date, context_window, license,
  last_verified, modalities, capabilities, strengths, weaknesses,
  pricing_input, pricing_output,
  benchmark_mmlu, benchmark_humaneval, benchmark_mt_bench,
  docs_url, paper_url,
  latency_first_token_ms, latency_end_to_end_ms, latency_throughput_tokens_per_sec
) VALUES
  (
    'claude-3-5-sonnet', 'Claude 3.5 Sonnet', 'anthropic', 'claude-3',
    '2024-06-20', 200000, 'proprietary', '2024-07-01',
    '["text","image"]',
    '["reasoning","vision","tool-use","structured-output","code"]',
    '["Best-in-class coding and reasoning","200K context window","Strong instruction following"]',
    '["Higher cost vs. smaller models (~$15/1M output tokens)","No audio modality","Occasional refusals on sensitive or edge-case requests","Context window smaller than Gemini 1.5 Pro"]',
    3.00, 15.00, 88.7, 92.0, NULL,
    'https://docs.anthropic.com/claude/docs', NULL,
    600, 1800, 75
  ),
  (
    'claude-3-haiku', 'Claude 3 Haiku', 'anthropic', 'claude-3',
    '2024-03-13', 200000, 'proprietary', '2024-07-01',
    '["text","image"]',
    '["vision","tool-use","structured-output"]',
    '["Fastest and most affordable Claude model","Good for high-throughput tasks"]',
    '["Less capable than Sonnet/Opus for complex reasoning","Lower benchmark scores than larger Claude models","May struggle with nuanced multi-step instructions","No audio modality"]',
    0.25, 1.25, 75.2, NULL, NULL,
    'https://docs.anthropic.com/claude/docs', NULL,
    250, 700, 180
  ),
  (
    'gemini-1-5-flash', 'Gemini 1.5 Flash', 'google', 'gemini-1.5',
    '2024-05-14', 1000000, 'proprietary', '2024-07-01',
    '["text","image","audio","video"]',
    '["reasoning","vision","tool-use","structured-output","long-context"]',
    '["1M token context window","Multimodal (text, image, audio, video)","Fast and cost-effective"]',
    '["Less capable than Pro on complex reasoning tasks","No published HumanEval score","Quality degrades on very long context inputs","Smaller ecosystem of third-party integrations vs. OpenAI"]',
    0.35, 1.05, 78.9, NULL, NULL,
    'https://ai.google.dev/gemini-api/docs', NULL,
    300, 900, 150
  ),
  (
    'gemini-1-5-pro', 'Gemini 1.5 Pro', 'google', 'gemini-1.5',
    '2024-02-15', 2000000, 'proprietary', '2024-07-01',
    '["text","image","audio","video"]',
    '["reasoning","vision","tool-use","structured-output","long-context","code"]',
    '["2M token context window — largest available","Strong multimodal reasoning"]',
    '["Higher latency on very long contexts (>500K tokens)","Cost scales significantly with context length","Lower HumanEval score than GPT-4o and Claude 3.5 Sonnet","Rate limits more restrictive than OpenAI at high volume"]',
    3.50, 10.50, 85.9, 71.9, NULL,
    'https://ai.google.dev/gemini-api/docs', NULL,
    800, 2500, 60
  ),
  (
    'llama-3-1-405b', 'Llama 3.1 405B', 'meta', 'llama-3',
    '2024-07-23', 128000, 'llama', '2024-07-23',
    '["text"]',
    '["reasoning","tool-use","structured-output","code"]',
    '["Open weights — fully self-hostable","Competitive with GPT-4 class models","Strong multilingual support"]',
    '["Requires significant compute to self-host (8×A100 minimum)","No vision modality","Inference latency depends heavily on hardware configuration","No managed pricing — infrastructure costs vary widely"]',
    NULL, NULL, 88.6, 89.0, NULL,
    'https://llama.meta.com/', 'https://arxiv.org/abs/2407.21783',
    NULL, NULL, NULL
  ),
  (
    'llama-3-1-70b', 'Llama 3.1 70B', 'meta', 'llama-3',
    '2024-07-23', 128000, 'llama', '2024-07-23',
    '["text"]',
    '["reasoning","tool-use","structured-output","code"]',
    '["Open weights — self-hostable on consumer hardware","Strong reasoning for its size"]',
    '["Less capable than 405B on complex tasks","No vision modality","Inference latency varies by hosting provider","No official managed API from Meta"]',
    NULL, NULL, 83.6, 80.5, NULL,
    'https://llama.meta.com/', 'https://arxiv.org/abs/2407.21783',
    NULL, NULL, NULL
  ),
  (
    'mistral-large-2', 'Mistral Large 2', 'mistral', 'mistral-large',
    '2024-07-24', 128000, 'mistral', '2024-07-24',
    '["text"]',
    '["reasoning","tool-use","structured-output","code"]',
    '["Strong coding performance","Multilingual (80+ languages)","Competitive pricing"]',
    '["No vision modality","Smaller ecosystem than OpenAI/Anthropic","No audio or video modality support","Less community tooling and third-party integrations"]',
    3.00, 9.00, 84.0, 92.0, NULL,
    'https://docs.mistral.ai/', NULL,
    450, 1300, 90
  ),
  (
    'mistral-nemo', 'Mistral NeMo', 'mistral', 'mistral-nemo',
    '2024-07-18', 128000, 'apache-2.0', '2024-07-18',
    '["text"]',
    '["reasoning","tool-use","code"]',
    '["12B parameters — efficient and fast","Apache 2.0 license","Good multilingual support"]',
    '["Less capable than larger models on complex reasoning","No vision modality","Lower MMLU score than most frontier models","No published HumanEval benchmark"]',
    0.30, 0.30, 68.0, NULL, NULL,
    'https://docs.mistral.ai/', NULL,
    200, 600, 200
  ),
  (
    'gpt-4o', 'GPT-4o', 'openai', 'gpt-4',
    '2024-05-13', 128000, 'proprietary', '2024-07-01',
    '["text","image","audio"]',
    '["reasoning","vision","tool-use","structured-output","code"]',
    '["Best-in-class multimodal reasoning","Native audio input/output","Strong tool-use and structured output"]',
    '["Higher cost vs. smaller models (~$15/1M output tokens)","Context window smaller than Gemini 1.5","Occasional refusals on edge-case requests","Hallucinations on obscure or highly specialized facts"]',
    5.00, 15.00, 88.7, 90.2, NULL,
    'https://platform.openai.com/docs', NULL,
    500, 1400, 80
  ),
  (
    'gpt-4o-mini', 'GPT-4o mini', 'openai', 'gpt-4',
    '2024-07-18', 128000, 'proprietary', '2024-07-18',
    '["text","image"]',
    '["reasoning","vision","tool-use","structured-output","code"]',
    '["Very low cost","Fast response times","Strong performance for its price"]',
    '["Less capable than GPT-4o on complex multi-step tasks","No audio modality","May produce lower-quality outputs on nuanced reasoning","Smaller context window than Claude 3.5 Sonnet or Gemini 1.5"]',
    0.15, 0.60, 82.0, 87.2, NULL,
    'https://platform.openai.com/docs', NULL,
    220, 650, 160
  ),
  (
    'o1-preview', 'o1-preview', 'openai', 'o1',
    '2024-09-12', 128000, 'proprietary', '2024-09-12',
    '["text"]',
    '["reasoning","code","structured-output"]',
    '["Exceptional multi-step reasoning","Strong math and science performance","Chain-of-thought built in"]',
    '["Very high cost (~$60/1M output tokens)","Significantly slower than GPT-4o due to internal reasoning steps","No vision or tool-use in preview release","No audio modality"]',
    15.00, 60.00, NULL, 92.4, NULL,
    'https://platform.openai.com/docs', NULL,
    3000, 12000, 25
  )
ON CONFLICT (id) DO NOTHING;
