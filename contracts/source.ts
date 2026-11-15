import { z } from 'zod'
import { emptyToNull, parseWith, text } from './common'

export const SOURCE_TYPES = ['manual', 'web', 'youtube', 'document'] as const

export type SourceType = (typeof SOURCE_TYPES)[number]

export type SourceDto = {
  id: string
  type: SourceType
  title: string
  url: string | null
}

/** GET /api/sources */
export type SourceListResponse = { items: SourceDto[] }

/** POST /api/sources — body as the form sends it. */
export type SourceRequest = { type: string; title: string; url: string }

/** Validated SourceRequest. */
export type SourceInput = { type: SourceType; title: string; url: string | null }

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

const sourceSchema = z.object({
  type: text(z.enum(SOURCE_TYPES, { error: '출처 유형을 선택하세요.' })),
  title: text(
    z.string().trim().min(1, '출처 제목을 입력하세요.').max(200, '출처 제목은 200자 이하로 입력하세요.'),
  ),
  url: text(
    z
      .string()
      .trim()
      .refine((value) => value === '' || isHttpUrl(value), 'http:// 또는 https:// 주소를 입력하세요.')
      .transform(emptyToNull),
  ),
})

export function parseSourceRequest(raw: unknown) {
  return parseWith<SourceInput>(sourceSchema, raw)
}
