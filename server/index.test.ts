import { describe, expect, it } from 'vitest'
import { handleApiRequest } from './index'
import { CookieJar } from './lib/cookie-jar'

describe('handleApiRequest', () => {
  it('answers unknown paths with a 404 error body', async () => {
    const response = await handleApiRequest(new Request('http://backend.internal/api/nope'))
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: { code: 'NOT_FOUND', message: '요청한 API가 없습니다.' } })
  })

  it('answers a known path with the wrong method with 405', async () => {
    const response = await handleApiRequest(new Request('http://backend.internal/api/sources', { method: 'DELETE' }))
    expect(response.status).toBe(405)
    expect((await response.json()).error.code).toBe('METHOD_NOT_ALLOWED')
  })
})

describe('CookieJar', () => {
  it('appends collected cookies and headers to the response', async () => {
    const jar = new CookieJar()
    jar.set([{ name: 'sb-token', value: 'a b', options: { path: '/', maxAge: 60 } }], { 'cache-control': 'private' })
    jar.set([{ name: 'sb-token.1', value: '', options: { path: '/', maxAge: 0 } }])

    const response = jar.applyTo(Response.json({ ok: true }, { status: 201 }))
    expect(response.status).toBe(201)
    expect(response.headers.get('cache-control')).toBe('private')
    expect(response.headers.getSetCookie()).toEqual([
      'sb-token=a%20b; Max-Age=60; Path=/',
      'sb-token.1=; Max-Age=0; Path=/',
    ])
    expect(await response.json()).toEqual({ ok: true })
  })

  it('returns the response untouched when nothing was set', () => {
    const response = new Response(null, { status: 204 })
    expect(new CookieJar().applyTo(response)).toBe(response)
  })
})
