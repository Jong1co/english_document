import { NextResponse, type NextRequest } from 'next/server'
import type { SessionResponse } from '@contracts/auth'
import { fetchBackend } from '@/shared/api/backend'
import { readSetCookies } from '@/shared/api/set-cookie'
import { ROUTES } from '@/shared/config/routes'

const AUTH_PATHS: string[] = [ROUTES.login, ROUTES.signup]

/** Refreshes the session cookie on every page request and keeps signed-out users on the auth pages. */
export async function proxy(request: NextRequest) {
  const backend = await fetchBackend('/api/auth/session', {
    headers: { cookie: request.headers.get('cookie') ?? '' },
  })
  const { signedIn } = backend.ok ? ((await backend.json()) as SessionResponse) : { signedIn: false }

  // Pass refreshed cookies both to this render (request) and to the browser (response).
  const refreshed = readSetCookies(backend)
  refreshed.forEach(({ name, value }) => request.cookies.set(name, value))
  const response = NextResponse.next({ request })
  refreshed.forEach(({ name, value, options }) => response.cookies.set(name, value, options))

  // Server Action POSTs can't follow an HTML redirect. Let them through: every action
  // re-checks the session and redirects in a way the client understands.
  if (request.headers.has('next-action')) {
    return response
  }

  const isAuthPath = AUTH_PATHS.includes(request.nextUrl.pathname)
  if (!signedIn && !isAuthPath) {
    return redirectKeepingCookies(request, response, ROUTES.login)
  }
  if (signedIn && isAuthPath) {
    return redirectKeepingCookies(request, response, ROUTES.sentences)
  }

  // Return the response as-is so refreshed auth cookies reach the browser.
  return response
}

function redirectKeepingCookies(request: NextRequest, from: NextResponse, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''
  const response = NextResponse.redirect(url)
  from.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
  return response
}

export const config = {
  // /api/* is the BE: it checks the session itself and answers 401 instead of redirecting.
  matcher: ['/((?!api(?:/|$)|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
