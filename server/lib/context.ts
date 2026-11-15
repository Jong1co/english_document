import { createDb, type Db } from '../db/client'
import type { CookieJar } from './cookie-jar'

/** Everything a controller needs about the current request. */
export type RequestContext = {
  request: Request
  url: URL
  params: Record<string, string>
  /** Created on first use, so routes that never touch the DB need no env. */
  readonly db: Db
}

/** A controller action. */
export type Handler = (ctx: RequestContext) => Promise<Response>

export function createRequestContext(request: Request, params: Record<string, string>, jar: CookieJar): RequestContext {
  let db: Db | undefined
  return {
    request,
    url: new URL(request.url),
    params,
    get db() {
      db ??= createDb(request, jar)
      return db
    },
  }
}
