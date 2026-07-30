-- modalities
INSERT INTO model_modalities (model_id, modality) VALUES
  ('claude-3-5-sonnet','text'),('claude-3-5-sonnet','image'),
  ('claude-3-haiku','text'),('claude-3-haiku','image'),
  ('gemini-1-5-flash','text'),('gemini-1-5-flash','image'),('gemini-1-5-flash','audio'),('gemini-1-5-flash','video'),
  ('gemini-1-5-pro','text'),('gemini-1-5-pro','image'),('gemini-1-5-pro','audio'),('gemini-1-5-pro','video'),
  ('llama-3-1-405b','text'),('llama-3-1-70b','text'),
  ('mistral-large-2','text'),('mistral-nemo','text'),
  ('gpt-4o','text'),('gpt-4o','image'),('gpt-4o','audio'),
  ('gpt-4o-mini','text'),('gpt-4o-mini','image'),
  ('o1-preview','text')
ON CONFLICT DO NOTHING;

-- capabilities
INSERT INTO model_capabilities (model_id, capability) VALUES
  ('claude-3-5-sonnet','reasoning'),('claude-3-5-sonnet','vision'),('claude-3-5-sonnet','tool-use'),('claude-3-5-sonnet','structured-output'),('claude-3-5-sonnet','code'),
  ('claude-3-haiku','vision'),('claude-3-haiku','tool-use'),('claude-3-haiku','structured-output'),
  ('gemini-1-5-flash','reasoning'),('gemini-1-5-flash','vision'),('gemini-1-5-flash','tool-use'),('gemini-1-5-flash','structured-output'),('gemini-1-5-flash','long-context'),
  ('gemini-1-5-pro','reasoning'),('gemini-1-5-pro','vision'),('gemini-1-5-pro','tool-use'),('gemini-1-5-pro','structured-output'),('gemini-1-5-pro','long-context'),('gemini-1-5-pro','code'),
  ('llama-3-1-405b','reasoning'),('llama-3-1-405b','tool-use'),('llama-3-1-405b','structured-output'),('llama-3-1-405b','code'),
  ('llama-3-1-70b','reasoning'),('llama-3-1-70b','tool-use'),('llama-3-1-70b','structured-output'),('llama-3-1-70b','code'),
  ('mistral-large-2','reasoning'),('mistral-large-2','tool-use'),('mistral-large-2','structured-output'),('mistral-large-2','code'),
  ('mistral-nemo','reasoning'),('mistral-nemo','tool-use'),('mistral-nemo','code'),
  ('gpt-4o','reasoning'),('gpt-4o','vision'),('gpt-4o','tool-use'),('gpt-4o','structured-output'),('gpt-4o','code'),
  ('gpt-4o-mini','reasoning'),('gpt-4o-mini','vision'),('gpt-4o-mini','tool-use'),('gpt-4o-mini','structured-output'),('gpt-4o-mini','code'),
  ('o1-preview','reasoning'),('o1-preview','code'),('o1-preview','structured-output')
ON CONFLICT DO NOTHING;

-- pricing
INSERT INTO model_pricing (model_id, input_price, output_price) VALUES
  ('claude-3-5-sonnet', 3.00, 15.00),
  ('claude-3-haiku', 0.25, 1.25),
  ('gemini-1-5-flash', 0.35, 1.05),
  ('gemini-1-5-pro', 3.50, 10.50),
  ('llama-3-1-405b', NULL, NULL),
  ('llama-3-1-70b', NULL, NULL),
  ('mistral-large-2', 3.00, 9.00),
  ('mistral-nemo', 0.30, 0.30),
  ('gpt-4o', 5.00, 15.00),
  ('gpt-4o-mini', 0.15, 0.60),
  ('o1-preview', 15.00, 60.00)
ON CONFLICT (model_id) DO NOTHING;

-- benchmarks
INSERT INTO model_benchmarks (model_id, mmlu, humaneval, mt_bench) VALUES
  ('claude-3-5-sonnet', 88.7, 92.0, NULL),
  ('claude-3-haiku', 75.2, NULL, NULL),
  ('gemini-1-5-flash', 78.9, NULL, NULL),
  ('gemini-1-5-pro', 85.9, 71.9, NULL),
  ('llama-3-1-405b', 88.6, 89.0, NULL),
  ('llama-3-1-70b', 83.6, 80.5, NULL),
  ('mistral-large-2', 84.0, 92.0, NULL),
  ('mistral-nemo', 68.0, NULL, NULL),
  ('gpt-4o', 88.7, 90.2, NULL),
  ('gpt-4o-mini', 82.0, 87.2, NULL),
  ('o1-preview', NULL, 92.4, NULL)
ON CONFLICT (model_id) DO NOTHING;

-- links
INSERT INTO model_links (model_id, docs_url, paper_url) VALUES
  ('claude-3-5-sonnet','https://docs.anthropic.com/claude/docs',NULL),
  ('claude-3-haiku','https://docs.anthropic.com/claude/docs',NULL),
  ('gemini-1-5-flash','https://ai.google.dev/gemini-api/docs',NULL),
  ('gemini-1-5-pro','https://ai.google.dev/gemini-api/docs',NULL),
  ('llama-3-1-405b','https://llama.meta.com/','https://arxiv.org/abs/2407.21783'),
  ('llama-3-1-70b','https://llama.meta.com/','https://arxiv.org/abs/2407.21783'),
  ('mistral-large-2','https://docs.mistral.ai/',NULL),
  ('mistral-nemo','https://docs.mistral.ai/',NULL),
  ('gpt-4o','https://platform.openai.com/docs',NULL),
  ('gpt-4o-mini','https://platform.openai.com/docs',NULL),
  ('o1-preview','https://platform.openai.com/docs',NULL)
ON CONFLICT (model_id) DO NOTHING;

-- strengths
INSERT INTO model_strengths (model_id, strength, sort_order) VALUES
  ('claude-3-5-sonnet','Best-in-class coding and reasoning',0),
  ('claude-3-5-sonnet','200K context window',1),
  ('claude-3-5-sonnet','Strong instruction following',2),
  ('claude-3-haiku','Fastest and most affordable Claude model',0),
  ('claude-3-haiku','Good for high-throughput tasks',1),
  ('gemini-1-5-flash','1M token context window',0),
  ('gemini-1-5-flash','Multimodal (text, image, audio, video)',1),
  ('gemini-1-5-flash','Fast and cost-effective',2),
  ('gemini-1-5-pro','2M token context window — largest available',0),
  ('gemini-1-5-pro','Strong multimodal reasoning',1),
  ('llama-3-1-405b','Open weights — fully self-hostable',0),
  ('llama-3-1-405b','Competitive with GPT-4 class models',1),
  ('llama-3-1-405b','Strong multilingual support',2),
  ('llama-3-1-70b','Open weights — self-hostable on consumer hardware',0),
  ('llama-3-1-70b','Strong reasoning for its size',1),
  ('mistral-large-2','Strong coding performance',0),
  ('mistral-large-2','Multilingual (80+ languages)',1),
  ('mistral-large-2','Competitive pricing',2),
  ('mistral-nemo','12B parameters — efficient and fast',0),
  ('mistral-nemo','Apache 2.0 license',1),
  ('mistral-nemo','Good multilingual support',2),
  ('gpt-4o','Best-in-class multimodal reasoning',0),
  ('gpt-4o','Native audio input/output',1),
  ('gpt-4o','Strong tool-use and structured output',2),
  ('gpt-4o-mini','Very low cost',0),
  ('gpt-4o-mini','Fast response times',1),
  ('gpt-4o-mini','Strong performance for its price',2),
  ('o1-preview','Exceptional multi-step reasoning',0),
  ('o1-preview','Strong math and science performance',1),
  ('o1-preview','Chain-of-thought built in',2)
ON CONFLICT DO NOTHING;

-- weaknesses
INSERT INTO model_weaknesses (model_id, weakness, sort_order) VALUES
  ('claude-3-5-sonnet','Higher cost vs. smaller models',0),
  ('claude-3-5-sonnet','No audio modality',1),
  ('claude-3-haiku','Less capable than Sonnet/Opus for complex reasoning',0),
  ('gemini-1-5-flash','Less capable than Pro on complex tasks',0),
  ('gemini-1-5-pro','Higher latency on very long contexts',0),
  ('gemini-1-5-pro','Cost scales with context length',1),
  ('llama-3-1-405b','Requires significant compute to self-host',0),
  ('llama-3-1-405b','No vision modality',1),
  ('llama-3-1-70b','Less capable than 405B on complex tasks',0),
  ('llama-3-1-70b','No vision modality',1),
  ('mistral-large-2','No vision modality',0),
  ('mistral-large-2','Smaller ecosystem than OpenAI/Anthropic',1),
  ('mistral-nemo','Less capable than larger models',0),
  ('mistral-nemo','No vision modality',1),
  ('gpt-4o','Higher cost vs. smaller models',0),
  ('gpt-4o','Context window smaller than Gemini 1.5',1),
  ('gpt-4o-mini','Less capable than GPT-4o on complex tasks',0),
  ('gpt-4o-mini','No audio modality',1),
  ('o1-preview','Very high cost',0),
  ('o1-preview','Slower than GPT-4o',1),
  ('o1-preview','No vision or tool-use in preview',2)
ON CONFLICT DO NOTHING;
