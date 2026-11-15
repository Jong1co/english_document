import Form from 'next/form'
import Link from 'next/link'
import { DeleteSentenceButton } from '@/features/delete-sentence'
import type { Sentence, SentenceList } from '@/entities/sentence'
import { ROUTES } from '@/shared/config/routes'
import { formatDate } from '@/shared/lib/format'
import { buttonVariants } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'

/** Search box, sentence rows with edit/delete, and pagination. */
export function SentenceTable({ list }: { list: SentenceList }) {
  const { items, total, q, page, pageSize } = list
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex flex-col gap-4">
      <Form action={ROUTES.sentences} className="flex max-w-md gap-2">
        <Input type="search" name="q" aria-label="검색" placeholder="문장, 뜻, 설명 검색" defaultValue={q} />
      </Form>
      <p className="text-sm text-muted-foreground">총 {total}개</p>
      {items.length === 0 ? (
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
            {items.map((row) => (
              <SentenceTableRow key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
      )}
      <Pagination q={q} page={page} totalPages={totalPages} />
    </div>
  )
}

function SentenceTableRow({ row }: { row: Sentence }) {
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
      <TableCell className="text-muted-foreground">{formatDate(row.updatedAt)}</TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Link href={ROUTES.editSentence(row.id)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            수정
          </Link>
          <DeleteSentenceButton id={row.id} sentence={row.sentence} />
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
    return `${ROUTES.sentences}?${params}`
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
