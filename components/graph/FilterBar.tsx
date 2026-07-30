'use client'

import { PROVIDER_COLORS } from '@/lib/models'

type Props = {
  providers: string[]
  activeProvider: string | null
  onSelect: (provider: string | null) => void
  searchQuery: string
  onSearch: (query: string) => void
}

export function FilterBar({
  providers,
  activeProvider,
  onSelect,
  searchQuery,
  onSearch,
}: Props) {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <label htmlFor="graph-search" className="sr-only">
          Search models
        </label>
        <input
          id="graph-search"
          type="search"
          placeholder="Search models…"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="w-52 px-3 py-2 text-sm text-white placeholder-white/30 rounded border outline-none focus:border-white/30 transition-colors duration-200"
          style={{
            backgroundColor: 'rgba(5,5,16,0.85)',
            borderColor: 'rgba(255,255,255,0.12)',
          }}
        />
      </div>

      {/* Provider filters */}
      <div
        role="group"
        aria-label="Filter by provider"
        className="flex flex-col gap-1.5"
      >
        <button
          onClick={() => onSelect(null)}
          aria-pressed={activeProvider === null}
          className="w-fit px-3 py-1 rounded text-xs font-mono font-medium transition-all duration-200"
          style={{
            backgroundColor:
              activeProvider === null
                ? 'rgba(108,99,255,0.25)'
                : 'rgba(255,255,255,0.05)',
            color: activeProvider === null ? '#6C63FF' : 'rgba(255,255,255,0.5)',
            border: `1px solid ${activeProvider === null ? 'rgba(108,99,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          All
        </button>
        {providers.map((provider) => {
          const color = PROVIDER_COLORS[provider] ?? '#6C63FF'
          const isActive = activeProvider === provider
          return (
            <button
              key={provider}
              onClick={() => onSelect(isActive ? null : provider)}
              aria-pressed={isActive}
              className="w-fit px-3 py-1 rounded text-xs font-mono font-medium capitalize transition-all duration-200"
              style={{
                backgroundColor: isActive
                  ? `${color}22`
                  : 'rgba(255,255,255,0.05)',
                color: isActive ? color : 'rgba(255,255,255,0.5)',
                border: `1px solid ${isActive ? color + '44' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {provider}
            </button>
          )
        })}
      </div>
    </div>
  )
}
