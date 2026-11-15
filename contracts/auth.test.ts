import { describe, expect, it } from 'vitest'
import { canManageMembers, canManageSentences, isRole, parseSignUpRequest } from './auth'

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

describe('isRole', () => {
  it('accepts known roles only', () => {
    expect(isRole('editor')).toBe(true)
    expect(isRole('owner')).toBe(false)
    expect(isRole(undefined)).toBe(false)
  })
})

describe('parseSignUpRequest', () => {
  it('trims name and email', () => {
    expect(parseSignUpRequest({ name: ' 새 사용자 ', email: ' a@b.c ', password: 'password1' })).toEqual({
      ok: true,
      data: { name: '새 사용자', email: 'a@b.c', password: 'password1' },
    })
  })
  it('asks for name and email before checking the password', () => {
    const result = parseSignUpRequest({ name: ' ', email: '', password: 'short' })
    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        name: '이름과 이메일을 입력하세요.',
        email: '이름과 이메일을 입력하세요.',
        password: '비밀번호는 8자 이상이어야 합니다.',
      },
    })
  })
})
