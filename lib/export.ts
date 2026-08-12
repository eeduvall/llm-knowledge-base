// ---------------------------------------------------------------------------
// CSV Export Utility
// ---------------------------------------------------------------------------
// Browser-only: triggers a file download.
// Do NOT import this in Server Components or Route Handlers.
// ---------------------------------------------------------------------------

import type { Model } from './models'

/**
 * Flatten a Model record into a plain object of string values for CSV export.
 */
function flattenModel(model: Model): Record<string, string> {
  return {
    id: model.id,
    name: model.name,
    provider: model.provider,
    family: model.family,
    release_date: model.release_date,
    context_window: String(model.context_window),
    modalities: model.modalities.join('; '),
    capabilities: model.capabilities.join('; '),
    input_price_per_1m: model.pricing.input !== null ? String(model.pricing.input) : '',
    output_price_per_1m: model.pricing.output !== null ? String(model.pricing.output) : '',
    mmlu: model.benchmarks.mmlu !== null ? String(model.benchmarks.mmlu) : '',
    humaneval: model.benchmarks.humaneval !== null ? String(model.benchmarks.humaneval) : '',
    mt_bench: model.benchmarks.mt_bench !== null ? String(model.benchmarks.mt_bench) : '',
    strengths: model.strengths.join('; '),
    weaknesses: model.weaknesses.join('; '),
    license: model.license,
    docs: model.links.docs ?? '',
    paper: model.links.paper ?? '',
    last_verified: model.last_verified ?? '',
  }
}

/**
 * Escape a CSV cell value: wrap in quotes if it contains commas, quotes, or newlines.
 */
function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Convert an array of flat objects to a CSV string.
 */
function toCsvString(rows: Record<string, string>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const headerRow = headers.map(escapeCsvCell).join(',')
  const dataRows = rows.map((row) =>
    headers.map((h) => escapeCsvCell(row[h] ?? '')).join(',')
  )
  return [headerRow, ...dataRows].join('\n')
}

/**
 * Trigger a browser download of the comparison data as a CSV file.
 * @param models - The models to export.
 * @param filename - Optional filename (without extension). Defaults to timestamped name.
 */
export function exportComparisonAsCSV(models: Model[], filename?: string): void {
  const rows = models.map(flattenModel)
  const csv = toCsvString(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const timestamp = new Date().toISOString().slice(0, 10)
  const name = filename ?? `llm-comparison-${timestamp}`

  const link = document.createElement('a')
  link.href = url
  link.download = `${name}.csv`
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
