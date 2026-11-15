import type { ApiErrorBody, ErrorCode } from '@contracts/common'
import { AppError } from './errors'

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL: 500,
}

export function json<T>(data: T, status = 200): Response {
  return Response.json(data, { status })
}

export function noContent(): Response {
  return new Response(null, { status: 204 })
}

export function errorResponse(error: unknown): Response {
  const appError =
    error instanceof AppError ? error : new AppError('INTERNAL', '요청을 처리하지 못했습니다. 다시 시도하세요.')
  if (!(error instanceof AppError)) console.error(error)

  const body: ApiErrorBody = {
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.fieldErrors && { fieldErrors: appError.fieldErrors }),
    },
  }
  return json(body, STATUS_BY_CODE[appError.code])
}

/** Parses a JSON object body. Anything else is a 400. */
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new AppError('BAD_REQUEST', '요청 본문이 올바른 JSON이 아닙니다.')
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new AppError('BAD_REQUEST', '요청 본문은 JSON 객체여야 합니다.')
  }
  return body as Record<string, unknown>
}
