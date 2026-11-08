import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canManageMembers, canManageSentences, type Role } from './roles'

export type CurrentUser = {
  id: string
  email: string
  name: string | null
  role: Role
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Supabase checks token expiry with Date.now(); keep this out of any prerender,
  // including cookie-aware runtime prefetches (partialPrefetching).
  await connection()
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  const userId = claims?.sub
  if (!userId) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, name, role')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error

  // Signed in but no profile row (e.g. created before the profiles migration): no role yet.
  // Returning null here would send them to /login, which the proxy bounces back — a redirect loop.
  return profile ?? { id: userId, email: claims.email ?? '', name: null, role: 'pending' }
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
