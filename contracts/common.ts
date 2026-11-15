import { z } from 'zod'

/**
 * FE ↔ BE 공통 계약.
 * 이 폴더는 zod 외의 어떤 런타임에도 의존하지 않는다 (Next, React, Supabase 금지).
 */

export const ERROR_CODES = [
  'BAD_REQUEST',
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'INVALID_CREDENTIALS',
  'FORBIDDEN',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'CONFLICT',
  'INTERNAL',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

export type FieldErrors<T> = Partial<Record<keyof T, string>>

/** 모든 4xx/5xx 응답의 본문. `message`는 사용자에게 그대로 보여줄 수 있는 한국어 문장이다. */
export type ApiErrorBody = {
  error: {
    code: ErrorCode
    message: string
    fieldErrors?: Record<string, string>
  }
}

export type ParseResult<T> = { ok: true; data: T } | { ok: false; fieldErrors: FieldErrors<T> }

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Any 8-4-4-4-12 hex string, matching what Postgres accepts for uuid. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

/** Reads a body field as a string, the way a form would send it: a missing or non-string value becomes ''. */
export function text<T extends z.ZodType>(schema: T) {
  return z.preprocess((value) => (typeof value === 'string' ? value : ''), schema)
}

export const emptyToNull = (value: string) => (value === '' ? null : value)

/** Validates `raw` and reports the first message per field. */
export function parseWith<T>(schema: z.ZodType<T>, raw: unknown): ParseResult<T> {
  const result = schema.safeParse(raw ?? {})
  if (result.success) return { ok: true, data: result.data }
  const fieldErrors: FieldErrors<T> = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof T
    fieldErrors[key] ??= issue.message
  }
  return { ok: false, fieldErrors }
}
