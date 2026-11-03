import { describe, expect, it } from 'vitest'
import { parseSentenceForm, parseSourceForm } from './schema'

function fd(values: Record<string, string>): FormData {
  const form = new FormData()
  for (const [key, value] of Object.entries(values)) form.set(key, value)
  return form
}

describe('parseSentenceForm', () => {
  it('trims fields and turns empty optionals into null', () => {
    expect(parseSentenceForm(fd({ sentence: ' Hi ', meaning: ' 안녕 ', description: '', sourceId: '' }))).toEqual({
      ok: true,
      data: { sentence: 'Hi', meaning: '안녕', description: null, sourceId: null },
    })
  })
  it('accepts a missing description and sourceId', () => {
    expect(parseSentenceForm(fd({ sentence: 'a', meaning: 'b' }))).toEqual({
      ok: true,
      data: { sentence: 'a', meaning: 'b', description: null, sourceId: null },
    })
  })
  it('keeps a valid source id', () => {
    const id = '00000000-0000-4000-8000-000000000001'
    const result = parseSentenceForm(fd({ sentence: 'a', meaning: 'b', sourceId: id }))
    expect(result.ok && result.data.sourceId).toBe(id)
  })
  it('rejects whitespace-only sentence and meaning with Korean messages', () => {
    const result = parseSentenceForm(fd({ sentence: '   ', meaning: '\n', description: '', sourceId: '' }))
    expect(result).toEqual({
      ok: false,
      fieldErrors: { sentence: '문장을 입력하세요.', meaning: '뜻을 입력하세요.' },
    })
  })
  it('rejects a malformed source id', () => {
    const result = parseSentenceForm(fd({ sentence: 'a', meaning: 'b', sourceId: 'not-a-uuid' }))
    expect(result.ok).toBe(false)
    expect(!result.ok && result.fieldErrors.sourceId).toBeTruthy()
  })
  it('rejects a sentence longer than 1000 characters', () => {
    const result = parseSentenceForm(fd({ sentence: 'a'.repeat(1001), meaning: 'b' }))
    expect(result.ok).toBe(false)
    expect(!result.ok && result.fieldErrors.sentence).toBeTruthy()
  })
  it('rejects a description longer than 5000 characters', () => {
    expect(parseSentenceForm(fd({ sentence: 'a', meaning: 'b', description: 'x'.repeat(5001) })).ok).toBe(false)
  })
})

describe('parseSourceForm', () => {
  it('rejects non-http urls', () => {
    const result = parseSourceForm(fd({ type: 'web', title: 'Blog', url: 'ftp://x' }))
    expect(result.ok).toBe(false)
    expect(!result.ok && result.fieldErrors.url).toBeTruthy()
  })
  it('trims the title and turns an empty url into null', () => {
    expect(parseSourceForm(fd({ type: 'youtube', title: ' 영상 ', url: '' }))).toEqual({
      ok: true,
      data: { type: 'youtube', title: '영상', url: null },
    })
  })
  it('accepts an https url', () => {
    expect(parseSourceForm(fd({ type: 'web', title: 'Blog', url: 'https://example.com/a' }))).toEqual({
      ok: true,
      data: { type: 'web', title: 'Blog', url: 'https://example.com/a' },
    })
  })
  it('rejects an unknown type and a blank title', () => {
    const result = parseSourceForm(fd({ type: 'podcast', title: '  ' }))
    expect(result.ok).toBe(false)
    expect(!result.ok && Object.keys(result.fieldErrors).sort()).toEqual(['title', 'type'])
  })
})
