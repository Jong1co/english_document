# 아키텍처 개요

한 저장소에 FE와 BE가 같이 있지만, **언제든 BE를 별도 서버로 떼어낼 수 있도록** 코드와 의존성을 완전히 분리한다.

## 네 영역

| 폴더 | 역할 | 패턴 | 상세 |
|---|---|---|---|
| `app/` | Next.js 라우팅. FE 화면과 BE API를 URL에 붙이는 곳 | FSD의 app 레이어 | [folder-structure.md](folder-structure.md) |
| `src/` | FE. 화면, 사용자 동작, 서버 컴포넌트 데이터 로딩 | FSD | [frontend.md](frontend.md) |
| `server/` | BE. 인증, 권한, 검증, DB 접근 | MVC (+ Service) | [backend.md](backend.md) |
| `contracts/` | FE↔BE 계약. 요청·응답 타입, 입력 검증 스키마, 에러 코드 | — | [backend.md](backend.md#계약-contracts) |

## 의존 규칙

```
app/ ─────▶ src/ (views 공개 API)
app/api/ ─▶ server/ (@server 진입점 1개)

src/ ──────▶ contracts/
server/ ───▶ contracts/
contracts/ ─▶ (zod만)

src/shared/api/backend.ts ─▶ server/   ← FE에서 BE를 아는 유일한 파일
```

- **FE(`src/`, `app/`, `proxy.ts`)는 `server/`와 `@supabase/*`를 import하지 않는다.** DB와 인증은 전부 BE를 거친다.
- **BE(`server/`)는 FE, Next.js, React를 import하지 않는다.** 웹 표준 `Request` → `Response`만 다룬다.
- **`contracts/`는 양쪽 어디에도 의존하지 않는다.** BE를 분리하면 그대로 패키지로 꺼낼 수 있다.

위 규칙은 `eslint.config.mjs`의 `no-restricted-imports`로 강제된다. `pnpm lint`가 실패하면 경계를 넘은 것이다.

## 요청 흐름

FE는 BE를 **HTTP 형태(Request/Response)로만** 호출한다. 지금은 같은 프로세스 안에서 함수 호출로 전달되어 네트워크 왕복이 없다.

```
[브라우저]
   │ 페이지 요청 / Server Action(POST)
   ▼
proxy.ts ─────────── GET /api/v1/auth/session ─┐  세션 쿠키 갱신, 비로그인 리다이렉트
   ▼                                           │
Server Component / Server Action (src/)        │
   │ apiRequest('GET', '/sentences')           │
   ▼                                           ▼
src/shared/api/client.ts ─▶ backend.ts ─▶ server/index.ts (handleApiRequest)
                                             ▼
                                   routes → controller → service → model → Supabase
                                             ▼
                                   view(DTO) → JSON Response (+ Set-Cookie)

[외부 HTTP 클라이언트] ─▶ /api/v1/* ─▶ app/api/[...path]/route.ts ─▶ server/index.ts (같은 함수)
```

- 쿠키: `client.ts`가 현재 요청의 쿠키를 BE 요청에 싣고, BE가 내려준 `Set-Cookie`(로그인·로그아웃·토큰 갱신)를 브라우저로 넘긴다.
- 권한: FE의 가드(`requireSentenceManager` 등)는 **화면 이동용**이다. 실제 권한 확인은 BE 컨트롤러와 DB RLS가 매 요청마다 한다.
- `/api/*`는 `proxy.ts`를 거치지 않는다. BE가 직접 세션을 확인하고 401을 돌려준다.
- API는 버전 접두사(`/api/v1`) 아래에 있다. 접두사는 `contracts/common.ts`의 `API_PREFIX` 하나로 FE·BE가 같이 쓴다. 버전 규칙은 [backend.md](backend.md#버전).

## BE를 분리할 때

1. `server/`, `contracts/`, `supabase/`를 새 저장소로 옮기고 `handleApiRequest`를 아무 웹 표준 런타임(Hono, Node 서버 등)에 붙인다.
2. `contracts/`는 패키지로 배포하거나 양쪽에 복사한다.
3. FE의 `src/shared/api/backend.ts` 본문을 `fetch(new URL(path, process.env.API_URL), init)`으로 바꾼다.
4. `next.config.ts`의 `rewrites`로 `/api/:path*`를 새 BE로 넘기면 브라우저 입장에선 같은 출처라 쿠키가 그대로 동작한다.
5. `app/api/[...path]/route.ts`를 지운다.

이때 바뀌는 FE 코드는 3번의 파일 하나다. 그 외 FE 변경이 필요하다면 경계가 새고 있다는 뜻이다.

## 결정 배경

- **왜 HTTP 계약인가**: 서버 액션에서 BE 함수를 직접 부르면 지금은 편하지만, 분리할 때 호출부를 전부 다시 써야 한다. 처음부터 `Request/Response`로 주고받으면 분리 시 전송 방식만 바꾸면 된다.
- **왜 같은 프로세스 호출인가**: 서버 컴포넌트가 자기 자신의 `/api`를 `fetch`하면 왕복 지연이 생기고, 절대 URL·Vercel 프리뷰 보호·쿠키 전달 문제가 따라온다. 내부 호출은 이 비용 없이 같은 계약을 지킨다.
- **왜 서버 액션을 유지하나**: 폼 상태(`useActionState`), 리다이렉트, 저장 후 캐시 갱신(`refresh`)이 Next와 맞물려 동작한다. 서버 액션은 FE 쪽 BFF 역할만 하고, 데이터는 반드시 BE를 거친다.
- **환경 변수 이름**: BE도 `NEXT_PUBLIC_SUPABASE_*`를 읽는다. 배포 설정을 바꾸지 않으려고 그대로 두었다. BE를 분리할 때 `SUPABASE_URL` 등 서버 전용 이름으로 바꾼다.
