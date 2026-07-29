# 🧠 LLM Knowledge Base

> **Navigate the LLM landscape with confidence.**  
> An interactive, visually immersive app that helps developers and product teams pick the right Large Language Model for their use case — through two complementary experiences: a living knowledge graph and a guided Q&A picker.

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  <img alt="Built with Next.js" src="https://img.shields.io/badge/built%20with-Next.js%2014-black?logo=next.js" />
  <img alt="Three.js" src="https://img.shields.io/badge/3D-Three.js-orange?logo=three.js" />
  <img alt="Deployed on Vercel" src="https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel" />
</p>

---

## ✨ What Is This?

The LLM ecosystem is exploding. GPT-4o, Claude 3.5, Gemini 1.5, Mistral, Llama 3, Command R+, Phi-3 … the list grows every week. Choosing the right model for your application is no longer trivial — it involves trade-offs across cost, latency, context window, reasoning ability, multimodality, licensing, and more.

**LLM Knowledge Base** gives users two intuitive paths to the answer:

| Flow | What it does |
|---|---|
| 🕸️ **Knowledge Graph** | A dynamic, neuron-inspired 3D graph that clusters "like" LLMs together so you can visually explore the landscape and understand relationships at a glance. |
| 🧭 **Q&A Picker** | A conversational drill-down that asks about your app's purpose, constraints, and priorities — then surfaces the best-fit LLM(s) with a clear, plain-English rationale. |

---

## 🕸️ Flow 1 — Knowledge Graph

### Concept

Imagine a living brain. Neurons pulse with soft light, connected by synaptic threads that glow when activated. A gentle fog drifts across the scene. That is the Knowledge Graph view.

Each **node** is an LLM. Nodes that share characteristics — similar benchmark scores, similar pricing tiers, similar modalities, similar licensing — are drawn into closer orbital clusters by a physics-based force layout. Nodes that are fundamentally different repel each other to the edges of the canvas.

### What You Can Do

- **Explore freely** — pan, zoom, and rotate the 3D graph.
- **Hover a node** — a tooltip card surfaces key stats: provider, context window, cost per million tokens, strengths, and known limitations.
- **Click a node** — expands into a full detail panel with benchmark comparisons, use-case tags, and direct links to documentation / pricing pages.
- **Filter by dimension** — toggle clustering by cost tier, modality (text / vision / audio / code), open vs. closed weights, context length, or reasoning capability.
- **Watch it breathe** — idle nodes pulse gently; activating a filter triggers a re-simulation where nodes drift into new clusters with smooth spring animations.

### Visual Design Direction

| Element | Design Choice |
|---|---|
| Background | Deep space black (`#050810`) with a subtle radial gradient bloom at center |
| Fog | Layered, animated `THREE.FogExp2` planes drifting slowly across the scene — evoking the haze between synapses |
| Nodes | Glowing spheres with a soft **UnrealBloom** post-processing pass; color-coded by provider family |
| Edges | Semi-transparent, luminous threads (`opacity: 0.25–0.6`) that brighten on hover |
| Pulse animation | Sinusoidal scale + emissive intensity oscillation on each node, offset by a random phase so they feel organic and alive |
| Particle field | Sparse floating dust particles in the background to reinforce the "neural space" atmosphere |
| Typography | Clean, futuristic sans-serif (**Space Grotesk** / **Inter**) with glowing text accents |
| Cluster halos | Soft, colored radial gradients behind each cluster group to visually separate "families" of models |

---

## 🧭 Flow 2 — Q&A Picker

### Concept

A guided, conversational experience that feels less like a form and more like talking to a knowledgeable colleague. The user answers a short sequence of branching questions; each answer narrows the candidate pool until one or a few LLMs are recommended with a plain-English explanation of *why*.

### Question Flow (Example Path)

```
1. What are you building?
   → Chatbot / Assistant
   → Code generation tool
   → Document analysis / RAG pipeline
   → Creative writing / content generation
   → Data extraction / structured output
   → Something else

2. What matters most to you?
   → Lowest cost
   → Fastest response time
   → Highest accuracy / reasoning
   → Largest context window
   → Open weights / self-hostable
   → Multimodal (images, audio, video)

3. What is your expected usage scale?
   → Prototype / personal project
   → Small team / startup
   → Production at scale (millions of requests/month)

4. Do you have data privacy or compliance requirements?
   → No special requirements
   → GDPR / EU data residency
   → HIPAA / sensitive data — must self-host

5. What is your budget per million tokens?
   → < $1
   → $1–$10
   → $10+ (quality is paramount)

→ RESULT: Recommended LLM(s) with rationale card
```

### Result Card

Each recommendation surfaces:
- **Model name & provider logo**
- **Why it fits** — a 2–3 sentence plain-English explanation tied to the user's answers
- **Key stats** — context window, cost, latency tier, license
- **Alternatives** — 1–2 runner-up models with brief trade-off notes
- **"Explore in Graph"** — deep-links into the Knowledge Graph with the recommended node highlighted and pulsing

---

## 🛠️ Suggested Tech Stack

### Frontend

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 14** (App Router) | File-based routing, React Server Components for fast initial loads, excellent DX |
| Language | **TypeScript** | End-to-end type safety across the entire codebase |
| Styling | **Tailwind CSS** + **shadcn/ui** | Utility-first speed with beautiful, accessible components out of the box |
| 3D / Graph | **Three.js** via **React Three Fiber** + **@react-three/drei** | Declarative 3D in React; `drei` provides helpers for bloom, fog, and orbit controls |
| Graph physics | **d3-force-3d** | Force-directed layout in 3D space; drives the node simulation and clustering |
| Graph rendering | **react-force-graph-3d** | Wraps Three.js + d3-force-3d into a ready-made 3D force graph component |
| Post-processing | **@react-three/postprocessing** (UnrealBloom) | The "neurons glowing" bloom effect with minimal setup |
| Animations | **Framer Motion** | Smooth page transitions, Q&A step animations, and result card reveals |
| State management | **Zustand** | Lightweight, boilerplate-free global state for graph filters and picker flow |
| Data fetching | **TanStack Query** | Caching and background refresh for LLM metadata |

### Backend / Data

| Layer | Technology | Why |
|---|---|---|
| API routes | **Next.js Route Handlers** | Co-located with the frontend; no separate server needed to start |
| Database | **Supabase** (Postgres) | Managed Postgres with a generous free tier; stores LLM metadata, benchmark scores, and user sessions |
| Graph data | **JSON / static files** (seed) → Supabase | LLM nodes and edges defined in version-controlled JSON, synced to DB |
| Search / filter | **Supabase full-text search** or **Algolia** | Fast faceted filtering across LLM attributes |
| Auth (optional) | **Supabase Auth** | If saving user sessions or picker history |

### Infrastructure & Tooling

| Concern | Technology |
|---|---|
| Hosting | **Vercel** — zero-config Next.js deployment, global edge network |
| CI/CD | **GitHub Actions** — lint, type-check, and deploy on push |
| Package manager | **pnpm** — fast, disk-efficient |
| Linting / formatting | **ESLint** + **Prettier** |
| Testing | **Vitest** (unit) + **Playwright** (e2e) |
| Analytics | **Vercel Analytics** or **PostHog** |

---

## 🎨 Design System at a Glance

```
Primary Palette
  Background:    #050810  (deep space)
  Surface:       #0d1117  (card / panel)
  Border:        #1e2a3a  (subtle divider)
  Accent Blue:   #3b82f6  (interactive / links)
  Accent Cyan:   #06b6d4  (graph edges / glow)
  Accent Purple: #a855f7  (cluster highlights)
  Text Primary:  #f0f6fc
  Text Muted:    #8b949e

Typography
  Display:  Space Grotesk, 700
  Body:     Inter, 400 / 500
  Mono:     JetBrains Mono  (code snippets, stats)

Motion Principles
  - Easing:    spring-based (no linear easing)
  - Duration:  200–400 ms for UI; 800–1200 ms for graph transitions
  - Idle:      always subtle, never distracting
  - Fog drift: 20–40 s loop, randomized per layer
```

---

## 🗺️ Roadmap

- [ ] Seed database with initial set of ~30 LLMs
- [ ] Build Knowledge Graph view (3D force layout + bloom + fog)
- [ ] Build Q&A Picker flow (branching question engine)
- [ ] Connect Picker result → Graph highlight
- [ ] Add LLM side-by-side comparison table view
- [ ] Community-contributed LLM entries (with moderation)
- [ ] Embed benchmark data (MMLU, HumanEval, MATH, GPQA, etc.)
- [ ] "What changed this week" feed for new model releases
- [ ] API endpoint so other tools can query recommendations programmatically

---

## 🚀 Getting Started

> ⚠️ **No code yet** — this repo is in the planning phase. The section below describes the intended setup once development begins.

```bash
# 1. Clone the repo
git clone https://github.com/eeduvall/llm-knowledge-base.git
cd llm-knowledge-base

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env.local
# → Fill in your Supabase URL, anon key, etc.

# 4. Run the development server
pnpm dev
# → Open http://localhost:3000
```

---

## 🤝 Contributing

Contributions are welcome! Whether it's adding a new LLM to the dataset, improving the question flow, or refining the visual design — open an issue or pull request and let's build this together.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
