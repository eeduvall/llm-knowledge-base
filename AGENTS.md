# 🤖 AGENTS.md — LLM Knowledge Base

> **This file is the authoritative guide for any AI coding agent (Copilot, Cursor, Forge, Claude, GPT-4, etc.) working in this repository.**  
> Read it fully before touching any file. Follow every rule here; if something conflicts with a general best practice you know, this file wins.

---

## 1. Project Snapshot

| Item          | Value                                            |
| ------------- | ------------------------------------------------ |
| Repo          | `eeduvall/llm-knowledge-base`                    |
| Purpose       | Interactive explorer + guided picker for LLMs    |
| Framework     | Next.js 14 (App Router)                          |
| Language      | TypeScript (strict)                              |
| Styling       | Tailwind CSS + shadcn/ui                         |
| 3-D Engine    | Three.js + react-three-fiber + @react-three/drei |
| State         | Zustand                                          |
| Data Fetching | TanStack Query                                   |
| Database      | PostgreSQL via Supabase                          |
| Hosting       | Vercel                                           |

The two primary user-facing flows are:

1. **Knowledge Graph Explorer** (`/graph`) — 3-D force-directed graph of LLM relationships.
2. **Q&A Picker Flow** (`/picker`) — conversational wizard that recommends models.

---

## 2. Repo Layout — Know Before You Touch

```
llm-knowledge-base/
├── app/                        # Next.js App Router pages & layouts
│   ├── layout.tsx              # Root layout (fonts, providers, global state)
│   ├── page.tsx                # Landing page
│   ├── graph/page.tsx          # Knowledge Graph Explorer
│   └── picker/page.tsx         # Q&A Picker Flow
├── components/
│   ├── graph/                  # Three.js / R3F components (GraphCanvas, NodeMesh, …)
│   └── picker/                 # Wizard UI components (QuestionCard, ResultDeck, …)
├── lib/
│   ├── models.ts               # Model data types & fetching helpers
│   ├── graph-layout.ts         # d3-force-3d configuration
│   └── decision-tree.ts        # Q&A flow logic / decision tree
├── data/
│   └── models.yaml             # ⚠️  Source-of-truth model metadata — see §7
├── public/assets/              # Textures, HDRI maps, fonts
└── styles/globals.css          # Tailwind base + CSS custom properties
```

**Golden rule:** every new file must live in the directory that matches its concern. Do not create top-level files unless they are config (e.g., `next.config.ts`, `tailwind.config.ts`).

---

## 3. Environment & Setup

```bash
# Install dependencies (use npm — do NOT switch to yarn or pnpm without a team decision)
npm install

# Copy env template and fill in values
cp .env.example .env.local

# Start dev server
npm run dev          # http://localhost:3000

# Type-check
npm run type-check   # tsc --noEmit

# Lint
npm run lint         # eslint + prettier check

# Test
npm test             # jest / vitest (whichever is configured)

# Build
npm run build
```

**Never commit `.env.local` or any file containing secrets.** If you need to reference an env var in code, use `process.env.NEXT_PUBLIC_*` for client-safe values and plain `process.env.*` for server-only values.

---

## 4. TypeScript Rules

- **Strict mode is on.** `tsconfig.json` must keep `"strict": true`. Do not disable it.
- **No `any`.** Use `unknown` and narrow with type guards, or define a proper interface/type.
- **Prefer `type` over `interface`** for data shapes; use `interface` only when you need declaration merging.
- **Export types explicitly** — use `export type { Foo }` not `export { Foo }` for type-only exports.
- **Model data types live in `lib/models.ts`** — do not duplicate type definitions elsewhere.
- All React component props must be typed with a named `type Props = { … }` directly above the component.

```ts
// ✅ Good
type Props = {
  modelId: string;
  onSelect: (id: string) => void;
};

export function NodePanel({ modelId, onSelect }: Props) { … }

// ❌ Bad — inline anonymous object, no name
export function NodePanel({ modelId, onSelect }: { modelId: string; onSelect: (id: string) => void }) { … }
```

---

## 5. Component Conventions

### General

- One component per file. File name = component name in PascalCase (`NodeMesh.tsx`).
- Use **named exports** everywhere — no default exports except for Next.js page files (`app/**/page.tsx`, `app/**/layout.tsx`).
- Keep components **pure and presentational** where possible. Side effects belong in hooks (`hooks/use*.ts`).
- Co-locate a component's custom hook in the same directory: `components/graph/useGraphInteraction.ts`.

### Three.js / React-Three-Fiber (R3F)

- All R3F components must be **client components** (`"use client"` at the top).
- Never import Three.js or R3F in a Server Component — it will break SSR.
- Dispose of Three.js objects (geometries, materials, textures) in `useEffect` cleanup or via `drei`'s `useGLTF.preload` / `useTexture` helpers.
- Use `@react-three/postprocessing` for visual effects (bloom, depth-of-field). Do **not** write raw WebGL shader passes unless absolutely necessary.
- Target **60 fps on a mid-range laptop GPU**. Profile with `r3f-perf` before merging any graph change.

### shadcn/ui

- Add new shadcn components via `npx shadcn-ui@latest add <component>` — do not copy-paste component source manually.
- Do not modify files inside `components/ui/` (the shadcn primitives). Wrap them in a new component if you need custom behaviour.

---

## 6. Styling Rules

- **Tailwind utility classes only** in JSX. No inline `style={{}}` except for dynamic values that cannot be expressed as Tailwind classes (e.g., computed Three.js colors).
- CSS custom properties for the design-system palette are defined in `styles/globals.css`:

```css
:root {
  /* Core palette */
  --color-bg: #050510;
  --color-primary: #6c63ff;
  --color-secondary: #00d4ff;
  --color-accent: #ff6b9d;
  --color-fog: rgba(100, 120, 255, 0.04);

  /* Text hierarchy */
  --color-text: #f0f0ff;
  --color-text-muted: rgba(240, 240, 255, 0.55);
  --color-text-faint: rgba(240, 240, 255, 0.3);

  /* Surfaces & borders */
  --color-surface: rgba(255, 255, 255, 0.04);
  --color-border: rgba(255, 255, 255, 0.1);
  --color-divider: rgba(255, 255, 255, 0.06);

  /* Component-specific */
  --color-nav-bg: rgba(5, 5, 16, 0.85);
  --color-panel-bg: rgba(255, 255, 255, 0.03);
  --color-panel-bg-alt: rgba(108, 99, 255, 0.06);
  --color-overlay: rgba(5, 5, 16, 0.75);
  --color-input-bg: rgba(255, 255, 255, 0.05);
  --color-input-border: rgba(255, 255, 255, 0.10);
  --color-pill-bg: rgba(255, 255, 255, 0.05);
  --color-pill-border: rgba(255, 255, 255, 0.08);
  --color-stats-bg: rgba(255, 255, 255, 0.04);
}
```

All available design-system tokens:

| Token                  | Purpose                                |
| ---------------------- | -------------------------------------- |
| `--color-bg`           | Page background (`#050510`)            |
| `--color-primary`      | Electric violet (`#6C63FF`)            |
| `--color-secondary`    | Cyan (`#00D4FF`)                       |
| `--color-accent`       | Hot pink (`#FF6B9D`)                   |
| `--color-fog`          | Subtle haze (`rgba(100,120,255,0.04)`) |
| `--color-text`         | Primary text                           |
| `--color-text-muted`   | Secondary / supporting text            |
| `--color-text-faint`   | Tertiary / disabled text               |
| `--color-surface`      | Card / panel surface                   |
| `--color-border`       | Default border                         |
| `--color-divider`      | Divider lines                          |
| `--color-nav-bg`       | Navigation bar background              |
| `--color-panel-bg`     | Side-panel background                  |
| `--color-panel-bg-alt` | Alternate panel background             |
| `--color-overlay`      | Modal / overlay backdrop               |

- **Never hard-code hex values** in component files — reference the CSS variable or the Tailwind config token.
- Dark mode is the **only** mode. Do not add `dark:` variants; the entire UI is dark-first.

---

## 7. Data — `data/models.yaml`

This file is the **single source of truth** for all LLM metadata. Treat it like a database schema migration: changes here affect the entire app.

### Schema (each entry)

```yaml
- id: gpt-4o # kebab-case, unique, stable
  name: 'GPT-4o' # Display name
  provider: openai # lowercase slug
  family: gpt-4 # Architecture family
  release_date: '2024-05-13' # ISO 8601
  context_window: 128000 # tokens
  modalities: [text, image] # text | image | audio | video | code
  capabilities: # free-form tags
    - reasoning
    - vision
    - tool-use
    - structured-output
  pricing: # USD per 1M tokens, null if unknown
    input: 5.00
    output: 15.00
  benchmarks:
    mmlu: 88.7 # null if not available
    humaneval: 90.2
    mt_bench: null
  strengths:
    - 'Best-in-class multimodal reasoning'
  weaknesses:
    - 'Higher cost vs. smaller models'
  license: proprietary # proprietary | apache-2.0 | mit | llama | etc.
  links:
    docs: 'https://platform.openai.com/docs'
    paper: null
```

### Rules

- **Validate YAML** before committing: `npx js-yaml data/models.yaml` must exit 0.
- All numeric fields must be numbers, not strings (`128000` not `"128k"`).
- `id` is immutable once merged — it is used as a foreign key in graph edges and decision-tree logic.
- When adding a new model, add it **alphabetically by `id`** within its provider group.
- Pricing and benchmarks go stale — include a `last_verified` date field when you update them.

---

## 8. API & Backend

- API logic lives in **Next.js Route Handlers** (`app/api/**/route.ts`) or a **tRPC router** if tRPC is adopted.
- Every route handler must:
  1. Validate input with **Zod** before touching the database.
  2. Return typed responses — define a `ResponseSchema` with Zod and infer the TypeScript type from it.
  3. Handle errors explicitly — never let an unhandled promise rejection reach the client.
- Database queries go in `lib/db/` — never write raw SQL in a route handler.
- Use **Supabase Row Level Security (RLS)** for any user-specific data. Do not bypass RLS with the service-role key on the client.

---

## 9. State Management

- **Zustand** is the global state manager. Store slices live in `lib/store/`.
- Each slice must be typed: `create<SliceType>()(…)`.
- Do **not** put server-fetched data in Zustand — that belongs in **TanStack Query** cache.
- Zustand is for UI state: selected node, active filters, wizard step, sidebar open/closed.
- TanStack Query is for async data: model list, graph edges, search results.

---

## 10. Testing

- **Unit tests** for pure functions in `lib/` — use Jest (or Vitest if configured).
- **Component tests** for picker UI — use React Testing Library.
- **Do not** write tests for Three.js render output — visual correctness is validated manually and via Storybook (if added).
- Test file naming: `*.test.ts` / `*.test.tsx` co-located next to the file under test.
- Every PR must keep **test coverage ≥ 80%** for `lib/` files.
- Run `npm test` before opening a PR. A failing test suite blocks merge.

---

## 11. Git & PR Workflow

### Branch naming

```
feat/<short-description>       # new feature
fix/<short-description>        # bug fix
data/<model-name-or-topic>     # models.yaml updates
chore/<short-description>      # tooling, deps, config
```

### Commit messages — Conventional Commits

```
feat(graph): add synapse-fire hover animation
fix(picker): correct decision-tree branching for RAG use case
data(models): add Llama-3.1-405B entry
chore(deps): upgrade three to 0.165.0
```

### PR checklist (every PR)

- [ ] `npm run type-check` passes (zero errors)
- [ ] `npm run lint` passes (zero warnings)
- [ ] `npm test` passes
- [ ] `npx js-yaml data/models.yaml` exits 0 (if YAML was touched)
- [ ] No secrets or `.env.local` committed
- [ ] New components have typed props
- [ ] New `lib/` functions have unit tests
- [ ] Performance: no new R3F component drops frame rate below 60 fps on reference hardware

---

## 12. Performance Budget

| Metric                           | Target                   |
| -------------------------------- | ------------------------ |
| Lighthouse Performance (desktop) | ≥ 90                     |
| First Contentful Paint           | < 1.5 s                  |
| Time to Interactive              | < 3 s                    |
| 3-D graph frame rate             | ≥ 60 fps (mid-range GPU) |
| JS bundle (initial, gzipped)     | < 200 kB                 |

- Three.js and R3F are **lazy-loaded** — never import them in the root layout or landing page.
- Use `next/dynamic` with `{ ssr: false }` for the `GraphCanvas` component.
- Compress all HDRI / texture assets before committing to `public/assets/`.

---

## 13. Accessibility

- All interactive elements must be keyboard-navigable.
- The Q&A Picker Flow must be fully usable without the 3-D graph (for users with `prefers-reduced-motion` or no WebGL support).
- Provide a `<noscript>` fallback or static model list for the graph page.
- Color contrast ratio ≥ 4.5:1 for all text against its background.
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, `<section>`) — do not use `<div>` for interactive elements.

---

## 14. Security

- **Never** expose Supabase service-role key or any secret to the browser.
- Sanitize all user input before rendering — use `DOMPurify` if rendering HTML, or avoid it entirely.
- Keep dependencies up to date — run `npm audit` weekly; fix `high` and `critical` vulnerabilities before merging.
- Content Security Policy headers are configured in `next.config.ts` — do not loosen them without a documented reason.

---

## 15. Agent-Specific Instructions

These rules apply specifically to AI coding agents operating in this repo.

1. **Read before writing.** Always read the file you are about to modify. Never overwrite a file based on assumptions.
2. **One concern per commit.** Do not bundle unrelated changes. A commit that adds a model to `models.yaml` should not also refactor a component.
3. **Do not invent data.** When adding model entries to `models.yaml`, only include values you can cite from official documentation, the model's paper, or the provider's pricing page. Use `null` for unknown fields — never guess.
4. **Do not change `tsconfig.json` strict settings** or disable ESLint rules without an explicit instruction from the repo owner.
5. **Do not install new dependencies** without checking whether an existing dependency already covers the need. If a new dep is genuinely required, add it and update this file's tech-stack table in §1.
6. **Prefer small, focused PRs.** If a task requires more than ~400 lines of change, split it into sequential PRs.
7. **Ask before deleting.** If a file or export appears unused, flag it in a PR comment rather than silently removing it.
8. **Respect the design system.** Do not introduce new colors, fonts, or motion values that are not in the palette defined in §6. The visual identity is intentional.
9. **Three.js memory leaks are bugs.** Any R3F component you create must dispose its geometries and materials. Use `useEffect` cleanup or `drei` helpers.
10. **The decision tree is product logic.** Changes to `lib/decision-tree.ts` affect recommendations shown to users. Treat it with the same care as a pricing algorithm — test every branch.

---

## 16. Useful Commands Reference

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run type-check       # TypeScript check (no emit)
npm run lint             # ESLint + Prettier
npm test                 # Run test suite
npx js-yaml data/models.yaml   # Validate YAML syntax
npx shadcn-ui@latest add <component>  # Add a shadcn component
```

---

_Last updated: see git log. If you update tooling or add a major dependency, update this file in the same PR._