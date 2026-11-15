import Link from 'next/link'
import { Suspense } from 'react'
import { SignOutButton } from '@/features/auth'
import { canManageMembers } from '@/entities/user'
import { getCurrentUser } from '@/entities/user/server'
import { ROUTES } from '@/shared/config/routes'

export function AdminHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
        <Link href={ROUTES.sentences} className="font-semibold">
          영어 문장 어드민
        </Link>
        <Suspense fallback={<div className="flex-1" />}>
          <AdminNav />
        </Suspense>
      </div>
    </header>
  )
}

async function AdminNav() {
  const user = await getCurrentUser()
  if (!user) return <div className="flex-1" />

  return (
    <>
      <nav className="flex flex-1 items-center gap-4 text-sm">
        <Link href={ROUTES.sentences}>문장</Link>
        {canManageMembers(user.role) && <Link href={ROUTES.members}>회원</Link>}
      </nav>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">{user.name ?? user.email}</span>
        <SignOutButton size="sm" />
      </div>
    </>
  )
}
