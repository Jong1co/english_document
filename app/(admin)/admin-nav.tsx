import Link from 'next/link'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/dal'
import { canManageMembers } from '@/lib/auth/roles'

export async function AdminNav() {
  const user = await getCurrentUser()
  if (!user) return <div className="flex-1" />

  return (
    <>
      <nav className="flex flex-1 items-center gap-4 text-sm">
        <Link href="/sentences">문장</Link>
        {canManageMembers(user.role) && <Link href="/members">회원</Link>}
      </nav>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">{user.name ?? user.email}</span>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            로그아웃
          </Button>
        </form>
      </div>
    </>
  )
}
