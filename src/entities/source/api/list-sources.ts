import 'server-only'
import type { SourceDto, SourceListResponse } from '@contracts/source'
import { apiGet } from '@/shared/api/client'

export async function listSources(): Promise<SourceDto[]> {
  const { items } = await apiGet<SourceListResponse>('/sources')
  return items
}
