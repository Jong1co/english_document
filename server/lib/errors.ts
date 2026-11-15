import type { ErrorCode } from '@contracts/common'

/**
 * Service와 Controller가 던지는 유일한 에러 타입. HTTP 상태 코드는 모른다 — 변환은 lib/http.ts가 한다.
 * `message`는 사용자에게 그대로 보여줄 수 있는 문장으로 쓴다.
 */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/** Validation failure; the first field message becomes the overall message. */
export function validationError(fieldErrors: Record<string, string | undefined>): AppError {
  const defined = Object.fromEntries(
    Object.entries(fieldErrors).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
  const [first = '입력값을 확인하세요.'] = Object.values(defined)
  return new AppError('VALIDATION_FAILED', first, defined)
}
