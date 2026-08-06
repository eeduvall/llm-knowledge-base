import { Navbar } from '@/components/Navbar'

export const metadata = {
  title: 'Changelog — LLM Knowledge Base',
  description: 'Release history and updates for LLM Knowledge Base.',
}

type ChangelogEntry = {
  version: string
  date: string
  changes: string[]
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.1.0',
    date: '2024-01-01',
    changes: [
      'Initial release of LLM Knowledge Base.',
      'Knowledge Graph Explorer with 2-D force-directed graph.',
      'Q&A Picker Flow with 6-question decision tree.',
      'Model browsing at /models with full profile pages.',
      '11 models across OpenAI, Anthropic, Google, Meta, and Mistral.',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <main className="bg-[var(--color-bg)] min-h-screen">
      <Navbar />

      <div className="pt-24 pb-16 px-6 max-w-3xl mx-auto">
        {/* Page header */}
        <header className="mb-12">
          <p className="text-xs font-mono font-medium tracking-widest uppercase mb-3 text-[var(--color-primary)]">
            Release History
          </p>
          <h1 className="text-4xl font-bold mb-3 text-[var(--color-text)] font-[Syne,sans-serif]">
            Changelog
          </h1>
          <p className="text-base max-w-xl text-[var(--color-text-muted)]">
            All notable changes to LLM Knowledge Base are documented here.
          </p>
        </header>

        {/* Changelog entries */}
        <section aria-label="Changelog entries">
          <ol className="list-none space-y-10">
            {CHANGELOG.map((entry) => (
              <li
                key={entry.version}
                className="rounded-lg p-6 border bg-[var(--color-surface)] border-[var(--color-border)]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm font-mono font-semibold px-2 py-0.5 rounded bg-[var(--color-panel-bg-alt)] text-[var(--color-primary)]">
                    v{entry.version}
                  </span>
                  <time
                    dateTime={entry.date}
                    className="text-sm text-[var(--color-text-muted)]"
                  >
                    {entry.date}
                  </time>
                </div>
                <ul className="list-none space-y-2">
                  {entry.changes.map((change, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"
                    >
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[var(--color-secondary)]"
                        aria-hidden="true"
                      />
                      {change}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  )
}
