import type { UserDto } from '@contracts/auth'
import type { MemberDto } from '@contracts/member'
import type { ProfileRow } from '../models/profile.model'

export function toUserDto(profile: Pick<ProfileRow, 'id' | 'email' | 'name' | 'role'>): UserDto {
  return { id: profile.id, email: profile.email, name: profile.name, role: profile.role }
}

export function toMemberDto(profile: ProfileRow): MemberDto {
  return { ...toUserDto(profile), createdAt: profile.created_at }
}
