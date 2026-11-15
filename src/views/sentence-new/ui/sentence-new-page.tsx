import { Suspense } from 'react'
import { createSentence, SentenceForm } from '@/features/sentence-editor'
import { listSources } from '@/entities/source/server'
import { requireSentenceManager } from '@/entities/user/server'

export function SentenceNewPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">새 문장</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">불러오는 중…</p>}>
        <NewSentenceForm />
      </Suspense>
    </div>
  )
}

async function NewSentenceForm() {
  await requireSentenceManager()
  const sources = await listSources()
  return <SentenceForm action={createSentence} sources={sources} />
}
