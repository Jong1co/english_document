import { z } from 'zod'
import { parseWith, text } from './common'

export const ROLES = ['pending', 'editor', 'admin'] as const

export type Role = (typeof ROLES)[number]

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

export function canManageSentences(role: Role): boolean {
  return role === 'editor' || role === 'admin'
}

export function canManageMembers(role: Role): boolean {
  return role === 'admin'
}

export const MIN_PASSWORD_LENGTH = 8

/** The signed-in user. A user without a profile row has the `pending` role. */
export type UserDto = {
  id: string
  email: string
  name: string | null
  role: Role
}

/** GET /api/auth/me */
export type MeResponse = { user: UserDto | null }

/** GET /api/auth/session — refreshes the session cookie as a side effect. */
export type SessionResponse = { signedIn: boolean }

/** POST /api/auth/sign-in */
export type SignInRequest = { email: string; password: string }
export type SignInResponse = { user: UserDto }

/** POST /api/auth/sign-up */
export type SignUpRequest = { name: string; email: string; password: string }
export type SignUpResponse = { status: 'signed-in' | 'confirmation-required' }

const signInSchema = z.object({
  email: text(z.string().trim()),
  password: text(z.string()),
})

const EMPTY_NAME_OR_EMAIL = '이름과 이메일을 입력하세요.'

const signUpSchema = z.object({
  name: text(z.string().trim().min(1, EMPTY_NAME_OR_EMAIL)),
  email: text(z.string().trim().min(1, EMPTY_NAME_OR_EMAIL)),
  password: text(
    z.string().min(MIN_PASSWORD_LENGTH, `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`),
  ),
})

export function parseSignInRequest(raw: unknown) {
  return parseWith<SignInRequest>(signInSchema, raw)
}

export function parseSignUpRequest(raw: unknown) {
  return parseWith<SignUpRequest>(signUpSchema, raw)
}
