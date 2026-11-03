import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">페이지를 찾을 수 없습니다.</h1>
      <Link href="/sentences" className="text-sm underline">
        문장 목록으로
      </Link>
    </main>
  )
}
