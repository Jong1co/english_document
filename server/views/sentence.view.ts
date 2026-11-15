import type { SentenceDto } from '@contracts/sentence'
import type { SentenceRow } from '../models/sentence.model'
import { toSourceDto } from './source.view'

export function toSentenceDto(row: SentenceRow): SentenceDto {
  return {
    id: row.id,
    sentence: row.sentence,
    meaning: row.meaning,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    source: row.source ? toSourceDto(row.source) : null,
  }
}
