import { canManageSentences, type Role } from '@contracts/auth'
import { ROUTES } from '@/shared/config/routes'

export const ROLE_LABELS: Record<Role, string> = {
  pending: '승인 대기',
  editor: '에디터',
  admin: '관리자',
}

/** Where a user lands after signing in. */
export function homePathFor(role: Role): typeof ROUTES.sentences | typeof ROUTES.pending {
  return canManageSentences(role) ? ROUTES.sentences : ROUTES.pending
}
