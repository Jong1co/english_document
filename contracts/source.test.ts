import { describe, expect, it } from 'vitest'
import { parseSourceRequest } from './source'

describe('parseSourceRequest', () => {
  it('rejects non-http urls', () => {
    const result = parseSourceRequest({ type: 'web', title: 'Blog', url: 'ftp://x' })
    expect(result.ok).toBe(false)
    expect(!result.ok && result.fieldErrors.url).toBeTruthy()
  })
  it('trims the title and turns an empty url into null', () => {
    expect(parseSourceRequest({ type: 'youtube', title: ' 영상 ', url: '' })).toEqual({
      ok: true,
      data: { type: 'youtube', title: '영상', url: null },
    })
  })
  it('accepts an https url', () => {
    expect(parseSourceRequest({ type: 'web', title: 'Blog', url: 'https://example.com/a' })).toEqual({
      ok: true,
      data: { type: 'web', title: 'Blog', url: 'https://example.com/a' },
    })
  })
  it('rejects an unknown type and a blank title', () => {
    const result = parseSourceRequest({ type: 'podcast', title: '  ' })
    expect(result.ok).toBe(false)
    expect(!result.ok && Object.keys(result.fieldErrors).sort()).toEqual(['title', 'type'])
  })
})
