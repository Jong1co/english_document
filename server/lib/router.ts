export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type Route<H> = { method: HttpMethod; path: string; handler: H }

export type RouteMatch<H> =
  | { kind: 'found'; handler: H; params: Record<string, string> }
  | { kind: 'method-not-allowed' }
  | { kind: 'not-found' }

function segments(path: string): string[] {
  return path.split('/').filter(Boolean)
}

function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const expected = segments(pattern)
  const actual = segments(pathname)
  if (expected.length !== actual.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < expected.length; i++) {
    const part = expected[i]
    if (part.startsWith(':')) {
      try {
        params[part.slice(1)] = decodeURIComponent(actual[i])
      } catch {
        return null
      }
    } else if (part !== actual[i]) {
      return null
    }
  }
  return params
}

/** Path patterns use `:name` segments, e.g. `/api/sentences/:id`. */
export function matchRoute<H>(routes: readonly Route<H>[], method: string, pathname: string): RouteMatch<H> {
  let pathMatched = false
  for (const route of routes) {
    const params = matchPath(route.path, pathname)
    if (!params) continue
    if (route.method === method) return { kind: 'found', handler: route.handler, params }
    pathMatched = true
  }
  return pathMatched ? { kind: 'method-not-allowed' } : { kind: 'not-found' }
}
