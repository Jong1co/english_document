import type { SignInRequest, SignUpRequest } from '@contracts/auth'
import type { Db } from '../db/client'
import { AppError } from '../lib/errors'
import { findProfileById, type ProfileRow } from '../models/profile.model'

/** The caller, as far as permissions are concerned. */
export type Viewer = Pick<ProfileRow, 'id' | 'email' | 'name' | 'role'>

/** Verifies the session (refreshing it if needed) without touching the profile table. */
export async function hasSession(db: Db): Promise<boolean> {
  const { data } = await db.auth.getClaims()
  return Boolean(data?.claims)
}

export async function getViewer(db: Db): Promise<Viewer | null> {
  const { data } = await db.auth.getClaims()
  const claims = data?.claims
  const userId = claims?.sub
  if (!userId) return null

  const profile = await findProfileById(db, userId)
  // Signed in but no profile row (e.g. created before the profiles migration): no role yet.
  // Treating them as signed out would send them to /login, which bounces back — a redirect loop.
  return profile ?? { id: userId, email: claims.email ?? '', name: null, role: 'pending' }
}

export async function signIn(db: Db, { email, password }: SignInRequest): Promise<Viewer> {
  const { data, error } = await db.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    throw new AppError('INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.')
  }
  // The new session is already in effect for this client, so RLS lets the user read their own row.
  const profile = await findProfileById(db, data.user.id).catch(() => null)
  return profile ?? { id: data.user.id, email: data.user.email ?? email, name: null, role: 'pending' }
}

export async function signUp(
  db: Db,
  { name, email, password }: SignUpRequest,
): Promise<'signed-in' | 'confirmation-required'> {
  const { data, error } = await db.auth.signUp({ email, password, options: { data: { name } } })
  if (error) {
    const exists = error.code === 'user_already_exists' || error.code === 'email_exists'
    throw exists
      ? new AppError('CONFLICT', '이미 가입된 이메일입니다.')
      : new AppError('BAD_REQUEST', '가입하지 못했습니다. 다시 시도하세요.')
  }
  return data.session ? 'signed-in' : 'confirmation-required'
}

export async function signOut(db: Db): Promise<void> {
  await db.auth.signOut()
}
