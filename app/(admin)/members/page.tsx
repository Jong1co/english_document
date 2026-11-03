import { Suspense } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { requireAdmin } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { RoleSelect } from './role-select'

const dateFormat = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeZone: 'Asia/Seoul' })

export default function MembersPage() {
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
  const supabase = await createClient()
  const { data: members, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, created_at')
    .order('created_at')
  if (error) throw error

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이메일</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>권한</TableHead>
          <TableHead>가입일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const isMe = member.id === me.id
          return (
            <TableRow key={member.id}>
              <TableCell>
                {member.email}
                {isMe && <span className="ml-1 text-muted-foreground">(나)</span>}
              </TableCell>
              <TableCell>{member.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>
                <RoleSelect memberId={member.id} role={member.role} disabled={isMe} />
              </TableCell>
              <TableCell className="text-muted-foreground">{dateFormat.format(new Date(member.created_at))}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
