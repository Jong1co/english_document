import { canManageSentences } from '@contracts/auth'
import { parseSourceRequest, type SourceDto, type SourceListResponse } from '@contracts/source'
import type { RequestContext } from '../lib/context'
import { validationError } from '../lib/errors'
import { json, readJsonBody } from '../lib/http'
import * as sources from '../services/source.service'
import { toSourceDto } from '../views/source.view'
import { requirePermission } from './guards'

/** GET /api/sources */
export async function list(ctx: RequestContext): Promise<Response> {
  await requirePermission(ctx, canManageSentences)
  const rows = await sources.listSources(ctx.db)
  return json<SourceListResponse>({ items: rows.map(toSourceDto) })
}

/** POST /api/sources */
export async function create(ctx: RequestContext): Promise<Response> {
  await requirePermission(ctx, canManageSentences)
  const parsed = parseSourceRequest(await readJsonBody(ctx.request))
  if (!parsed.ok) throw validationError(parsed.fieldErrors)
  const row = await sources.createSource(ctx.db, parsed.data)
  return json<SourceDto>(toSourceDto(row), 201)
}
