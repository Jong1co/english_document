'use server'

import { refresh } from 'next/cache'
import { requireAdmin } from '@/lib/auth/dal'
import type { Role } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

const ROLES: readonly Role[] = ['pending', 'editor', 'admin']

export async function updateMemberRole(
  memberId: string,
  role: Role,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const me = await requireAdmin()
  if (memberId === me.id) {
    return { ok: false, message: '자기 자신의 권한은 변경할 수 없습니다.' }
  }
  if (!ROLES.includes(role)) {
    return { ok: false, message: '알 수 없는 권한입니다.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', memberId).select('id')
  if (error) return { ok: false, message: '권한을 변경하지 못했습니다. 다시 시도하세요.' }
  if (data.length === 0) return { ok: false, message: '회원을 찾을 수 없습니다.' }

  refresh()
  return { ok: true }
}
