# 🧠 LLM Knowledge Base

> **Navigate the ever-expanding universe of Large Language Models — visually, intelligently, and effortlessly.**

---

## Table of Contents

- [Overview](#overview)
- [Core Flows](#core-flows)
  - [🕸️ Knowledge Graph Explorer](#️-knowledge-graph-explorer)
  - [🧭 Q\&A Picker Flow](#-qa-picker-flow)
- [Visual Design Direction](#visual-design-direction)
- [Suggested Tech Stack](#suggested-tech-stack)
- [Architecture at a Glance](#architecture-at-a-glance)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Choosing the right LLM for your application is increasingly difficult. With dozens of frontier models, hundreds of fine-tunes, and a landscape that shifts weekly, developers and product teams waste hours comparing benchmarks, pricing tiers, context windows, and capability trade-offs.

**LLM Knowledge Base** solves this with two complementary experiences:

| Experience | Best for |
|---|---|
| 🕸️ **Knowledge Graph Explorer** | Visual thinkers who want to explore the LLM landscape holistically |
| 🧭 **Q&A Picker Flow** | Goal-oriented builders who know what they're building and want a fast recommendation |

Both flows draw from the same curated, continuously-updated knowledge base of LLM metadata — capabilities, benchmarks, pricing, context windows, modalities, licensing, and more.

---

## Core Flows

### 🕸️ Knowledge Graph Explorer

A living, breathing neural map of the LLM ecosystem.

- **Nodes** represent individual models (e.g., GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, Llama 3, Mistral, Phi-3, …).
- **Edges** encode similarity — models that share architecture lineage, benchmark profiles, use-case fit, or pricing tier are drawn closer together.
- **Clusters** emerge organically: reasoning powerhouses, lightweight edge models, code specialists, multimodal giants, open-weight champions, and more.
- **Hover / click** a node to surface a rich detail panel: specs, strengths, weaknesses, pricing, and direct links to provider docs.
- **Filter controls** let you dim irrelevant clusters and highlight only the models that match a chosen dimension (e.g., "open-weight only", "< $1 / 1M tokens", "supports vision").

#### Interaction model

```
Idle state      → fog-shrouded galaxy of softly pulsing nodes
Hover a node    → node brightens, connected edges light up like synaptic firing
Click a node    → detail panel slides in, related cluster floats forward
Apply a filter  → non-matching nodes fade into the fog; matching nodes intensify
```

---

### 🧭 Q&A Picker Flow

A guided, conversational decision tree that narrows the field from 100+ models to the **one best fit** for your specific use case.

#### Flow stages

```
Stage 1 — App Category
  "What are you building?"
  → Chatbot / Assistant
  → Code generation tool
  → Document analysis / RAG pipeline
  → Image / multimodal app
  → Autonomous agent / tool-use
  → Other (free text)

Stage 2 — Scale & Budget
  "What's your expected monthly token volume?"
  "Do you have a hard cost ceiling per 1M tokens?"

Stage 3 — Constraints
  "Do you need the model to run on-premise or fully open-weight?"
  "What's your required context window?"
  "Do you need fine-tuning support?"

Stage 4 — Quality Bar
  "How critical is factual accuracy / low hallucination rate?"
  "Do you need structured output (JSON mode, function calling)?"
  "Latency sensitivity: real-time streaming vs. batch?"

Stage 5 — Recommendation
  → Top 1–3 ranked models with a plain-English rationale
  → Side-by-side comparison table
  → "Show me on the graph" button → jumps to Knowledge Graph with results highlighted
```

Each answer progressively filters and re-ranks the knowledge base. The final recommendation card links directly to the provider's API docs, pricing page, and playground.

---

## Visual Design Direction

The aesthetic goal is **"neurons firing in a living brain"** — organic, dynamic, and awe-inspiring without sacrificing usability.

### Knowledge Graph canvas

| Element | Treatment |
|---|---|
| **Background** | Deep space black (`#050510`) with a subtle radial gradient suggesting depth |
| **Fog / atmosphere** | Layered volumetric fog using animated shader noise (Perlin / Simplex) — denser at the periphery, clearing toward the active cluster |
| **Nodes** | Glowing spheres with a soft bloom halo; color-coded by cluster (e.g., amber for reasoning, cyan for code, violet for multimodal) |
| **Edges** | Semi-transparent bezier curves with a traveling light-pulse animation — mimicking an action potential propagating along an axon |
| **Particle field** | Sparse floating micro-particles in the fog layer to reinforce the neural tissue feel |
| **Active state** | Selected node emits a radial pulse wave; connected nodes briefly flare |
| **Typography** | Clean sans-serif (Inter or Geist) floating as billboard labels above nodes; fade in on hover |

### Q&A Picker UI

| Element | Treatment |
|---|---|
| **Layout** | Full-bleed dark panel with a frosted-glass card for each question stage |
| **Progress** | Animated arc / progress ring showing how far through the funnel the user is |
| **Transitions** | Smooth slide + fade between stages; selected answers "lock in" with a satisfying micro-animation |
| **Recommendation card** | Gradient border glow matching the winning model's cluster color; confetti-lite particle burst on reveal |

---

## Suggested Tech Stack

### Frontend

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | [Next.js 14+](https://nextjs.org/) (App Router) | File-based routing, RSC for fast initial loads, excellent ecosystem |
| **Language** | TypeScript | Type safety across the full stack |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | Utility-first speed with polished, accessible components |
| **3D / Graph rendering** | [Three.js](https://threejs.org/) via [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [Drei](https://github.com/pmndrs/drei) | Declarative 3D in React; Drei provides fog, bloom, and post-processing helpers out of the box |
| **Graph layout** | [3d-force-graph](https://github.com/vasturiano/3d-force-graph) or custom force simulation via [d3-force-3d](https://github.com/vasturiano/d3-force-3d) | Physics-based clustering that naturally groups similar nodes |
| **Post-processing / shaders** | [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing) (Bloom, DepthOfField, Noise) | Achieves the fog + glow aesthetic with minimal custom GLSL |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) | UI transitions, Q&A stage animations, recommendation reveal |
| **State management** | [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight; perfect for graph filter state and picker flow progress |

### Backend / Data

| Layer | Choice | Rationale |
|---|---|---|
| **API routes** | Next.js Route Handlers (or [tRPC](https://trpc.io/)) | Co-located with the frontend; tRPC gives end-to-end type safety |
| **Database** | [PostgreSQL](https://www.postgresql.org/) via [Supabase](https://supabase.com/) | Managed Postgres with a generous free tier; real-time subscriptions for live data updates |
| **Graph / similarity data** | [pgvector](https://github.com/pgvector/pgvector) extension | Store LLM capability embeddings; cosine similarity queries drive edge weights in the graph |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) | Lightweight, type-safe, pairs perfectly with Next.js edge runtime |
| **LLM metadata pipeline** | Python scripts (scheduled via [GitHub Actions](https://github.com/features/actions) or [Inngest](https://www.inngest.com/)) | Scrape / ingest benchmark data, pricing updates, and new model releases |

### Infrastructure & DX

| Layer | Choice | Rationale |
|---|---|---|
| **Hosting** | [Vercel](https://vercel.com/) | Zero-config Next.js deployment, edge network, preview URLs per PR |
| **Auth** | [Clerk](https://clerk.com/) or [NextAuth.js](https://next-auth.js.org/) | Optional — for saving user preferences and recommendation history |
| **Analytics** | [PostHog](https://posthog.com/) | Open-source product analytics; track which models users explore most |
| **CI/CD** | GitHub Actions | Lint, type-check, test, and deploy on every push |

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Next.js)                   │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────────────┐ │
│  │  Knowledge Graph │      │    Q&A Picker Flow       │ │
│  │  (R3F + Three.js)│◄────►│    (Framer Motion UI)    │ │
│  └────────┬─────────┘      └────────────┬─────────────┘ │
│           │                             │               │
│           └──────────┬──────────────────┘               │
│                      │  Zustand store                   │
└──────────────────────┼──────────────────────────────────┘
                       │ tRPC / REST
┌──────────────────────▼──────────────────────────────────┐
│               Next.js API Routes (Edge)                 │
│                                                         │
│   Filter & rank logic   │   Similarity query (pgvector) │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│            Supabase (PostgreSQL + pgvector)              │
│                                                         │
│  models  │  benchmarks  │  pricing  │  embeddings       │
└──────────────────────────────────────────────────────────┘
                       ▲
          ┌────────────┘
          │  Scheduled ingestion pipeline (Python / GH Actions)
          │  → scrapes provider APIs, leaderboards, pricing pages
          └──────────────────────────────────────────────────────
```

---

## Roadmap

- [ ] **v0.1** — Static knowledge base with curated model metadata
- [ ] **v0.2** — Knowledge Graph Explorer (2D force-directed, basic fog)
- [ ] **v0.3** — Q&A Picker Flow (full decision tree, recommendation engine)
- [ ] **v0.4** — 3D graph upgrade with bloom, volumetric fog, and particle field
- [ ] **v0.5** — Live pricing & benchmark ingestion pipeline
- [ ] **v1.0** — User accounts, saved comparisons, shareable recommendation links
- [ ] **Future** — LLM-powered natural language search ("find me something like GPT-4 but cheaper and open-weight")

---

## Contributing

Contributions are welcome! Whether it's adding a missing model, improving the recommendation logic, or polishing the visual experience — please open an issue or PR.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: describe your change"`
4. Push and open a Pull Request

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<p align="center">
  Built with ❤️ for developers who are tired of LLM decision fatigue.
</p>
