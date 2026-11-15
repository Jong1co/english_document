import { describe, expect, it } from 'vitest'
import { readSetCookies, toCookieHeader } from './set-cookie'

describe('readSetCookies', () => {
  it('parses every Set-Cookie header with its options', () => {
    const headers = new Headers()
    headers.append('set-cookie', 'sb-token=base64-abc%25%3D; Max-Age=60; Path=/; SameSite=Lax')
    headers.append('set-cookie', 'sb-token.1=; Max-Age=0; Path=/')

    expect(readSetCookies(new Response(null, { headers }))).toEqual([
      { name: 'sb-token', value: 'base64-abc%=', options: { maxAge: 60, path: '/', sameSite: 'lax' } },
      { name: 'sb-token.1', value: '', options: { maxAge: 0, path: '/' } },
    ])
  })

  it('returns nothing when the response sets no cookies', () => {
    expect(readSetCookies(new Response(null))).toEqual([])
  })
})

describe('toCookieHeader', () => {
  it('encodes values so the BE can decode them', () => {
    expect(toCookieHeader([{ name: 'a', value: 'x y' }, { name: 'b', value: '1' }])).toBe('a=x%20y; b=1')
  })
  it('skips cookies whose names a header cannot carry', () => {
    expect(toCookieHeader([{ name: 'bad name', value: 'x' }, { name: 'ok', value: 'y' }])).toBe('ok=y')
  })
  it('is empty without cookies', () => {
    expect(toCookieHeader([])).toBe('')
  })
})
