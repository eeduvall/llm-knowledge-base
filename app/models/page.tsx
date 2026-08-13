import { Navbar } from '@/components/Navbar';
import { ModelCard } from '@/components/ModelCard';
import { loadModels } from '@/lib/models-server';

export const metadata = {
  title: 'Models — LLM Knowledge Base',
  description:
    'Browse all LLMs in the knowledge base: context windows, pricing, benchmarks, and capabilities at a glance.',
};

export default function ModelsPage() {
  const models = loadModels();

  return (
    <main style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 pb-16 pt-24">
        {/* Page header */}
        <header className="mb-10">
          <p
            className="mb-3 font-mono text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--color-primary)' }}
          >
            Knowledge Base
          </p>
          <h1
            className="mb-3 text-4xl font-bold"
            style={{ color: 'var(--color-text)', fontFamily: 'Syne, sans-serif' }}
          >
            All Models
          </h1>
          <p className="max-w-xl text-base" style={{ color: 'var(--color-text-muted)' }}>
            {models.length} language models — click any card to see the full profile.
          </p>
        </header>

        {/* Model grid */}
        <section aria-label="Model list">
          <ul
            className="grid list-none gap-4"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            }}
          >
            {models.map((model) => (
              <li key={model.id}>
                <ModelCard model={model} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
