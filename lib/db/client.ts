// Supabase client — server-only.
// Do NOT import this file in client components or pages that run in the browser.
// Use NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for the
// public (browser-safe) client; use SUPABASE_SERVICE_ROLE_KEY only in
// server-side code and never expose it to the client.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // In production this is a hard error; during local dev without a DB the
  // YAML fallback in lib/models-server.ts is used instead.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }
}

// The anon client respects Row Level Security — safe to use in server
// components and Route Handlers.
export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? ''
)
