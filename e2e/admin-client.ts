import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/supabase/database.types'
import { getLocalSupabaseEnv } from './local-env'

/** Service-role client for the LOCAL Supabase only (getLocalSupabaseEnv refuses remote hosts). */
export function createAdminClient() {
  const { url, secretKey } = getLocalSupabaseEnv()
  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
