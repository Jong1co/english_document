import Link from 'next/link'
import { Suspense } from 'react'
import { AdminNav } from './admin-nav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
          <Link href="/sentences" className="font-semibold">
            영어 문장 어드민
          </Link>
          <Suspense fallback={<div className="flex-1" />}>
            <AdminNav />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  )
}
