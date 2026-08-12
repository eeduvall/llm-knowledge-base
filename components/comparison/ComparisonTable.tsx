'use client'

import type { ComparisonRow } from '@/lib/comparison'
import { BENCHMARK_LABELS, BENCHMARK_MAX } from '@/lib/comparison'
import type { BenchmarkKey } from '@/lib/comparison'
import { getProviderColor } from '@/lib/models'

type Props = {
  rows: ComparisonRow[]
}

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`
  return String(tokens)
}

function formatPrice(price: number | null): string {
  if (price === null) return '—'
  return `$${price.toFixed(2)}`
}

type CellStyle = {
  color: string
  fontWeight?: string
}

function highlightStyle(isBest: boolean, isWorst: boolean, value: number | null): CellStyle {
  if (value === null) return { color: 'var(--color-text-faint)' }
  if (isBest) return { color: 'var(--color-secondary)', fontWeight: '600' }
  if (isWorst) return { color: 'var(--color-accent)' }
  return { color: 'var(--color-text)' }
}

function BenchmarkBar({ value, max, isBest, isWorst }: { value: number | null; max: number; isBest: boolean; isWorst: boolean }) {
  if (value === null) return <span style={{ color: 'var(--color-text-faint)' }}>—</span>
  const pct = Math.min(100, (value / max) * 100)
  const barColor = isBest ? 'var(--color-secondary)' : isWorst ? 'var(--color-accent)' : 'var(--color-primary)'
  return (
    <div className="flex flex-col gap-1">
      <span style={highlightStyle(isBest, isWorst, value)}>
        {value}
        {isBest && <span className="ml-1 text-xs">👑</span>}
      </span>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)', width: '100%' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  )
}

export function ComparisonTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
        Select at least one model to compare.
      </p>
    )
  }

  const benchmarkKeys: BenchmarkKey[] = ['mmlu', 'humaneval', 'mt_bench']

  return (
    <div className="w-full overflow-x-auto rounded-xl" style={{ border: '1px solid var(--color-border)' }}>
      <table className="w-full border-collapse text-sm" style={{ minWidth: `${Math.max(600, rows.length * 200)}px` }}>
        <thead>
          <tr style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
            {/* Row label column */}
            <th
              className="text-left px-5 py-4 font-semibold text-xs uppercase tracking-widest sticky left-0 z-10"
              style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface)', minWidth: '160px' }}
            >
              Field
            </th>
            {rows.map(({ model }) => {
              const providerColor = getProviderColor(model.provider)
              return (
                <th
                  key={model.id}
                  className="px-5 py-4 text-left"
                  style={{ minWidth: '180px', borderLeft: '1px solid var(--color-border)' }}
                >
                  <div className="flex flex-col gap-1">
                    <span
                      className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full self-start"
                      style={{ background: `${providerColor}22`, color: providerColor, border: `1px solid ${providerColor}44` }}
                    >
                      {model.provider}
                    </span>
                    <span className="font-bold text-base" style={{ color: 'var(--color-text)' }}>{model.name}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>{model.family}</span>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {/* ── Overview ── */}
          <SectionHeader label="Overview" colCount={rows.length} />

          <TableRow label="Release Date">
            {rows.map(({ model }) => (
              <td key={model.id} className="px-5 py-3" style={{ borderLeft: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                {model.release_date}
              </td>
            ))}
          </TableRow>

          <TableRow label="License">
            {rows.map(({ model }) => (
              <td key={model.id} className="px-5 py-3" style={{ borderLeft: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                {model.license}
              </td>
            ))}
          </TableRow>

          <TableRow label="Modalities">
            {rows.map(({ model }) => (
              <td key={model.id} className="px-5 py-3" style={{ borderLeft: '1px solid var(--color-border)' }}>
                <div className="flex flex-wrap gap-1">
                  {model.modalities.map((mod) => (
                    <span
                      key={mod}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </td>
            ))}
          </TableRow>

          {/* ── Context Window ── */}
          <SectionHeader label="Context" colCount={rows.length} />

          <TableRow label="Context Window">
            {rows.map(({ model, highlights }) => {
              const h = highlights.contextWindow
              return (
                <td key={model.id} className="px-5 py-3 font-mono" style={{ borderLeft: '1px solid var(--color-border)', ...highlightStyle(h.isBest, h.isWorst, h.value) }}>
                  {formatContextWindow(model.context_window)} tokens
                  {h.isBest && <span className="ml-1 text-xs">👑</span>}
                </td>
              )
            })}
          </TableRow>

          {/* ── Pricing ── */}
          <SectionHeader label="Pricing (per 1M tokens)" colCount={rows.length} />

          <TableRow label="Input Price">
            {rows.map(({ model, highlights }) => {
              const h = highlights.inputPrice
              return (
                <td key={model.id} className="px-5 py-3 font-mono" style={{ borderLeft: '1px solid var(--color-border)', ...highlightStyle(h.isBest, h.isWorst, h.value) }}>
                  {formatPrice(model.pricing.input)}
                  {h.isBest && model.pricing.input !== null && <span className="ml-1 text-xs">👑</span>}
                </td>
              )
            })}
          </TableRow>

          <TableRow label="Output Price">
            {rows.map(({ model, highlights }) => {
              const h = highlights.outputPrice
              return (
                <td key={model.id} className="px-5 py-3 font-mono" style={{ borderLeft: '1px solid var(--color-border)', ...highlightStyle(h.isBest, h.isWorst, h.value) }}>
                  {formatPrice(model.pricing.output)}
                  {h.isBest && model.pricing.output !== null && <span className="ml-1 text-xs">👑</span>}
                </td>
              )
            })}
          </TableRow>

          {/* ── Benchmarks ── */}
          <SectionHeader label="Benchmarks" colCount={rows.length} />

          {benchmarkKeys.map((key) => (
            <TableRow key={key} label={BENCHMARK_LABELS[key]}>
              {rows.map(({ model, highlights }) => {
                const h = highlights[key]
                return (
                  <td key={model.id} className="px-5 py-3" style={{ borderLeft: '1px solid var(--color-border)' }}>
                    <BenchmarkBar
                      value={model.benchmarks[key]}
                      max={BENCHMARK_MAX[key]}
                      isBest={h.isBest}
                      isWorst={h.isWorst}
                    />
                  </td>
                )
              })}
            </TableRow>
          ))}

          {/* ── Capabilities ── */}
          <SectionHeader label="Capabilities" colCount={rows.length} />

          <TableRow label="Capabilities">
            {rows.map(({ model }) => (
              <td key={model.id} className="px-5 py-3" style={{ borderLeft: '1px solid var(--color-border)' }}>
                <div className="flex flex-wrap gap-1">
                  {model.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(108,99,255,0.12)', color: 'var(--color-primary)', border: '1px solid rgba(108,99,255,0.25)' }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </td>
            ))}
          </TableRow>
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type SectionHeaderProps = { label: string; colCount: number }

function SectionHeader({ label, colCount }: SectionHeaderProps) {
  return (
    <tr style={{ background: 'var(--color-panel-bg-alt)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
      <td
        colSpan={colCount + 1}
        className="px-5 py-2 text-xs font-semibold uppercase tracking-widest sticky left-0"
        style={{ color: 'var(--color-primary)', background: 'var(--color-panel-bg-alt)' }}
      >
        {label}
      </td>
    </tr>
  )
}

type TableRowProps = { label: string; children: React.ReactNode }

function TableRow({ label, children }: TableRowProps) {
  return (
    <tr style={{ borderBottom: '1px solid var(--color-divider)' }}>
      <td
        className="px-5 py-3 text-xs font-medium sticky left-0 z-10"
        style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg)', minWidth: '160px', borderRight: '1px solid var(--color-border)' }}
      >
        {label}
      </td>
      {children}
    </tr>
  )
}
