import 'server-only'
import { cookies } from 'next/headers'
import { connection } from 'next/server'
import { API_PREFIX, type ApiErrorBody } from '@contracts/common'
import { fetchBackend } from './backend'
import { readSetCookies, toCookieHeader } from './set-cookie'

export type ApiError = ApiErrorBody['error']

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: ApiError }

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  body?: unknown
  query?: Record<string, string | undefined>
}

const UNKNOWN_ERROR: ApiError = { code: 'INTERNAL', message: '요청을 처리하지 못했습니다. 다시 시도하세요.' }

/**
 * Calls the BE from a Server Component or Server Action.
 *
 * The current request's cookies go along, and cookies the BE sets (sign-in, sign-out,
 * token refresh) are passed on to the browser. `path` is relative to API_PREFIX (`/api/v1`).
 */
export async function apiRequest<T>(
  method: Method,
  path: `/${string}`,
  { body, query }: RequestOptions = {},
): Promise<ApiResult<T>> {
  // The BE reads the clock and the database. Keep every call out of prerendering,
  // including cookie-aware runtime prefetches (partialPrefetching).
  await connection()
  const cookieStore = await cookies()

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) search.set(key, value)
  }
  const headers = new Headers({ cookie: toCookieHeader(cookieStore.getAll()) })
  if (body !== undefined) headers.set('content-type', 'application/json')

  const response = await fetchBackend(`${API_PREFIX}${path}${search.size > 0 ? `?${search}` : ''}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  for (const { name, value, options } of readSetCookies(response)) {
    try {
      cookieStore.set(name, value, options)
    } catch {
      // Server Components can't set cookies. proxy.ts refreshes the session before rendering.
    }
  }

  if (response.ok) {
    const data = response.status === 204 ? undefined : await response.json()
    return { ok: true, data: data as T }
  }
  const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null
  return { ok: false, status: response.status, error: errorBody?.error ?? UNKNOWN_ERROR }
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly error: ApiError,
  ) {
    super(`${status} ${error.code}: ${error.message}`)
    this.name = 'ApiRequestError'
  }
}

/** For reads where any failure is unexpected: throws so the nearest error boundary takes over. */
export async function apiGet<T>(path: `/${string}`, query?: RequestOptions['query']): Promise<T> {
  const result = await apiRequest<T>('GET', path, { query })
  if (!result.ok) throw new ApiRequestError(result.status, result.error)
  return result.data
}
