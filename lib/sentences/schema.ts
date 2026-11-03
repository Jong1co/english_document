import { z } from 'zod'
import type { Database } from '@/lib/supabase/database.types'

export type SourceType = Database['public']['Enums']['source_type']

export const SOURCE_TYPES = ['manual', 'web', 'youtube', 'document'] as const satisfies readonly SourceType[]

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  manual: '직접 입력',
  web: '웹',
  youtube: '유튜브',
  document: '문서',
}

export type SentenceInput = {
  sentence: string
  meaning: string
  description: string | null
  sourceId: string | null
}

export type SourceInput = {
  type: SourceType
  title: string
  url: string | null
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>

type ParseResult<T> = { ok: true; data: T } | { ok: false; fieldErrors: FieldErrors<T> }

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Any 8-4-4-4-12 hex string, matching what Postgres accepts for uuid. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

const emptyToNull = (value: string) => (value === '' ? null : value)

const sentenceSchema = z.object({
  sentence: z.string().trim().min(1, '문장을 입력하세요.').max(1000, '문장은 1000자 이하로 입력하세요.'),
  meaning: z.string().trim().min(1, '뜻을 입력하세요.').max(1000, '뜻은 1000자 이하로 입력하세요.'),
  description: z.string().trim().max(5000, '설명은 5000자 이하로 입력하세요.').transform(emptyToNull),
  sourceId: z
    .string()
    .trim()
    .refine((value) => value === '' || isUuid(value), '출처를 다시 선택하세요.')
    .transform(emptyToNull),
})

const sourceSchema = z.object({
  type: z.enum(SOURCE_TYPES, { error: '출처 유형을 선택하세요.' }),
  title: z.string().trim().min(1, '출처 제목을 입력하세요.').max(200, '출처 제목은 200자 이하로 입력하세요.'),
  url: z
    .string()
    .trim()
    .refine((value) => value === '' || isHttpUrl(value), 'http:// 또는 https:// 주소를 입력하세요.')
    .transform(emptyToNull),
})

function text(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

function parse<T>(schema: z.ZodType<T>, raw: Record<string, string>): ParseResult<T> {
  const result = schema.safeParse(raw)
  if (result.success) return { ok: true, data: result.data }
  const fieldErrors: FieldErrors<T> = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof T
    fieldErrors[key] ??= issue.message
  }
  return { ok: false, fieldErrors }
}

export function parseSentenceForm(formData: FormData): ParseResult<SentenceInput> {
  return parse(sentenceSchema, {
    sentence: text(formData, 'sentence'),
    meaning: text(formData, 'meaning'),
    description: text(formData, 'description'),
    sourceId: text(formData, 'sourceId'),
  })
}

export function parseSourceForm(formData: FormData): ParseResult<SourceInput> {
  return parse(sourceSchema, {
    type: text(formData, 'type'),
    title: text(formData, 'title'),
    url: text(formData, 'url'),
  })
}
