import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getModelById } from '@/lib/db/models';
import type { Model } from '@/lib/models';

// ---------------------------------------------------------------------------
// Response schema
// ---------------------------------------------------------------------------

export type ModelResponse = {
  data: Model;
};

// ---------------------------------------------------------------------------
// Route params schema
// ---------------------------------------------------------------------------

const ParamsSchema = z.object({
  id: z.string().min(1),
});

// ---------------------------------------------------------------------------
// GET /api/models/[id]
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid model id', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = parsed.data;

  try {
    const model = getModelById(id);

    if (model === null) {
      return NextResponse.json({ error: `Model '${id}' not found` }, { status: 404 });
    }

    const response: ModelResponse = { data: model };
    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
