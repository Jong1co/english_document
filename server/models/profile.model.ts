import type { Db } from '../db/client'
import type { Database } from '../db/database.types'

export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type UserRole = Database['public']['Enums']['user_role']

export async function findProfileById(
  db: Db,
  id: string,
): Promise<Pick<ProfileRow, 'id' | 'email' | 'name' | 'role'> | null> {
  const { data, error } = await db.from('profiles').select('id, email, name, role').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function findAllProfiles(db: Db): Promise<ProfileRow[]> {
  const { data, error } = await db.from('profiles').select('id, email, name, role, created_at').order('created_at')
  if (error) throw error
  return data
}

/** Returns false when no row was updated (missing, or hidden by RLS). */
export async function updateProfileRole(db: Db, id: string, role: UserRole): Promise<boolean> {
  const { data, error } = await db.from('profiles').update({ role }).eq('id', id).select('id')
  if (error) throw error
  return data.length > 0
}
