'use server'

import { refresh } from 'next/cache'
import { requireSentenceManager } from '@/entities/user/server'
import { apiRequest } from '@/shared/api/client'

export async function deleteSentence(id: string): Promise<void> {
  await requireSentenceManager()
  const result = await apiRequest('DELETE', `/sentences/${encodeURIComponent(id)}`)
  if (!result.ok) throw new Error('삭제하지 못했습니다.')
  refresh()
}
