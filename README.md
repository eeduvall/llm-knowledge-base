<div align="center">

# 🧠 LLM Knowledge Base

### *Navigate the LLM landscape — intelligently.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blueviolet.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Status: In Design](https://img.shields.io/badge/Status-In%20Design-orange.svg)]()

> An interactive app that helps developers and product teams cut through the noise and find the **right LLM** for their use case — through a living knowledge graph and a guided Q&A picker.

</div>

---

## ✨ What Is This?

Choosing an LLM today feels like navigating a fog-filled neural network — hundreds of models, benchmarks, pricing tiers, context windows, and capability trade-offs. **LLM Knowledge Base** makes that fog beautiful and navigable.

The app offers **two complementary experiences**:

| Experience | Description |
|---|---|
| 🕸️ **Knowledge Graph Explorer** | A dynamic, neuron-inspired visual graph that clusters "like" LLMs together — revealing relationships, families, and capability neighborhoods at a glance. |
| 🧭 **Q&A Picker Flow** | A conversational, drill-down wizard that asks about your app's purpose and progressively narrows to a tailored LLM recommendation. |

---

## 🕸️ Flow 1 — Knowledge Graph Explorer

Imagine the visual of **neurons firing in a brain** — glowing nodes drifting through a soft, volumetric fog, connected by pulsing synaptic edges.

### How It Works

- **Nodes** represent individual LLMs (e.g., GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, Llama 3, Mistral, Phi-3, etc.)
- **Clusters** group models by shared characteristics:
  - 🏷️ Provider family (OpenAI, Anthropic, Google, Meta, Mistral AI, …)
  - ⚡ Capability profile (reasoning, coding, multimodal, long-context, speed-optimized, cost-optimized)
  - 📐 Model size / parameter class
  - 🔒 Deployment type (API-only, open-weight, self-hostable)
- **Edges** encode relationships — shared architecture lineage, similar benchmark scores, or common use-case overlap
- **Hover / click** a node to reveal a rich detail panel: context window, pricing, strengths, weaknesses, and benchmark scores
- **Fog & glow** effects shift dynamically as you pan and zoom, giving the graph an organic, living feel

### Visual Design Direction

```
  ·  ·  ·  ✦  ·  ·  ·
·   [GPT-4o]──────[o1]   ·
  ·    \   ✦  ·  /   ·
·  ✦  [Claude 3.5]  ✦  ·
  ·  /    ·    \   ·
· [Gemini]  ·  [Llama 3] ·
  ·  ·  ✦  ·  ·  ·  ·
```

- **Background**: Deep space dark (`#0a0a14`) with a subtle animated star field
- **Fog**: Layered radial gradients in indigo/violet, animated with a slow drift shader
- **Nodes**: Glowing spheres — color-coded by cluster, with a soft bloom halo
- **Edges**: Semi-transparent, animated "pulse" traveling along the connection line
- **Interaction**: Spring-physics layout (nodes repel/attract), smooth zoom & pan, node drag

---

## 🧭 Flow 2 — Q&A Picker

A guided, conversational wizard that feels less like a form and more like talking to a knowledgeable colleague.

### How It Works

The flow starts broad and drills down:

```
1. What are you building?
   → Chatbot / Assistant
   → Code generation tool
   → Document analysis / RAG
   → Creative writing
   → Data extraction / structured output
   → Multimodal app (images, audio, video)
   → Other

2. What matters most to you?
   → Lowest cost          → Best reasoning accuracy
   → Fastest response     → Largest context window
   → Self-hostable        → Multimodal support

3. What's your deployment environment?
   → Cloud API (managed)
   → On-premise / air-gapped
   → Edge / mobile

4. What's your expected scale?
   → Prototype / low volume
   → Production (moderate)
   → High-throughput / enterprise

5. Any hard constraints?
   → Budget cap ($/1M tokens)
   → Data privacy / no third-party API
   → Specific language or region support

→ 🎯 Recommendation: [Model Name]
   With runner-up alternatives and a side-by-side comparison card.
```

### UX Design Direction

- **Animated card transitions** — each question slides in with a spring easing
- **Progress indicator** — a glowing neural-path that "lights up" as you advance
- **Recommendation reveal** — a cinematic "zoom into the graph" that flies the camera to the recommended node in the Knowledge Graph, bridging both flows
- **Shareable results** — generate a permalink to your recommendation for team sharing

---

## 🛠️ Suggested Tech Stack

### Frontend

| Layer | Technology | Why |
|---|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) | React Server Components, file-based routing, excellent DX |
| **Language** | TypeScript | Type safety across the full stack |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | Utility-first with beautiful, accessible primitives |
| **3D / Graph** | [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [Three.js](https://threejs.org/) | GPU-accelerated 3D scene for the neuron graph |
| **Graph Layout** | [D3-force](https://github.com/d3/d3-force) or [Cosmos](https://github.com/cosmograph-org/cosmos) | Physics-based force simulation for node clustering |
| **Post-processing** | [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing) | Bloom, depth-of-field, and fog shader effects |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) | Smooth UI transitions for the Q&A picker flow |
| **State** | [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight global state for graph + picker state |

### Backend / Data

| Layer | Technology | Why |
|---|---|---|
| **API Routes** | Next.js API Routes / Route Handlers | Co-located with the frontend, zero extra infra |
| **Database** | [Supabase](https://supabase.com/) (Postgres) | LLM metadata, user sessions, shareable links |
| **Graph DB** *(optional)* | [Neo4j](https://neo4j.com/) or [Weaviate](https://weaviate.io/) | Native graph queries for relationship traversal |
| **Search** | [Algolia](https://www.algolia.com/) or Postgres full-text | Fast fuzzy search across LLM metadata |
| **Auth** | [Clerk](https://clerk.com/) or Supabase Auth | Saved recommendations, team workspaces |

### Infrastructure

| Layer | Technology | Why |
|---|---|---|
| **Hosting** | [Vercel](https://vercel.com/) | Zero-config Next.js deployment, edge network |
| **CDN / Assets** | Vercel Edge Network | Fast global delivery of 3D assets |
| **CI/CD** | GitHub Actions | Automated lint, test, and preview deployments |
| **Monitoring** | [Sentry](https://sentry.io/) + Vercel Analytics | Error tracking and real-user performance |

### Developer Experience

| Tool | Purpose |
|---|---|
| [Biome](https://biomejs.dev/) | Fast linting + formatting (replaces ESLint + Prettier) |
| [Vitest](https://vitest.dev/) | Unit & integration testing |
| [Playwright](https://playwright.dev/) | End-to-end testing |
| [Storybook](https://storybook.js.org/) | Component development & visual regression |

---

## 🎨 Design System at a Glance

```
Colors
──────
Background    #0a0a14   Deep space
Surface       #12121f   Card / panel
Border        #1e1e3a   Subtle divider
Accent 1      #7c3aed   Violet (primary)
Accent 2      #06b6d4   Cyan (secondary)
Accent 3      #f59e0b   Amber (highlight)
Text          #e2e8f0   Primary text
Muted         #64748b   Secondary text

Typography
──────────
Display       "Cal Sans" or "Geist" — bold, modern
Body          "Inter" — clean, readable
Mono          "JetBrains Mono" — code snippets

Motion Principles
─────────────────
• Nodes breathe — subtle scale pulse at rest
• Fog drifts — slow, looping Perlin noise displacement
• Edges pulse — traveling glow from source to target
• Transitions — spring physics (stiffness 200, damping 20)
• Page changes — fade + upward slide, 300ms
```

---

## 🗺️ Roadmap

- [ ] **v0.1** — Static knowledge graph with curated LLM dataset
- [ ] **v0.2** — Q&A picker flow with recommendation engine
- [ ] **v0.3** — Live data sync (model releases, pricing updates)
- [ ] **v0.4** — User accounts, saved comparisons, shareable links
- [ ] **v0.5** — Embed widget for third-party docs sites
- [ ] **v1.0** — Public launch 🚀

---

## 🤝 Contributing

Contributions are welcome! Whether it's adding a new LLM to the dataset, improving the recommendation logic, or polishing the visual design — open an issue or PR.

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a PR

---

## 📄 License

MIT © [eeduvall](https://github.com/eeduvall)

---

<div align="center">

*Built with curiosity, caffeine, and a healthy obsession with the LLM landscape.*

</div>
