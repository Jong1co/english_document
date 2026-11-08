import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { requireSentenceManager } from '@/lib/auth/dal'
import { getSentence, listSources } from '@/lib/sentences/queries'
import { updateSentence } from '../../actions'
import { SentenceForm } from '../../sentence-form'

export default function EditSentencePage({ params }: PageProps<'/sentences/[id]/edit'>) {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">문장 수정</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">불러오는 중…</p>}>
        <EditSentenceForm params={params} />
      </Suspense>
    </div>
  )
}

async function EditSentenceForm({ params }: { params: PageProps<'/sentences/[id]/edit'>['params'] }) {
  await requireSentenceManager()
  const { id } = await params
  const [sentence, sources] = await Promise.all([getSentence(id), listSources()])
  if (!sentence) notFound()
  return <SentenceForm action={updateSentence.bind(null, id)} sources={sources} initial={sentence} />
}
