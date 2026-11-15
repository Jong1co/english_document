import { z } from 'zod'
import { ROLES, type Role } from './auth'
import { parseWith } from './common'

export type MemberDto = {
  id: string
  email: string
  name: string | null
  role: Role
  createdAt: string
}

/** GET /api/members */
export type MemberListResponse = { items: MemberDto[] }

/** PATCH /api/members/:id */
export type UpdateMemberRequest = { role: string }
export type UpdateMemberInput = { role: Role }

const updateMemberSchema = z.object({
  role: z.enum(ROLES, { error: '알 수 없는 권한입니다.' }),
})

export function parseUpdateMemberRequest(raw: unknown) {
  return parseWith<UpdateMemberInput>(updateMemberSchema, raw)
}
