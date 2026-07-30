import { loadModels } from '@/lib/models-server'
import { GraphExplorer } from '@/components/graph/GraphExplorer'
import { Navbar } from '@/components/Navbar'
import type { Model } from '@/lib/models'

export const metadata = {
  title: 'Knowledge Graph Explorer — LLM Knowledge Base',
  description:
    'Explore the LLM landscape as an interactive force-directed graph. Filter by provider, search models, and click any node for a full profile.',
}

export default function GraphPage() {
  let models: Model[] = []
  let loadError = false

  try {
    models = loadModels()
  } catch {
    loadError = true
  }

  if (loadError) {
    return (
      <main style={{ backgroundColor: '#050510', minHeight: '100vh' }}>
        <Navbar />
        <div className="flex items-center justify-center" style={{ height: '100vh' }}>
          <p className="text-white/60 text-sm">
            Unable to load model data. Please try again later.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ backgroundColor: '#050510', minHeight: '100vh' }}>
      <Navbar />
      <section
        className="relative pt-16"
        style={{ height: '100vh' }}
        aria-label="Knowledge Graph Explorer"
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(108,99,255,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="relative w-full h-full">
          <GraphExplorer models={models} />
        </div>

        {/* No-script fallback */}
        <noscript>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/60 text-sm">
              JavaScript is required to view the interactive graph. Please
              enable it in your browser settings.
            </p>
          </div>
        </noscript>
      </section>
    </main>
  )
}
