import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/(auth)/actions'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/dal'
import { canManageSentences } from '@/lib/auth/roles'

export default function PendingPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-sm flex-col gap-4 text-center">
        <h1 className="text-2xl font-semibold">관리자 승인 대기 중</h1>
        <p className="text-sm text-muted-foreground">
          관리자가 권한을 부여하면 문장 관리를 사용할 수 있습니다.
        </p>
        <Suspense fallback={null}>
          <PendingAccount />
        </Suspense>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            로그아웃
          </Button>
        </form>
      </div>
    </main>
  )
}

async function PendingAccount() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (canManageSentences(user.role)) redirect('/sentences')
  return <p className="text-sm">{user.email}</p>
}
