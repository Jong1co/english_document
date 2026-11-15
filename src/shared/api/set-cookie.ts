import { parseSetCookie, type SetCookie } from 'cookie'

export type CookieToSet = { name: string; value: string; options: Omit<SetCookie, 'name' | 'value'> }

// Printable ASCII except `;` and `=` — what a Cookie header can carry.
const COOKIE_NAME = /^[!-:<>-~]+$/

/**
 * Cookie header carrying `cookies` to the BE. Values are URI-encoded (the BE decodes them).
 * Cookies with names a header can't carry are skipped rather than failing the whole request.
 */
export function toCookieHeader(cookies: { name: string; value: string }[]): string {
  return cookies
    .filter(({ name }) => COOKIE_NAME.test(name))
    .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
    .join('; ')
}

/** The `Set-Cookie` headers of a BE response, ready for Next's cookie APIs. */
export function readSetCookies(response: Response): CookieToSet[] {
  return response.headers.getSetCookie().map((header) => {
    const { name, value, ...options } = parseSetCookie(header)
    const defined = Object.fromEntries(Object.entries(options).filter(([, option]) => option !== undefined))
    return { name, value: value ?? '', options: defined }
  })
}
