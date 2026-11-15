import { createRequestContext } from './lib/context'
import { CookieJar } from './lib/cookie-jar'
import { AppError } from './lib/errors'
import { errorResponse } from './lib/http'
import { matchRoute } from './lib/router'
import { routes } from './routes'

/**
 * BE의 유일한 공개 진입점. 웹 표준 Request → Response 함수라서 어떤 런타임에도 붙일 수 있다.
 * 지금은 app/api/[...path]/route.ts(HTTP)와 src/shared/api/backend.ts(서버 내부 호출)에서만 쓴다.
 */
export async function handleApiRequest(request: Request): Promise<Response> {
  const match = matchRoute(routes, request.method, new URL(request.url).pathname)
  if (match.kind === 'not-found') {
    return errorResponse(new AppError('NOT_FOUND', '요청한 API가 없습니다.'))
  }
  if (match.kind === 'method-not-allowed') {
    return errorResponse(new AppError('METHOD_NOT_ALLOWED', '지원하지 않는 HTTP 메서드입니다.'))
  }

  const jar = new CookieJar()
  const ctx = createRequestContext(request, match.params, jar)
  let response: Response
  try {
    response = await match.handler(ctx)
  } catch (error) {
    response = errorResponse(error)
  }
  return jar.applyTo(response)
}
