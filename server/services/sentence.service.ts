import { isUuid } from '@contracts/common'
import type { SentenceInput } from '@contracts/sentence'
import type { Db } from '../db/client'
import { AppError } from '../lib/errors'
import { escapeLike, PAGE_SIZE, pageRange, type ListQuery } from '../lib/list-query'
import * as sentences from '../models/sentence.model'

const notFound = () => new AppError('NOT_FOUND', '문장을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.')

function toWrite(input: SentenceInput): sentences.SentenceWrite {
  return {
    sentence: input.sentence,
    meaning: input.meaning,
    description: input.description,
    source_id: input.sourceId,
  }
}

export async function listSentences(db: Db, { q, page }: ListQuery) {
  const pattern = q ? `%${escapeLike(q)}%` : null
  const { rows, total } = await sentences.findSentences(db, { pattern, ...pageRange(page) })
  return { rows, total, q, page, pageSize: PAGE_SIZE }
}

export async function getSentence(db: Db, id: string): Promise<sentences.SentenceRow> {
  if (!isUuid(id)) throw notFound()
  const row = await sentences.findSentenceById(db, id)
  if (!row) throw notFound()
  return row
}

export async function createSentence(db: Db, input: SentenceInput): Promise<void> {
  await sentences.insertSentence(db, toWrite(input))
}

export async function updateSentence(db: Db, id: string, input: SentenceInput): Promise<void> {
  if (!isUuid(id)) throw notFound()
  const updated = await sentences.updateSentence(db, id, toWrite(input))
  if (!updated) throw notFound()
}

export async function deleteSentence(db: Db, id: string): Promise<void> {
  if (!isUuid(id)) throw notFound()
  await sentences.deleteSentence(db, id)
}
