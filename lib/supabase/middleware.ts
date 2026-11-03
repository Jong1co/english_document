import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './database.types'

const AUTH_PATHS = ['/login', '/signup']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const isSignedIn = Boolean(data?.claims)
  const isAuthPath = AUTH_PATHS.includes(request.nextUrl.pathname)

  if (!isSignedIn && !isAuthPath) {
    return redirectKeepingCookies(request, supabaseResponse, '/login')
  }
  if (isSignedIn && isAuthPath) {
    return redirectKeepingCookies(request, supabaseResponse, '/sentences')
  }

  // IMPORTANT: return supabaseResponse as-is so refreshed auth cookies reach the browser.
  return supabaseResponse
}

function redirectKeepingCookies(request: NextRequest, from: NextResponse, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''
  const response = NextResponse.redirect(url)
  from.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
  return response
}
