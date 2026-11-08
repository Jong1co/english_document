import Form from 'next/form'
import Link from 'next/link'
import { Suspense } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { requireSentenceManager } from '@/lib/auth/dal'
import { listSentences, type SentenceRow } from '@/lib/sentences/queries'
import { PAGE_SIZE, parseListParams } from '@/lib/sentences/search'
import { DeleteButton } from './delete-button'

const dateFormat = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeZone: 'Asia/Seoul' })

export default function SentencesPage({ searchParams }: PageProps<'/sentences'>) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">문장 관리</h1>
        <Link href="/sentences/new" className={buttonVariants()}>
          새 문장
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">불러오는 중…</p>}>
        <SentenceList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function SentenceList({ searchParams }: { searchParams: PageProps<'/sentences'>['searchParams'] }) {
  await requireSentenceManager()
  const { q, page } = parseListParams(await searchParams)
  const { rows, total } = await listSentences({ q, page })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-4">
      <Form action="/sentences" className="flex max-w-md gap-2">
        <Input type="search" name="q" aria-label="검색" placeholder="문장, 뜻, 설명 검색" defaultValue={q} />
      </Form>
      <p className="text-sm text-muted-foreground">총 {total}개</p>
      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">문장이 없습니다.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>문장</TableHead>
              <TableHead>뜻</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>출처</TableHead>
              <TableHead>수정일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <SentenceTableRow key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
      )}
      <Pagination q={q} page={page} totalPages={totalPages} />
    </div>
  )
}

function SentenceTableRow({ row }: { row: SentenceRow }) {
  return (
    <TableRow>
      <TableCell className="max-w-xs whitespace-normal font-medium">{row.sentence}</TableCell>
      <TableCell className="max-w-xs whitespace-normal">{row.meaning}</TableCell>
      <TableCell className="max-w-xs truncate text-muted-foreground">{row.description ?? ''}</TableCell>
      <TableCell>
        {row.source ? (
          row.source.url ? (
            <a href={row.source.url} target="_blank" rel="noreferrer" className="underline">
              {row.source.title}
            </a>
          ) : (
            row.source.title
          )
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{dateFormat.format(new Date(row.updated_at))}</TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Link href={`/sentences/${row.id}/edit`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            수정
          </Link>
          <DeleteButton id={row.id} sentence={row.sentence} />
        </div>
      </TableCell>
    </TableRow>
  )
}

function Pagination({ q, page, totalPages }: { q: string; page: number; totalPages: number }) {
  const href = (target: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('page', String(target))
    return `/sentences?${params}`
  }
  const linkClass = buttonVariants({ variant: 'outline', size: 'sm' })

  return (
    <div className="flex items-center justify-center gap-3 text-sm">
      {page > 1 ? (
        <Link href={href(Math.min(page - 1, totalPages))} className={linkClass}>
          이전
        </Link>
      ) : (
        <span className={`${linkClass} pointer-events-none opacity-50`}>이전</span>
      )}
      <span className="text-muted-foreground">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} className={linkClass}>
          다음
        </Link>
      ) : (
        <span className={`${linkClass} pointer-events-none opacity-50`}>다음</span>
      )}
    </div>
  )
}
