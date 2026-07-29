# 🧠 LLM Knowledge Base

> **Navigate the ever-expanding universe of Large Language Models — and find the perfect one for your app.**

---

## ✨ Overview

The LLM landscape is vast, fast-moving, and genuinely confusing. Every week brings new models, new benchmarks, and new trade-offs. **LLM Knowledge Base** cuts through the noise with two complementary experiences:

1. **Knowledge Graph Explorer** — a living, breathing neural map of the LLM ecosystem, where models cluster by similarity like neurons firing in a brain.
2. **Q&A Picker Flow** — a guided, conversational wizard that asks the right questions about your use case and drills down to a confident recommendation.

Whether you're a developer evaluating models for a production app or a researcher mapping the landscape, this tool gives you clarity at a glance and precision on demand.

---

## 🗺️ Core Flows

### 1. 🔵 Knowledge Graph Explorer

> *"Like neurons firing in a brain — wrapped in fog."*

A full-screen, interactive 3-D force-directed graph where every node is an LLM and every edge represents a meaningful relationship. Models that share architecture families, training approaches, capability profiles, or licensing terms drift into the same gravitational cluster.

**Visual Design**
- Deep dark background (`#050510`) evoking deep space / neural tissue
- Nodes rendered as glowing, pulsing spheres — color-coded by family (OpenAI, Anthropic, Meta, Mistral, Google, open-source, etc.)
- Edges rendered as soft bioluminescent filaments that brighten when traversed
- Volumetric fog / particle haze drifts across the graph, parting as you navigate — giving the impression of thoughts forming in a mind
- Hovering a node fires a ripple of light outward along its connections, like a synapse activating
- Clicking a node opens a side-panel with the model's full profile: context window, pricing, benchmarks, strengths, weaknesses, and licensing

**Interaction**
- Orbit, zoom, and pan in 3-D
- Filter by capability (code, reasoning, vision, tool-use, long-context, …)
- Search to highlight a specific model and dim everything else
- Toggle clustering algorithm (by family, by benchmark score, by cost tier, by modality)

---

### 2. 🟣 Q&A Picker Flow

> *"Tell me what you're building — I'll tell you what to use."*

A sleek, chat-style wizard that starts broad and progressively narrows. Each answer shapes the next question, building a decision tree in real time until a ranked shortlist of models emerges.

**Example Question Funnel**

```
What are you building?
  ├─ Customer-facing chatbot
  │    ├─ What's your latency budget?  (< 500 ms / 1–2 s / flexible)
  │    ├─ Do you need multilingual support?
  │    └─ What's your monthly token budget?
  ├─ Code assistant / copilot
  │    ├─ Which languages / frameworks?
  │    └─ On-device or cloud?
  ├─ Document analysis / RAG pipeline
  │    ├─ How large are your documents?  (→ context window matters)
  │    └─ Do you need citations / grounding?
  ├─ Autonomous agent / tool-use
  │    ├─ How many tool calls per turn?
  │    └─ Do you need structured JSON output?
  └─ Creative / generative content
       ├─ Text, image, audio, or multimodal?
       └─ How important is style consistency?
```

**Output**
- A ranked card deck of recommended models with a plain-English explanation of *why* each one fits
- Side-by-side comparison table for the top picks
- One-click deep-dive into the Knowledge Graph, zoomed to the recommended cluster

---

## 🛠️ Suggested Tech Stack

### Frontend

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14** (App Router) | File-based routing, RSC, excellent DX |
| Language | **TypeScript** | Type safety across the whole codebase |
| Styling | **Tailwind CSS** + **shadcn/ui** | Utility-first, beautiful primitives out of the box |
| 3-D Graph | **Three.js** + **react-three-fiber** + **@react-three/drei** | Full WebGL control; `drei` helpers for fog, bloom, particles |
| Force Layout | **d3-force-3d** | Battle-tested physics simulation, 3-D extension |
| Graph Rendering | **three-forcegraph** | Bridges d3-force-3d and Three.js elegantly |
| Post-processing | **@react-three/postprocessing** | Bloom, depth-of-field, chromatic aberration for the "neural" glow |
| Animation | **Framer Motion** | Page transitions and Q&A card animations |
| State | **Zustand** | Lightweight, no boilerplate |
| Data Fetching | **TanStack Query** | Caching, background refresh for live model data |

### Backend / Data

| Layer | Choice | Why |
|---|---|---|
| API | **Next.js Route Handlers** (or **tRPC**) | Co-located, type-safe API layer |
| Database | **PostgreSQL** (via **Supabase**) | Relational model data + auth out of the box |
| Graph DB (optional) | **Neo4j Aura** (free tier) | Native graph queries for relationship traversal |
| Search | **Algolia** or **pgvector** | Semantic search over model descriptions |
| CMS / Data | **Contentlayer** or plain JSON/YAML | Version-controlled model metadata |

### Infrastructure

| Layer | Choice | Why |
|---|---|---|
| Hosting | **Vercel** | Zero-config Next.js deployment, edge functions |
| CDN / Assets | **Vercel Edge Network** | Global low-latency for 3-D assets |
| CI/CD | **GitHub Actions** | Lint, type-check, test on every PR |
| Monitoring | **Vercel Analytics** + **Sentry** | Real-user metrics and error tracking |

---

## 🎨 Visual Design Direction

```
Palette
  Background  #050510  — near-black deep space
  Primary     #6C63FF  — electric violet (nodes, accents)
  Secondary   #00D4FF  — cyan bioluminescence (edges, highlights)
  Accent      #FF6B9D  — hot pink (selected state, alerts)
  Fog         rgba(100, 120, 255, 0.04) — subtle blue-purple haze

Typography
  Display     "Cal Sans" or "Syne"  — geometric, futuristic
  Body        "Inter"               — clean, readable
  Mono        "JetBrains Mono"      — code snippets, model IDs

Motion Principles
  • Nodes breathe — a slow, continuous scale pulse (1.0 → 1.08 → 1.0, ~3 s)
  • Edges shimmer — animated dash-offset along filaments
  • Fog drifts — large, slow Perlin-noise displacement on a particle system
  • Synapse fire — on hover, a radial bloom pulse travels outward at ~400 ms
  • Q&A cards — slide in from the right with a spring easing, exit left
```

---

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App                         │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────────────┐ │
│  │  Knowledge Graph │      │    Q&A Picker Flow       │ │
│  │  (Three.js / R3F)│      │    (Framer Motion cards) │ │
│  └────────┬─────────┘      └────────────┬─────────────┘ │
│           │                             │               │
│           └──────────┬──────────────────┘               │
│                      │                                  │
│              ┌───────▼────────┐                         │
│              │  Zustand Store │                         │
│              │  TanStack Query│                         │
│              └───────┬────────┘                         │
│                      │                                  │
│              ┌───────▼────────┐                         │
│              │  API Routes /  │                         │
│              │  tRPC Router   │                         │
│              └───────┬────────┘                         │
└──────────────────────┼──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    ┌─────▼──┐   ┌─────▼──┐  ┌─────▼──┐
    │Postgres│   │ Neo4j  │  │pgvector│
    │(models)│   │(graph) │  │(search)│
    └────────┘   └────────┘  └────────┘
```

---

## 🗂️ Proposed Project Structure

```
llm-knowledge-base/
├── app/
│   ├── layout.tsx              # Root layout, fonts, providers
│   ├── page.tsx                # Landing / entry point
│   ├── graph/
│   │   └── page.tsx            # Knowledge Graph Explorer
│   └── picker/
│       └── page.tsx            # Q&A Picker Flow
├── components/
│   ├── graph/
│   │   ├── GraphCanvas.tsx     # R3F canvas + scene
│   │   ├── NodeMesh.tsx        # Individual LLM node
│   │   ├── EdgeLine.tsx        # Relationship filament
│   │   ├── FogLayer.tsx        # Volumetric particle fog
│   │   └── NodePanel.tsx       # Side-panel model detail
│   └── picker/
│       ├── QuestionCard.tsx    # Animated question card
│       ├── AnswerButton.tsx    # Choice button
│       └── ResultDeck.tsx      # Final recommendation cards
├── lib/
│   ├── models.ts               # Model data types & fetching
│   ├── graph-layout.ts         # d3-force-3d configuration
│   └── decision-tree.ts        # Q&A flow logic
├── data/
│   └── models.yaml             # Source-of-truth model metadata
├── public/
│   └── assets/                 # Textures, HDRI, fonts
└── styles/
    └── globals.css             # Tailwind base + custom CSS vars
```

---

## 🚀 Getting Started *(future)*

```bash
# Clone the repo
git clone https://github.com/eeduvall/llm-knowledge-base.git
cd llm-knowledge-base

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🤝 Contributing

Contributions are welcome! Model data goes stale fast — PRs that update `data/models.yaml` with new models, corrected benchmarks, or pricing changes are especially appreciated.

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/add-gemini-2`)
3. Commit your changes
4. Open a Pull Request

---

## 📄 License

MIT © [eeduvall](https://github.com/eeduvall)

---

<p align="center">
  <em>Built for developers who refuse to guess which LLM to use.</em>
</p>
