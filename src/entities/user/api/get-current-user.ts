import 'server-only'
import { cache } from 'react'
import type { MeResponse, UserDto } from '@contracts/auth'
import { apiGet } from '@/shared/api/client'

/** The signed-in user, or null. Fetched once per render. */
export const getCurrentUser = cache(async (): Promise<UserDto | null> => {
  const { user } = await apiGet<MeResponse>('/auth/me')
  return user
})
