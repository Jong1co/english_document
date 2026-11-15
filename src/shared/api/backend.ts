import { handleApiRequest } from '@server'

/**
 * FE에서 BE를 참조하는 유일한 파일.
 *
 * 지금은 같은 프로세스 안에서 BE를 직접 호출한다 (네트워크 왕복 없음).
 * BE를 분리하면 이 함수 본문만 `fetch(new URL(path, process.env.API_URL), init)`으로 바꾸면 된다.
 * 요청·응답은 이미 HTTP(Request/Response) 형태라서 호출하는 쪽은 바뀌지 않는다.
 */
export function fetchBackend(path: `/api/${string}`, init?: RequestInit): Promise<Response> {
  return handleApiRequest(new Request(new URL(path, 'http://backend.internal'), init))
}
