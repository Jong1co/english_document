import type { Database } from '@/lib/supabase/database.types'

export type Role = Database['public']['Enums']['user_role']

export function canManageSentences(role: Role): boolean {
  return role === 'editor' || role === 'admin'
}

export function canManageMembers(role: Role): boolean {
  return role === 'admin'
}

export function homePathFor(role: Role): '/sentences' | '/pending' {
  return canManageSentences(role) ? '/sentences' : '/pending'
}
