'use server'

import { refresh } from 'next/cache'
import { requireAdmin } from '@/entities/user/server'
import type { Role } from '@/entities/user'
import { apiRequest } from '@/shared/api/client'

export async function changeMemberRole(
  memberId: string,
  role: Role,
): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireAdmin()
  const result = await apiRequest('PATCH', `/members/${encodeURIComponent(memberId)}`, { body: { role } })
  if (!result.ok) {
    const message = result.status >= 500 ? '권한을 변경하지 못했습니다. 다시 시도하세요.' : result.error.message
    return { ok: false, message }
  }
  refresh()
  return { ok: true }
}
