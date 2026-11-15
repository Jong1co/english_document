import { describe, expect, it } from 'vitest'
import { homePathFor } from './roles'

describe('homePathFor', () => {
  it('sends pending users to /pending', () => {
    expect(homePathFor('pending')).toBe('/pending')
  })
  it('sends managers to /sentences', () => {
    expect(homePathFor('editor')).toBe('/sentences')
    expect(homePathFor('admin')).toBe('/sentences')
  })
})
