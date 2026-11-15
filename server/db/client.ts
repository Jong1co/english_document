import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import { getEnv } from '../config/env'
import type { CookieJar } from '../lib/cookie-jar'
import type { Database } from './database.types'

export type Db = ReturnType<typeof createServerClient<Database>>

/**
 * Supabase client acting as the caller: reads the session from the request's
 * Cookie header, so RLS applies with the caller's role. Refreshed or cleared
 * session cookies go into `jar` and reach the response.
 *
 * Create one per request — never share it between requests.
 */
export function createDb(request: Request, jar: CookieJar): Db {
  const { supabaseUrl, supabasePublishableKey } = getEnv()
  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('cookie') ?? '').map(({ name, value }) => ({
          name,
          value: value ?? '',
        }))
      },
      setAll(cookiesToSet, headers) {
        jar.set(cookiesToSet, headers)
      },
    },
  })
}
