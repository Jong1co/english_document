import { stringifySetCookie, type SetCookie } from 'cookie'

type CookieToSet = { name: string; value: string; options: Omit<SetCookie, 'name' | 'value'> }

/**
 * Collects cookies (and cache headers) written while handling one request, then
 * attaches them to the outgoing response as `Set-Cookie`.
 */
export class CookieJar {
  private readonly cookies: CookieToSet[] = []
  private readonly headers: Record<string, string> = {}

  set(cookies: CookieToSet[], headers: Record<string, string> = {}): void {
    this.cookies.push(...cookies)
    Object.assign(this.headers, headers)
  }

  applyTo(response: Response): Response {
    if (this.cookies.length === 0 && Object.keys(this.headers).length === 0) return response

    const headers = new Headers(response.headers)
    for (const [name, value] of Object.entries(this.headers)) headers.set(name, value)
    for (const { name, value, options } of this.cookies) {
      headers.append('set-cookie', stringifySetCookie(name, value, options))
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  }
}
