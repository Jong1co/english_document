import { z } from 'zod'
import { emptyToNull, isUuid, parseWith, text } from './common'
import type { SourceDto } from './source'

export type SentenceDto = {
  id: string
  sentence: string
  meaning: string
  description: string | null
  createdAt: string
  updatedAt: string
  source: SourceDto | null
}

/** GET /api/sentences?q=&page= — `q` and `page` are echoed back normalized. */
export type SentenceListResponse = {
  items: SentenceDto[]
  total: number
  q: string
  page: number
  pageSize: number
}

/** POST /api/sentences, PUT /api/sentences/:id — body as the form sends it. */
export type SentenceRequest = {
  sentence: string
  meaning: string
  description: string
  sourceId: string
}

/** Validated SentenceRequest. */
export type SentenceInput = {
  sentence: string
  meaning: string
  description: string | null
  sourceId: string | null
}

const sentenceSchema = z.object({
  sentence: text(
    z.string().trim().min(1, '문장을 입력하세요.').max(1000, '문장은 1000자 이하로 입력하세요.'),
  ),
  meaning: text(z.string().trim().min(1, '뜻을 입력하세요.').max(1000, '뜻은 1000자 이하로 입력하세요.')),
  description: text(z.string().trim().max(5000, '설명은 5000자 이하로 입력하세요.').transform(emptyToNull)),
  sourceId: text(
    z
      .string()
      .trim()
      .refine((value) => value === '' || isUuid(value), '출처를 다시 선택하세요.')
      .transform(emptyToNull),
  ),
})

export function parseSentenceRequest(raw: unknown) {
  return parseWith<SentenceInput>(sentenceSchema, raw)
}
