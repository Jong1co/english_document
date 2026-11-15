import type { Role } from '@contracts/auth'
import { isUuid } from '@contracts/common'
import type { Db } from '../db/client'
import { AppError } from '../lib/errors'
import * as profiles from '../models/profile.model'

export function listMembers(db: Db): Promise<profiles.ProfileRow[]> {
  return profiles.findAllProfiles(db)
}

export async function changeMemberRole(db: Db, actorId: string, memberId: string, role: Role): Promise<void> {
  if (memberId === actorId) {
    throw new AppError('FORBIDDEN', '자기 자신의 권한은 변경할 수 없습니다.')
  }
  const notFound = new AppError('NOT_FOUND', '회원을 찾을 수 없습니다.')
  if (!isUuid(memberId)) throw notFound
  const updated = await profiles.updateProfileRole(db, memberId, role)
  if (!updated) throw notFound
}
