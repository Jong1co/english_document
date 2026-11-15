import 'server-only'
import type { MemberDto, MemberListResponse } from '@contracts/member'
import { apiGet } from '@/shared/api/client'

export async function listMembers(): Promise<MemberDto[]> {
  const { items } = await apiGet<MemberListResponse>('/members')
  return items
}
