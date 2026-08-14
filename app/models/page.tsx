import { Navbar } from '@/components/Navbar';
import { ModelCard } from '@/components/ModelCard';
import { getAllModels } from '@/lib/db/models';

export const metadata = {
  title: 'Models — LLM Knowledge Base',
  description:
    'Browse all LLMs in the knowledge base: context windows, pricing, benchmarks, and capabilities at a glance.',
};

export default function ModelsPage() {
  const models = getAllModels();

  return (
    <main style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <Navbar />

      <div className="pt-24 pb-16 px-6 max-w-6xl mx-auto">
        {/* Page header */}
        <header className="mb-10">
          <p
            className="text-xs font-mono font-medium tracking-widest uppercase mb-3"
            style={{ color: 'var(--color-primary)' }}
          >
            Knowledge Base
          </p>
          <h1
            className="text-4xl font-bold mb-3"
            style={{ color: 'var(--color-text)', fontFamily: 'Syne, sans-serif' }}
          >
            All Models
          </h1>
          <p className="text-base max-w-xl" style={{ color: 'var(--color-text-muted)' }}>
            {models.length} language models — click any card to see the full profile.
          </p>
        </header>

        {/* Model grid */}
        <section aria-label="Model list">
          <ul
            className="grid gap-4 list-none"
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
