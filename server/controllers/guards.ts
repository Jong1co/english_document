import type { Role } from '@contracts/auth'
import type { RequestContext } from '../lib/context'
import { AppError } from '../lib/errors'
import { getViewer, type Viewer } from '../services/auth.service'

export async function requireViewer(ctx: RequestContext): Promise<Viewer> {
  const viewer = await getViewer(ctx.db)
  if (!viewer) throw new AppError('UNAUTHENTICATED', '로그인이 필요합니다.')
  return viewer
}

/** `allowed` is a permission check from contracts/auth, e.g. canManageSentences. */
export async function requirePermission(ctx: RequestContext, allowed: (role: Role) => boolean): Promise<Viewer> {
  const viewer = await requireViewer(ctx)
  if (!allowed(viewer.role)) throw new AppError('FORBIDDEN', '권한이 없습니다.')
  return viewer
}
