# BE — MVC (+ Service)

BE 코드는 `server/`에 둔다. Next.js·React를 전혀 모르는 **웹 표준 `Request` → `Response` 함수**(`handleApiRequest`)가 유일한 진입점이다.

## 계층

```
Request
  ▼
index.ts       라우트 찾기 → 요청 컨텍스트 생성 → 컨트롤러 실행 → 에러를 응답으로 변환 → Set-Cookie 부착
  ▼
routes.ts      메서드 + 경로 → 컨트롤러 함수
  ▼
controllers/   C: 입력 파싱·검증(contracts), 권한 확인(guards), 서비스 호출, view로 응답 만들기
  ▼
services/      업무 규칙. HTTP를 모른다
  ▼
models/        M: DB 접근(Supabase 쿼리). 테이블 행 타입을 그대로 반환
  ▲
views/         V: DB 행 → 응답 DTO (snake_case → camelCase). 응답 모양은 여기서만 정한다
```

| 계층 | 할 일 | 하지 말 것 |
|---|---|---|
| Controller | `readJsonBody`, `parse*Request`, `requirePermission`, `json()`/`noContent()` | DB 직접 접근, 업무 규칙 |
| Service | 규칙과 흐름 (`자기 역할 변경 금지`, 없는 행 → `NOT_FOUND`) | `Request`/`Response`, 상태 코드 |
| Model | 쿼리 한 덩어리 = 함수 하나. 에러는 그대로 던짐 | 권한 판단, DTO 변환 |
| View | 행 → DTO 순수 함수 | 조회, 분기 로직 |

공통 도구는 `lib/`(라우터, `AppError`, HTTP 응답, 요청 컨텍스트, 쿠키), DB 클라이언트와 생성된 타입은 `db/`, 환경 변수는 `config/`에 있다.

### 요청 컨텍스트

컨트롤러는 `(ctx: RequestContext) => Promise<Response>` 하나만 받는다.

- `ctx.request`, `ctx.url`, `ctx.params` (`:id` 등)
- `ctx.db`: **호출자 권한으로 동작하는** Supabase 클라이언트. 요청의 Cookie 헤더에서 세션을 읽으므로 RLS가 그대로 적용된다. 처음 접근할 때 만들어진다.

세션 갱신·로그인·로그아웃으로 바뀐 쿠키는 `CookieJar`가 모았다가 응답의 `Set-Cookie`로 붙인다.

### 권한

- 컨트롤러 첫 줄에서 `requirePermission(ctx, canManageSentences)`처럼 확인한다. 판정 함수는 `contracts/auth.ts`에 있어 FE 메뉴 표시와 같은 기준을 쓴다.
- 최종 방어선은 DB RLS다 (`supabase/migrations/`). 컨트롤러 검사를 빠뜨려도 데이터는 RLS가 막지만, 에러 코드가 부정확해지므로 반드시 넣는다.

## API

모든 경로는 `/api` 아래. 요청·응답 본문은 JSON. 타입은 `contracts/`에 있다.

| 메서드 | 경로 | 권한 | 성공 응답 | 계약 |
|---|---|---|---|---|
| GET | `/auth/session` | — | `200 { signedIn }` (세션 갱신) | `SessionResponse` |
| GET | `/auth/me` | — | `200 { user \| null }` | `MeResponse` |
| POST | `/auth/sign-in` | — | `200 { user }` + 세션 쿠키 | `SignInRequest` / `SignInResponse` |
| POST | `/auth/sign-up` | — | `201 { status: 'signed-in' \| 'confirmation-required' }` | `SignUpRequest` / `SignUpResponse` |
| POST | `/auth/sign-out` | — | `204` + 쿠키 삭제 | — |
| GET | `/sentences?q=&page=` | editor, admin | `200 { items, total, q, page, pageSize }` | `SentenceListResponse` |
| POST | `/sentences` | editor, admin | `204` | `SentenceRequest` |
| GET | `/sentences/:id` | editor, admin | `200 SentenceDto` | `SentenceDto` |
| PUT | `/sentences/:id` | editor, admin | `204` | `SentenceRequest` |
| DELETE | `/sentences/:id` | editor, admin | `204` | — |
| GET | `/sources` | editor, admin | `200 { items }` | `SourceListResponse` |
| POST | `/sources` | editor, admin | `201 SourceDto` | `SourceRequest` |
| GET | `/members` | admin | `200 { items }` | `MemberListResponse` |
| PATCH | `/members/:id` | admin | `204` | `UpdateMemberRequest` |

### 에러 응답

```json
{ "error": { "code": "VALIDATION_FAILED", "message": "문장을 입력하세요.", "fieldErrors": { "sentence": "문장을 입력하세요." } } }
```

| code | 상태 | 언제 |
|---|---|---|
| `BAD_REQUEST` | 400 | 본문이 JSON 객체가 아님, 처리할 수 없는 요청 |
| `VALIDATION_FAILED` | 400 | 입력 검증 실패. `fieldErrors`에 필드별 첫 메시지 |
| `UNAUTHENTICATED` | 401 | 로그인 필요 |
| `INVALID_CREDENTIALS` | 401 | 이메일·비밀번호 불일치 |
| `FORBIDDEN` | 403 | 역할 부족, 자기 역할 변경 |
| `NOT_FOUND` | 404 | 없는 경로, 없는 행, 잘못된 id |
| `METHOD_NOT_ALLOWED` | 405 | 경로는 있으나 메서드가 다름 |
| `CONFLICT` | 409 | 이미 가입된 이메일 |
| `INTERNAL` | 500 | 예상하지 못한 에러 (서버 로그에 원본 출력) |

`message`는 사용자에게 그대로 보여줄 수 있는 한국어 문장이다. 서비스·컨트롤러는 `AppError(code, message)`만 던지고, 상태 코드 변환은 `lib/http.ts`가 한다. `AppError`가 아닌 에러는 모두 `INTERNAL`이 된다.

## 계약 (contracts)

`contracts/`는 FE와 BE가 같이 쓰는 **유일한 코드**다.

- 요청 타입 (`SentenceRequest`: 폼이 보내는 문자열 그대로), 검증 후 타입 (`SentenceInput`), 응답 DTO (`SentenceDto`)
- 요청 검증 함수 (`parseSentenceRequest`) — zod 스키마와 한국어 메시지
- 역할 목록과 권한 판정 (`ROLES`, `canManageSentences`)
- 에러 코드와 에러 응답 형식

DB 컬럼 이름은 계약에 나오지 않는다. DB를 바꿔도 view만 고치면 FE는 그대로다. DB enum과 계약의 값이 어긋나면 `views/`에서 타입 에러가 난다.

## 새 API를 추가할 때

1. `contracts/<도메인>.ts`에 요청·응답 타입과 검증 함수
2. `models/<도메인>.model.ts`에 쿼리 (스키마를 바꾸면 마이그레이션 + `pnpm db:types`)
3. `services/<도메인>.service.ts`에 규칙
4. `views/<도메인>.view.ts`에 DTO 변환
5. `controllers/<도메인>.controller.ts`에 액션
6. `routes.ts`에 한 줄 + 이 문서의 API 표 갱신
7. 순수 로직은 단위 테스트, 권한은 `supabase/tests/database/`에 pgTAP 테스트
