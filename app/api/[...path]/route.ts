// BE(server/)를 /api/* 로 HTTP에 노출하는 마운트 지점. 라우팅은 server/routes.ts가 한다.
import { handleApiRequest } from '@server'

export const GET = handleApiRequest
export const POST = handleApiRequest
export const PUT = handleApiRequest
export const PATCH = handleApiRequest
export const DELETE = handleApiRequest
