import { describe, expect, it } from 'vitest'
import { matchRoute, type Route } from './router'

const routes: Route<string>[] = [
  { method: 'GET', path: '/api/sentences', handler: 'list' },
  { method: 'POST', path: '/api/sentences', handler: 'create' },
  { method: 'GET', path: '/api/sentences/:id', handler: 'get' },
]

describe('matchRoute', () => {
  it('matches static paths by method', () => {
    expect(matchRoute(routes, 'POST', '/api/sentences')).toEqual({ kind: 'found', handler: 'create', params: {} })
  })
  it('captures and decodes params', () => {
    expect(matchRoute(routes, 'GET', '/api/sentences/a%20b')).toEqual({
      kind: 'found',
      handler: 'get',
      params: { id: 'a b' },
    })
  })
  it('ignores a trailing slash', () => {
    expect(matchRoute(routes, 'GET', '/api/sentences/').kind).toBe('found')
  })
  it('reports a known path with the wrong method', () => {
    expect(matchRoute(routes, 'DELETE', '/api/sentences')).toEqual({ kind: 'method-not-allowed' })
  })
  it('reports unknown paths', () => {
    expect(matchRoute(routes, 'GET', '/api/sentences/1/extra')).toEqual({ kind: 'not-found' })
    expect(matchRoute(routes, 'GET', '/api/sentences/%E0%A4%A')).toEqual({ kind: 'not-found' })
  })
})
