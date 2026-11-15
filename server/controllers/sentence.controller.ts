import { canManageSentences } from '@contracts/auth'
import { parseSentenceRequest, type SentenceDto, type SentenceListResponse } from '@contracts/sentence'
import type { RequestContext } from '../lib/context'
import { validationError } from '../lib/errors'
import { json, noContent, readJsonBody } from '../lib/http'
import { parseListQuery } from '../lib/list-query'
import * as sentences from '../services/sentence.service'
import { toSentenceDto } from '../views/sentence.view'
import { requirePermission } from './guards'

async function readSentenceInput(ctx: RequestContext) {
  const parsed = parseSentenceRequest(await readJsonBody(ctx.request))
  if (!parsed.ok) throw validationError(parsed.fieldErrors)
  return parsed.data
}

/** GET /api/sentences?q=&page= */
export async function list(ctx: RequestContext): Promise<Response> {
  await requirePermission(ctx, canManageSentences)
  const { rows, ...page } = await sentences.listSentences(ctx.db, parseListQuery(ctx.url.searchParams))
  return json<SentenceListResponse>({ items: rows.map(toSentenceDto), ...page })
}

/** GET /api/sentences/:id */
export async function show(ctx: RequestContext): Promise<Response> {
  await requirePermission(ctx, canManageSentences)
  const row = await sentences.getSentence(ctx.db, ctx.params.id)
  return json<SentenceDto>(toSentenceDto(row))
}

/** POST /api/sentences */
export async function create(ctx: RequestContext): Promise<Response> {
  await requirePermission(ctx, canManageSentences)
  await sentences.createSentence(ctx.db, await readSentenceInput(ctx))
  return noContent()
}

/** PUT /api/sentences/:id */
export async function update(ctx: RequestContext): Promise<Response> {
  await requirePermission(ctx, canManageSentences)
  await sentences.updateSentence(ctx.db, ctx.params.id, await readSentenceInput(ctx))
  return noContent()
}

/** DELETE /api/sentences/:id */
export async function remove(ctx: RequestContext): Promise<Response> {
  await requirePermission(ctx, canManageSentences)
  await sentences.deleteSentence(ctx.db, ctx.params.id)
  return noContent()
}
