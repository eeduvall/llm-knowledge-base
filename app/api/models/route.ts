import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAllModels, getModelsByProvider, getModelsByCapability } from '@/lib/db/models'
import type { Model } from '@/lib/models'

// ---------------------------------------------------------------------------
// Response schema
// ---------------------------------------------------------------------------

const ModelsResponseSchema = z.object({
  models: z.array(z.unknown()),
  count: z.number(),
})

export type ModelsResponse = {
  models: Model[]
  count: number
}

// ---------------------------------------------------------------------------
// Query param schema
// ---------------------------------------------------------------------------

const QuerySchema = z.object({
  provider: z.string().optional(),
  capability: z.string().optional(),
})

// ---------------------------------------------------------------------------
// GET /api/models
// Query params:
//   ?provider=openai   — filter by provider slug
//   ?capability=vision — filter by capability tag
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl
  const rawParams = {
    provider: searchParams.get('provider') ?? undefined,
    capability: searchParams.get('capability') ?? undefined,
  }

  const parsed = QuerySchema.safeParse(rawParams)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { provider, capability } = parsed.data

  try {
    let models: Model[]

    if (provider !== undefined) {
      models = await getModelsByProvider(provider)
    } else if (capability !== undefined) {
      models = await getModelsByCapability(capability)
    } else {
      models = await getAllModels()
    }

    const response: ModelsResponse = { models, count: models.length }
    // Validate the shape before sending (belt-and-suspenders)
    ModelsResponseSchema.parse(response)

    return NextResponse.json(response)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
