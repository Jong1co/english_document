import type { SourceDto } from '@contracts/source'
import type { SourceRow } from '../models/source.model'

export function toSourceDto(row: SourceRow): SourceDto {
  return { id: row.id, type: row.type, title: row.title, url: row.url }
}
