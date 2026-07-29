# 🧠 LLM Knowledge Base

> *Navigate the ever-expanding universe of Large Language Models — find the right one for your app, visually and interactively.*

---

## ✨ Overview

**LLM Knowledge Base** is an interactive web application that helps developers, product teams, and AI enthusiasts cut through the noise and confidently choose the right Large Language Model for their use case.

The app offers two complementary experiences:

| Experience | Description |
|---|---|
| 🕸️ **Knowledge Graph Explorer** | A living, breathing neural-network-style graph that clusters "like" LLMs together based on capabilities, cost, latency, context window, and more. |
| 🧭 **Q&A Picker Flow** | A guided, conversational wizard that asks about your app's purpose and progressively narrows down to the ideal LLM recommendation. |

---

## 🕸️ Feature 1 — Knowledge Graph Explorer

Imagine neurons firing inside a brain — glowing nodes connected by pulsing synaptic edges, drifting through a soft volumetric fog. That's the Knowledge Graph.

### What it does
- Renders every tracked LLM as a **glowing node** in 3D space
- Nodes are **clustered by similarity** — coding models gravitate together, reasoning models form their own constellation, multimodal models another, and so on
- **Edges pulse** between nodes that share capabilities or are commonly compared
- A **fog layer** adds depth and atmosphere, making distant clusters feel far away and mysterious
- Hovering a node reveals a **tooltip card** with key stats: provider, context window, pricing tier, strengths, and known limitations
- Clicking a node **expands** it into a full detail panel with benchmark scores, use-case tags, and links to official docs
- A **filter sidebar** lets you toggle clusters on/off (e.g., show only open-source models, or only models under a certain cost threshold)
- A **search bar** flies the camera to any model instantly

### Visual Design Direction
- Dark background (`#050810`) — deep space / inside-a-brain aesthetic
- Nodes rendered as **soft luminous spheres** with a bloom glow effect; color-coded by cluster (e.g., blue = reasoning, green = coding, amber = multimodal, violet = open-source)
- Edges are **semi-transparent animated lines** with a traveling particle effect to suggest signal flow
- A **volumetric fog shader** (layered noise) fills the mid-ground, giving depth and a sense of scale
- Camera slowly **auto-orbits** when idle, like a screensaver, to show off the graph
- Smooth **spring-physics** on node drag and camera transitions

---

## 🧭 Feature 2 — Q&A Picker Flow

A clean, focused wizard that feels like a conversation with a knowledgeable AI architect.

### How it works
1. **"What are you building?"** — broad category selection (chatbot, coding assistant, document analysis, image + text, real-time voice, etc.)
2. **Drill-down questions** — based on the answer, the wizard asks progressively more specific questions:
   - Expected volume / latency requirements
   - Budget sensitivity (cost per token matters?)
   - Context window needs (short Q&A vs. long documents)
   - Fine-tuning or self-hosting requirements
   - Compliance / data-residency constraints
   - Desired output format (structured JSON, prose, code, etc.)
3. **Results screen** — a ranked shortlist of recommended LLMs with a plain-English explanation of *why* each one fits, side-by-side comparison table, and a direct link to the Knowledge Graph node for each recommendation

### Visual Design Direction
- Clean, minimal card-based UI with generous whitespace
- Each question **slides in** with a subtle fade + upward motion
- A **progress indicator** (glowing arc or neural-path animation) shows how far through the flow the user is
- The results screen uses a **glassmorphism card** style — frosted glass panels over a blurred version of the Knowledge Graph in the background, tying both experiences together visually

---

## 🛠️ Suggested Tech Stack

### Frontend
| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 14** (App Router) | File-based routing, server components, great DX |
| Language | **TypeScript** | Type safety across the whole codebase |
| Styling | **Tailwind CSS** + **shadcn/ui** | Utility-first styling with beautiful, accessible components out of the box |
| 3D / Graph | **Three.js** + **React Three Fiber** + **@react-three/drei** | Declarative 3D in React; `drei` provides fog, bloom, orbit controls, and more |
| Graph Layout | **d3-force-3d** | Force-directed 3D clustering with configurable attraction/repulsion |
| Animations | **Framer Motion** | Smooth page transitions, wizard step animations, spring physics |
| State Management | **Zustand** | Lightweight, no-boilerplate global state for graph filters and wizard progress |
| Data Fetching | **TanStack Query (React Query)** | Caching and background refresh for LLM metadata |

### Backend / Data
| Layer | Technology | Why |
|---|---|---|
| API Routes | **Next.js Route Handlers** | Co-located API endpoints, no separate server needed |
| Database | **Supabase (PostgreSQL)** | Managed Postgres with a generous free tier; stores LLM metadata, benchmark scores, and user sessions |
| Vector Search *(optional)* | **pgvector** (via Supabase) | Embed LLM capability descriptions and find nearest neighbors for graph clustering |
| CMS / Data Source | **JSON flat files** (seed) → Supabase | Start with a curated JSON dataset of LLMs, migrate to a DB-backed admin panel over time |

### Visual / Shader Effects
| Effect | Approach |
|---|---|
| Volumetric fog | `@react-three/drei` `<fog>` + custom GLSL noise shader for layered depth fog |
| Bloom / glow | `@react-three/postprocessing` `<Bloom>` effect pass |
| Particle edges | Custom `THREE.Points` or `drei` `<Trail>` component on animated edge midpoints |
| Glassmorphism UI | Tailwind `backdrop-blur` + `bg-white/10` utility classes |

### Tooling & Infrastructure
| Tool | Purpose |
|---|---|
| **pnpm** | Fast, disk-efficient package manager |
| **ESLint** + **Prettier** | Code quality and consistent formatting |
| **Vitest** + **React Testing Library** | Unit and component tests |
| **Playwright** | End-to-end tests for the wizard flow |
| **Vercel** | Zero-config deployment, edge network, preview URLs per PR |
| **GitHub Actions** | CI pipeline: lint → test → deploy preview |

---

## 📁 Proposed Project Structure

```
llm-knowledge-base/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Landing / entry point
│   ├── graph/
│   │   └── page.tsx            # Knowledge Graph Explorer
│   └── picker/
│       └── page.tsx            # Q&A Picker Flow
├── components/
│   ├── graph/
│   │   ├── GraphCanvas.tsx     # React Three Fiber scene root
│   │   ├── LLMNode.tsx         # Individual glowing node
│   │   ├── EdgeParticles.tsx   # Animated edge connections
│   │   └── FogLayer.tsx        # Volumetric fog shader
│   ├── picker/
│   │   ├── WizardShell.tsx     # Step container + progress arc
│   │   ├── QuestionCard.tsx    # Animated question slide
│   │   └── ResultsPanel.tsx    # Glassmorphism results card
│   └── ui/                     # shadcn/ui re-exports + custom atoms
├── lib/
│   ├── llm-data.ts             # LLM metadata types and seed data
│   ├── clustering.ts           # d3-force-3d graph layout logic
│   └── picker-logic.ts         # Decision tree / scoring for Q&A flow
├── data/
│   └── llms.json               # Curated LLM dataset (seed)
├── public/
│   └── ...                     # Static assets
├── styles/
│   └── globals.css
└── tests/
    ├── unit/
    └── e2e/
```

---

## 🗺️ Roadmap

- [ ] **v0.1** — Static JSON dataset, Knowledge Graph with clustering and hover cards
- [ ] **v0.2** — Q&A Picker Flow with decision tree logic and results screen
- [ ] **v0.3** — Supabase integration, dynamic LLM data, admin panel for updates
- [ ] **v0.4** — User accounts, saved comparisons, shareable recommendation links
- [ ] **v0.5** — Community-contributed LLM reviews and benchmark submissions
- [ ] **v1.0** — Public launch, embeddable widget for third-party sites

---

## 🤝 Contributing

Contributions are welcome! Whether it's adding a new LLM to the dataset, improving the graph clustering algorithm, or polishing the visual effects — open an issue or PR and let's build it together.

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<p align="center">
  <em>Built for the community navigating the LLM landscape — one neuron at a time. 🧠⚡</em>
</p>
