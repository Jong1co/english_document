import { canManageMembers } from '@contracts/auth'
import { parseUpdateMemberRequest, type MemberListResponse } from '@contracts/member'
import type { RequestContext } from '../lib/context'
import { validationError } from '../lib/errors'
import { json, noContent, readJsonBody } from '../lib/http'
import * as members from '../services/member.service'
import { toMemberDto } from '../views/user.view'
import { requirePermission } from './guards'

/** GET /api/members */
export async function list(ctx: RequestContext): Promise<Response> {
  await requirePermission(ctx, canManageMembers)
  const rows = await members.listMembers(ctx.db)
  return json<MemberListResponse>({ items: rows.map(toMemberDto) })
}

/** PATCH /api/members/:id */
export async function update(ctx: RequestContext): Promise<Response> {
  const admin = await requirePermission(ctx, canManageMembers)
  const parsed = parseUpdateMemberRequest(await readJsonBody(ctx.request))
  if (!parsed.ok) throw validationError(parsed.fieldErrors)
  await members.changeMemberRole(ctx.db, admin.id, ctx.params.id, parsed.data.role)
  return noContent()
}
