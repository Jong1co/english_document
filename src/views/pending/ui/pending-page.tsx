import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { SignOutButton } from '@/features/auth'
import { canManageSentences } from '@/entities/user'
import { getCurrentUser } from '@/entities/user/server'
import { ROUTES } from '@/shared/config/routes'

export function PendingPage() {
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
        <SignOutButton />
      </div>
    </main>
  )
}

async function PendingAccount() {
  const user = await getCurrentUser()
  if (!user) redirect(ROUTES.login)
  if (canManageSentences(user.role)) redirect(ROUTES.sentences)
  return <p className="text-sm">{user.email}</p>
}
