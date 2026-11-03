import { describe, expect, it } from 'vitest'
import { escapeLike, pageRange, parseListParams } from './search'

describe('escapeLike', () => {
  it('escapes LIKE wildcards and backslash so they match literally', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\')
  })
  it('leaves ordinary text alone', () => {
    expect(escapeLike('Did you sleep well?')).toBe('Did you sleep well?')
  })
})

describe('parseListParams', () => {
  it('defaults to empty query and page 1', () => {
    expect(parseListParams({})).toEqual({ q: '', page: 1 })
  })
  it('trims the query and reads the page', () => {
    expect(parseListParams({ q: '  hello ', page: '3' })).toEqual({ q: 'hello', page: 3 })
  })
  it('uses the first value when params repeat', () => {
    expect(parseListParams({ q: ['a', 'b'], page: ['2', '5'] })).toEqual({ q: 'a', page: 2 })
  })
  it.each(['abc', '-1', '0', '1.5', ''])('falls back to page 1 for %j', (bad) => {
    expect(parseListParams({ page: bad }).page).toBe(1)
  })
})

describe('pageRange', () => {
  it('maps a page to an inclusive row range of 20', () => {
    expect(pageRange(1)).toEqual({ from: 0, to: 19 })
    expect(pageRange(3)).toEqual({ from: 40, to: 59 })
  })
})
