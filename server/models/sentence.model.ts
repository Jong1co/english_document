import type { Db } from '../db/client'
import type { Database } from '../db/database.types'
import type { SourceRow } from './source.model'

type SentenceTable = Database['public']['Tables']['sentences']

export type SentenceRow = Pick<
  SentenceTable['Row'],
  'id' | 'sentence' | 'meaning' | 'description' | 'created_at' | 'updated_at'
> & { source: SourceRow | null }

export type SentenceWrite = Pick<SentenceTable['Insert'], 'sentence' | 'meaning' | 'description' | 'source_id'>

const SENTENCE_COLUMNS =
  'id, sentence, meaning, description, created_at, updated_at, source:sources(id, type, title, url)'

// PostgREST: requested range starts beyond the last row.
const RANGE_NOT_SATISFIABLE = 'PGRST103'

/**
 * Newest first. `pattern` is an ILIKE pattern over sentence, meaning and description.
 * A range past the last row yields no rows (with the real total) instead of an error.
 */
export async function findSentences(
  db: Db,
  { pattern, from, to }: { pattern: string | null; from: number; to: number },
): Promise<{ rows: SentenceRow[]; total: number }> {
  let query = db
    .from('sentences')
    .select(SENTENCE_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id')
    .range(from, to)
  if (pattern) query = query.ilike('search_text', pattern)

  const { data, count, error } = await query
  if (error?.code === RANGE_NOT_SATISFIABLE) return { rows: [], total: await countSentences(db, pattern) }
  if (error) throw error
  return { rows: data ?? [], total: count ?? 0 }
}

async function countSentences(db: Db, pattern: string | null): Promise<number> {
  let query = db.from('sentences').select('id', { count: 'exact', head: true })
  if (pattern) query = query.ilike('search_text', pattern)
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

export async function findSentenceById(db: Db, id: string): Promise<SentenceRow | null> {
  const { data, error } = await db.from('sentences').select(SENTENCE_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function insertSentence(db: Db, values: SentenceWrite): Promise<void> {
  const { error } = await db.from('sentences').insert(values)
  if (error) throw error
}

/** Returns false when no row was updated (missing, or hidden by RLS). */
export async function updateSentence(db: Db, id: string, values: SentenceWrite): Promise<boolean> {
  const { data, error } = await db.from('sentences').update(values).eq('id', id).select('id')
  if (error) throw error
  return data.length > 0
}

export async function deleteSentence(db: Db, id: string): Promise<void> {
  const { error } = await db.from('sentences').delete().eq('id', id)
  if (error) throw error
}
