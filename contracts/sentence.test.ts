import { describe, expect, it } from 'vitest'
import { parseSentenceRequest } from './sentence'

describe('parseSentenceRequest', () => {
  it('trims fields and turns empty optionals into null', () => {
    expect(parseSentenceRequest({ sentence: ' Hi ', meaning: ' 안녕 ', description: '', sourceId: '' })).toEqual({
      ok: true,
      data: { sentence: 'Hi', meaning: '안녕', description: null, sourceId: null },
    })
  })
  it('accepts a missing description and sourceId', () => {
    expect(parseSentenceRequest({ sentence: 'a', meaning: 'b' })).toEqual({
      ok: true,
      data: { sentence: 'a', meaning: 'b', description: null, sourceId: null },
    })
  })
  it('keeps a valid source id', () => {
    const id = '00000000-0000-4000-8000-000000000001'
    const result = parseSentenceRequest({ sentence: 'a', meaning: 'b', sourceId: id })
    expect(result.ok && result.data.sourceId).toBe(id)
  })
  it('rejects whitespace-only sentence and meaning with Korean messages', () => {
    const result = parseSentenceRequest({ sentence: '   ', meaning: '\n', description: '', sourceId: '' })
    expect(result).toEqual({
      ok: false,
      fieldErrors: { sentence: '문장을 입력하세요.', meaning: '뜻을 입력하세요.' },
    })
  })
  it('treats non-string fields as empty', () => {
    const result = parseSentenceRequest({ sentence: 42, meaning: null })
    expect(result).toEqual({
      ok: false,
      fieldErrors: { sentence: '문장을 입력하세요.', meaning: '뜻을 입력하세요.' },
    })
  })
  it('rejects a malformed source id', () => {
    const result = parseSentenceRequest({ sentence: 'a', meaning: 'b', sourceId: 'not-a-uuid' })
    expect(result.ok).toBe(false)
    expect(!result.ok && result.fieldErrors.sourceId).toBeTruthy()
  })
  it('rejects a sentence longer than 1000 characters', () => {
    const result = parseSentenceRequest({ sentence: 'a'.repeat(1001), meaning: 'b' })
    expect(result.ok).toBe(false)
    expect(!result.ok && result.fieldErrors.sentence).toBeTruthy()
  })
  it('rejects a description longer than 5000 characters', () => {
    expect(parseSentenceRequest({ sentence: 'a', meaning: 'b', description: 'x'.repeat(5001) }).ok).toBe(false)
  })
})
