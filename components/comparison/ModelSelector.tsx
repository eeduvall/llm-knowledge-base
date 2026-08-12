'use client'

import { useState, useCallback } from 'react'
import type { Model } from '@/lib/models'
import { getProviderColor } from '@/lib/models'

const MAX_MODELS = 5

type Props = {
  allModels: Model[]
  selectedIds: string[]
  onAdd: (id: string) => void
  onRemove: (id: string) => void
}

export function ModelSelector({ allModels, selectedIds, onAdd, onRemove }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = allModels.filter((m) => {
    const q = query.toLowerCase()
    return (
      m.name.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q) ||
      m.family.toLowerCase().includes(q)
    )
  })

  const selectedModels = allModels.filter((m) => selectedIds.includes(m.id))
  const atMax = selectedIds.length >= MAX_MODELS

  const handleSelect = useCallback(
    (id: string) => {
      if (!selectedIds.includes(id) && !atMax) {
        onAdd(id)
      }
      setQuery('')
      setOpen(false)
    },
    [selectedIds, atMax, onAdd]
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Selected model chips */}
      {selectedModels.length > 0 && (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Selected models">
          {selectedModels.map((model) => {
            const color = getProviderColor(model.provider)
            return (
              <div
                key={model.id}
                role="listitem"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                style={{ background: `${color}18`, border: `1px solid ${color}44`, color: 'var(--color-text)' }}
              >
                <span style={{ color }}>{model.provider}</span>
                <span className="font-medium">{model.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(model.id)}
                  className="ml-1 rounded-full w-4 h-4 flex items-center justify-center text-xs transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label={`Remove ${model.name}`}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <input
            type="search"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label="Search models to compare"
            placeholder={atMax ? `Maximum ${MAX_MODELS} models selected` : 'Search models to add…'}
            disabled={atMax}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
            style={{ color: 'var(--color-text-faint)' }}
          >
            {selectedIds.length}/{MAX_MODELS}
          </span>
        </div>

        {/* Dropdown */}
        {open && !atMax && (
          <ul
            role="listbox"
            aria-label="Model search results"
            className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden shadow-xl max-h-64 overflow-y-auto"
            style={{ background: 'var(--color-nav-bg)', border: '1px solid var(--color-border)' }}
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-faint)' }}>
                No models found
              </li>
            ) : (
              filtered.map((model) => {
                const isSelected = selectedIds.includes(model.id)
                const color = getProviderColor(model.provider)
                return (
                  <li key={model.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={isSelected}
                      onClick={() => handleSelect(model.id)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2"
                      style={{
                        background: isSelected ? 'var(--color-panel-bg-alt)' : 'transparent',
                        color: 'var(--color-text)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                      }}
                    >
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                      >
                        {model.provider}
                      </span>
                      <span className="font-medium text-sm">{model.name}</span>
                      <span className="ml-auto text-xs" style={{ color: 'var(--color-text-faint)' }}>
                        {model.family}
                      </span>
                      {isSelected && (
                        <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>✓</span>
                      )}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        )}
      </div>

      {atMax && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Maximum of {MAX_MODELS} models reached. Remove a model to add another.
        </p>
      )}
    </div>
  )
}
