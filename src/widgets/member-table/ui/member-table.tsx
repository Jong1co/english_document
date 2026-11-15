import { RoleSelect } from '@/features/change-member-role'
import type { Member } from '@/entities/user'
import { formatDate } from '@/shared/lib/format'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

/** Every member with a role picker. The current user's own role is read-only. */
export function MemberTable({ members, currentUserId }: { members: Member[]; currentUserId: string }) {
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
          const isMe = member.id === currentUserId
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
              <TableCell className="text-muted-foreground">{formatDate(member.createdAt)}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
