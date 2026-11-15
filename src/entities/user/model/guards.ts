import 'server-only'
import { redirect } from 'next/navigation'
import { canManageMembers, canManageSentences, type UserDto } from '@contracts/auth'
import { ROUTES } from '@/shared/config/routes'
import { getCurrentUser } from '../api/get-current-user'

// Page-level redirects for a better experience. The BE checks permissions again on every call.

export async function requireSentenceManager(): Promise<UserDto> {
  const user = await getCurrentUser()
  if (!user) redirect(ROUTES.login)
  if (!canManageSentences(user.role)) redirect(ROUTES.pending)
  return user
}

export async function requireAdmin(): Promise<UserDto> {
  const user = await getCurrentUser()
  if (!user) redirect(ROUTES.login)
  if (user.role === 'pending') redirect(ROUTES.pending)
  if (!canManageMembers(user.role)) redirect(ROUTES.sentences)
  return user
}
