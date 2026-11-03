import { Suspense } from 'react'
import { requireSentenceManager } from '@/lib/auth/dal'

export default function SentencesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">문장 관리</h1>
      <Suspense fallback={null}>
        <SentencesGate />
      </Suspense>
    </div>
  )
}

async function SentencesGate() {
  await requireSentenceManager()
  return null
}
