import Link from 'next/link'
import { Suspense } from 'react'
import { SentenceTable } from '@/widgets/sentence-table'
import { listSentences } from '@/entities/sentence/server'
import { requireSentenceManager } from '@/entities/user/server'
import { ROUTES } from '@/shared/config/routes'
import { buttonVariants } from '@/shared/ui/button'

type SearchParams = PageProps<'/sentences'>['searchParams']

export function SentencesPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">문장 관리</h1>
        <Link href={ROUTES.newSentence} className={buttonVariants()}>
          새 문장
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">불러오는 중…</p>}>
        <SentenceList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

async function SentenceList({ searchParams }: { searchParams: SearchParams }) {
  await requireSentenceManager()
  const { q, page } = await searchParams
  const list = await listSentences({ q: first(q), page: first(page) })
  return <SentenceTable list={list} />
}
