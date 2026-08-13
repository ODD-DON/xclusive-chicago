import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Server-only client using the service role key. Bypasses Row Level
// Security entirely, so this must never be imported from a client
// component or exposed to the browser. Use for trusted server-side
// operations (API routes, server components) where RLS intentionally
// blocks the public anon role.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
