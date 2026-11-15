// Client-safe public API. Server-only functions are in ./server.ts.
export type { Role, UserDto as User } from '@contracts/auth'
export type { MemberDto as Member } from '@contracts/member'
export { ROLES, canManageMembers, canManageSentences } from '@contracts/auth'
export { ROLE_LABELS, homePathFor } from './model/roles'
