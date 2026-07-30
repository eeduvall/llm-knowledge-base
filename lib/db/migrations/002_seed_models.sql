-- Migration 002: Seed model data from data/models.yaml
-- Idempotent: uses INSERT ... ON CONFLICT DO NOTHING

-- ── models ──────────────────────────────────────────────────────────────────
INSERT INTO models (id, name, provider, family, release_date, context_window, license, last_verified) VALUES
  ('claude-3-5-sonnet', 'Claude 3.5 Sonnet', 'anthropic', 'claude-3', '2024-06-20', 200000, 'proprietary', '2024-07-01'),
  ('claude-3-haiku',    'Claude 3 Haiku',    'anthropic', 'claude-3', '2024-03-13', 200000, 'proprietary', '2024-07-01'),
  ('gemini-1-5-flash',  'Gemini 1.5 Flash',  'google',    'gemini-1.5','2024-05-14',1000000,'proprietary', '2024-07-01'),
  ('gemini-1-5-pro',    'Gemini 1.5 Pro',    'google',    'gemini-1.5','2024-02-15',2000000,'proprietary', '2024-07-01'),
  ('llama-3-1-405b',    'Llama 3.1 405B',    'meta',      'llama-3',  '2024-07-23', 128000, 'llama',       '2024-07-23'),
  ('llama-3-1-70b',     'Llama 3.1 70B',     'meta',      'llama-3',  '2024-07-23', 128000, 'llama',       '2024-07-23'),
  ('mistral-large-2',   'Mistral Large 2',   'mistral',   'mistral-large','2024-07-24',128000,'mistral',   '2024-07-24'),
  ('mistral-nemo',      'Mistral NeMo',      'mistral',   'mistral-nemo','2024-07-18',128000,'apache-2.0', '2024-07-18'),
  ('gpt-4o',            'GPT-4o',            'openai',    'gpt-4',    '2024-05-13', 128000, 'proprietary', '2024-07-01'),
  ('gpt-4o-mini',       'GPT-4o mini',       'openai',    'gpt-4',    '2024-07-18', 128000, 'proprietary', '2024-07-18'),
  ('o1-preview',        'o1-preview',        'openai',    'o1',       '2024-09-12', 128000, 'proprietary', '2024-09-12')
ON CONFLICT (id) DO NOTHING;
