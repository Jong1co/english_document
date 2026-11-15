import { Suspense } from 'react'
import { MemberTable } from '@/widgets/member-table'
import { listMembers, requireAdmin } from '@/entities/user/server'

export function MembersPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">회원 관리</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">불러오는 중…</p>}>
        <MemberList />
      </Suspense>
    </div>
  )
}

async function MemberList() {
  const me = await requireAdmin()
  const members = await listMembers()
  return <MemberTable members={members} currentUserId={me.id} />
}
