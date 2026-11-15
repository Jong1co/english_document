import type { SourceInput } from '@contracts/source'
import type { Db } from '../db/client'
import * as sources from '../models/source.model'

export function listSources(db: Db): Promise<sources.SourceRow[]> {
  return sources.findAllSources(db)
}

export function createSource(db: Db, input: SourceInput): Promise<sources.SourceRow> {
  return sources.insertSource(db, input)
}
