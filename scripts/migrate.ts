/**
 * scripts/migrate.ts
 *
 * Runs all SQL migration files in lib/db/migrations/ against your Supabase
 * PostgreSQL database in order.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/migrate.ts
 *
 * Required env vars (set in .env.local or export before running):
 *   NEXT_PUBLIC_SUPABASE_URL      — your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY     — service-role key (never expose to browser)
 *
 * The script uses the service-role key so it can bypass RLS and run DDL.
 * Never run this in a browser context.
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Env validation
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    '❌  Missing required env vars.\n' +
      '    Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n' +
      '    in .env.local or export them before running this script.',
  )
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Supabase admin client (service-role — server-only)
// ---------------------------------------------------------------------------

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

// ---------------------------------------------------------------------------
// Migration runner
// ---------------------------------------------------------------------------

const MIGRATIONS_DIR = path.join(__dirname, '..', 'lib', 'db', 'migrations')

async function runMigrations(): Promise<void> {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort() // lexicographic order: 001_, 002_, 002b_, …

  if (files.length === 0) {
    console.log('ℹ️  No migration files found in', MIGRATIONS_DIR)
    return
  }

  console.log(`🔍  Found ${files.length} migration file(s):\n`)

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file)
    const sql = fs.readFileSync(filePath, 'utf8').trim()

    if (!sql) {
      console.log(`  ⏭  ${file} — empty, skipping`)
      continue
    }

    console.log(`  ▶  Running ${file} …`)

    // Supabase JS client does not expose a raw SQL execution method on the
    // public API.  We use the PostgREST RPC endpoint via the REST API instead.
    // For DDL migrations the recommended approach is to use the Supabase
    // Dashboard SQL editor or the Supabase CLI (`supabase db push`).
    //
    // Here we call the `exec_sql` RPC function which must be created once in
    // your Supabase project (see the note below).  If you prefer, replace this
    // with the Supabase CLI workflow described in the README.
    const { error } = await supabase.rpc('exec_sql', { sql_text: sql })

    if (error) {
      console.error(`  ❌  ${file} failed:`, error.message)
      process.exit(1)
    }

    console.log(`  ✅  ${file} — done`)
  }

  console.log('\n🎉  All migrations applied successfully.')
}

runMigrations().catch((err: unknown) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
