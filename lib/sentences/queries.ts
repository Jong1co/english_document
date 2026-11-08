import 'server-only'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isUuid, type SourceType } from './schema'
import { escapeLike, pageRange } from './search'

export type SourceOption = { id: string; type: SourceType; title: string; url: string | null }

export type SentenceRow = {
  id: string
  sentence: string
  meaning: string
  description: string | null
  created_at: string
  updated_at: string
  source: SourceOption | null
}

const SENTENCE_COLUMNS =
  'id, sentence, meaning, description, created_at, updated_at, source:sources(id, type, title, url)'

// PostgREST: requested range starts beyond the last row.
const RANGE_NOT_SATISFIABLE = 'PGRST103'

export async function listSentences({ q, page }: { q: string; page: number }): Promise<{ rows: SentenceRow[]; total: number }> {
  await connection()
  const supabase = await createClient()
  const pattern = q ? `%${escapeLike(q)}%` : null
  const { from, to } = pageRange(page)

  let query = supabase
    .from('sentences')
    .select(SENTENCE_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id')
    .range(from, to)
  if (pattern) query = query.ilike('search_text', pattern)

  const { data, count, error } = await query
  if (error?.code === RANGE_NOT_SATISFIABLE) {
    let countQuery = supabase.from('sentences').select('id', { count: 'exact', head: true })
    if (pattern) countQuery = countQuery.ilike('search_text', pattern)
    const { count: total, error: countError } = await countQuery
    if (countError) throw countError
    return { rows: [], total: total ?? 0 }
  }
  if (error) throw error
  return { rows: data ?? [], total: count ?? 0 }
}

export async function getSentence(id: string): Promise<SentenceRow | null> {
  if (!isUuid(id)) return null
  await connection()
  const supabase = await createClient()
  const { data, error } = await supabase.from('sentences').select(SENTENCE_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function listSources(): Promise<SourceOption[]> {
  await connection()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sources')
    .select('id, type, title, url')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
