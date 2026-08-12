import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { loadModels } from '@/lib/models-server'
import type { Model } from '@/lib/models'

// ---------------------------------------------------------------------------
// Response type
// ---------------------------------------------------------------------------

export type CompareResponse = {
  models: Model[]
}

// ---------------------------------------------------------------------------
// Query param schema
// ---------------------------------------------------------------------------

const QuerySchema = z.object({
  ids: z.string().min(1, 'At least one model ID is required'),
})

// ---------------------------------------------------------------------------
// GET /api/models/compare?ids=gpt-4o,claude-3-5-sonnet
// Returns the full Model records for the requested IDs.
// Returns 400 if any requested ID is not found.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl
  const rawParams = { ids: searchParams.get('ids') ?? '' }

  const parsed = QuerySchema.safeParse(rawParams)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const requestedIds = parsed.data.ids
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (requestedIds.length === 0) {
    return NextResponse.json(
      { error: 'At least one model ID is required' },
      { status: 400 }
    )
  }

  if (requestedIds.length > 5) {
    return NextResponse.json(
      { error: 'Maximum of 5 models can be compared at once' },
      { status: 400 }
    )
  }

  try {
    const allModels = loadModels()
    const modelMap = new Map(allModels.map((m) => [m.id, m]))

    const missing = requestedIds.filter((id) => !modelMap.has(id))
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Unknown model IDs: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    const models = requestedIds.map((id) => modelMap.get(id)!)
    const response: CompareResponse = { models }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
