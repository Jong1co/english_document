import { describe, expect, it } from 'vitest'
import { canManageMembers, canManageSentences, homePathFor } from './roles'

describe('canManageSentences', () => {
  it('allows admin and editor', () => {
    expect(canManageSentences('admin')).toBe(true)
    expect(canManageSentences('editor')).toBe(true)
  })
  it('denies pending', () => {
    expect(canManageSentences('pending')).toBe(false)
  })
})

describe('canManageMembers', () => {
  it('allows only admin', () => {
    expect(canManageMembers('admin')).toBe(true)
    expect(canManageMembers('editor')).toBe(false)
    expect(canManageMembers('pending')).toBe(false)
  })
})

describe('homePathFor', () => {
  it('sends pending users to /pending', () => {
    expect(homePathFor('pending')).toBe('/pending')
  })
  it('sends managers to /sentences', () => {
    expect(homePathFor('editor')).toBe('/sentences')
    expect(homePathFor('admin')).toBe('/sentences')
  })
})
