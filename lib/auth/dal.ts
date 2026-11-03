import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canManageMembers, canManageSentences, type Role } from './roles'

export type CurrentUser = {
  id: string
  email: string
  name: string | null
  role: Role
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, name, role')
    .eq('id', userId)
    .maybeSingle()

  return profile ?? null
})

export async function requireSentenceManager(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!canManageSentences(user.role)) redirect('/pending')
  return user
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'pending') redirect('/pending')
  if (!canManageMembers(user.role)) redirect('/sentences')
  return user
}
