import {
  parseSignInRequest,
  parseSignUpRequest,
  type MeResponse,
  type SessionResponse,
  type SignInResponse,
  type SignUpResponse,
} from '@contracts/auth'
import type { RequestContext } from '../lib/context'
import { validationError } from '../lib/errors'
import { json, noContent, readJsonBody } from '../lib/http'
import * as auth from '../services/auth.service'
import { toUserDto } from '../views/user.view'

/** GET /api/auth/session */
export async function session(ctx: RequestContext): Promise<Response> {
  return json<SessionResponse>({ signedIn: await auth.hasSession(ctx.db) })
}

/** GET /api/auth/me */
export async function me(ctx: RequestContext): Promise<Response> {
  const viewer = await auth.getViewer(ctx.db)
  return json<MeResponse>({ user: viewer && toUserDto(viewer) })
}

/** POST /api/auth/sign-in */
export async function signIn(ctx: RequestContext): Promise<Response> {
  const parsed = parseSignInRequest(await readJsonBody(ctx.request))
  if (!parsed.ok) throw validationError(parsed.fieldErrors)
  const viewer = await auth.signIn(ctx.db, parsed.data)
  return json<SignInResponse>({ user: toUserDto(viewer) })
}

/** POST /api/auth/sign-up */
export async function signUp(ctx: RequestContext): Promise<Response> {
  const parsed = parseSignUpRequest(await readJsonBody(ctx.request))
  if (!parsed.ok) throw validationError(parsed.fieldErrors)
  const status = await auth.signUp(ctx.db, parsed.data)
  return json<SignUpResponse>({ status }, 201)
}

/** POST /api/auth/sign-out */
export async function signOut(ctx: RequestContext): Promise<Response> {
  await auth.signOut(ctx.db)
  return noContent()
}
