// Supabase client — server-only.
// Do NOT import this file in client components or pages that run in the browser.
// Use NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for the
// public (browser-safe) client; use SUPABASE_SERVICE_ROLE_KEY only in
// server-side code and never expose it to the client.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazily-initialised singleton — the client is created on first use so that
// the module can be imported during the Next.js build without throwing when
// env vars are not yet set (they are injected at runtime on Vercel).
let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Copy .env.example to .env.local and fill in your Supabase project credentials.'
    )
  }

  // The anon client respects Row Level Security — safe to use in server
  // components and Route Handlers.
  _client = createClient(supabaseUrl, supabaseAnonKey)
  return _client
}

// Convenience re-export for callers that want the client directly.
// Accessing this property triggers lazy initialisation.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
