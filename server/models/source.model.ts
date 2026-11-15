import type { Db } from '../db/client'
import type { Database } from '../db/database.types'

export type SourceRow = Pick<Database['public']['Tables']['sources']['Row'], 'id' | 'type' | 'title' | 'url'>
export type SourceInsert = Pick<Database['public']['Tables']['sources']['Insert'], 'type' | 'title' | 'url'>

export const SOURCE_COLUMNS = 'id, type, title, url'

export async function findAllSources(db: Db): Promise<SourceRow[]> {
  const { data, error } = await db.from('sources').select(SOURCE_COLUMNS).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function insertSource(db: Db, values: SourceInsert): Promise<SourceRow> {
  const { data, error } = await db.from('sources').insert(values).select(SOURCE_COLUMNS).single()
  if (error) throw error
  return data
}
