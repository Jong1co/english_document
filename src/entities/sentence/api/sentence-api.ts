import 'server-only'
import type { SentenceDto, SentenceListResponse } from '@contracts/sentence'
import { apiGet, apiRequest, ApiRequestError } from '@/shared/api/client'

/** `q` and `page` are passed through as typed in the URL; the BE normalizes them. */
export function listSentences(params: { q?: string; page?: string }): Promise<SentenceListResponse> {
  return apiGet<SentenceListResponse>('/sentences', params)
}

/** null when the sentence doesn't exist (or the id is malformed). */
export async function getSentence(id: string): Promise<SentenceDto | null> {
  const result = await apiRequest<SentenceDto>('GET', `/sentences/${encodeURIComponent(id)}`)
  if (result.ok) return result.data
  if (result.status === 404) return null
  throw new ApiRequestError(result.status, result.error)
}
