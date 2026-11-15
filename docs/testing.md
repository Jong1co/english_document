# 테스트

| 명령 | 도구 | 대상 | 필요한 것 |
|---|---|---|---|
| `pnpm lint` | ESLint | 코드 규칙 + **FE/BE·FSD 경계** | — |
| `pnpm test` | Vitest | 순수 로직: `contracts/`, `server/`, `src/` 의 `*.test.ts` | — |
| `pnpm test:db` | pgTAP | 역할별 RLS, 가입 트리거, 출처 삭제 제한 | 로컬 Supabase |
| `pnpm test:e2e` | Playwright | 로그인, 문장 관리, 회원 관리 전체 흐름 | 로컬 Supabase (Docker) |
| `pnpm build` | Next | 타입 검사, `<Suspense>` 누락 등 렌더링 규칙 | — |

## CI

`.github/workflows/ci.yml` — 모든 PR과 `main` 푸시에서 실행된다. 같은 PR에 새 커밋이 오면 이전 실행은 취소된다.

| 잡 | 단계 | 비고 |
|---|---|---|
| `Lint · Unit · Build` | `pnpm lint` → `pnpm test` → `pnpm build` | 환경 변수 없이 빌드 (Supabase 값은 요청 시점에 읽음) |
| `DB · E2E` | 로컬 Supabase 시작 → `pnpm test:db` → `pnpm test:e2e` | 러너 안의 Docker에 Postgres·Auth·REST·Kong만 띄움. 실패 시 Playwright trace를 아티팩트로 7일 보관 |

시크릿은 필요 없다. 두 잡 모두 통과해야 머지한다 ([git-workflow.md](conventions/git-workflow.md#pr)).

## 어디에 무엇을 테스트하나

| 위치 | 테스트 |
|---|---|
| `contracts/` | 요청 검증 (공백, 길이, 형식, 한국어 메시지), 권한 판정 |
| `server/lib/` | 라우터 매칭, 검색어·페이지 처리, 쿠키 부착 |
| `server/index.test.ts` | DB 없이 확인 가능한 응답 (404, 405, 에러 형식) |
| `src/shared/` | Set-Cookie 파싱 등 FE 도구 |
| `src/entities/` | 순수 함수 (`homePathFor`) |
| `supabase/tests/database/` | 권한은 여기서. API 우회 시에도 막히는지 |
| `e2e/` | 사용자가 보는 흐름. 화면 문구로 찾는다 (`getByRole`, `getByLabel`) |

DB가 필요한 서비스·모델 로직은 단위 테스트 대신 e2e와 pgTAP으로 확인한다.

## e2e 주의

- `.env` 값과 상관없이 **항상 로컬 Supabase**에 붙는다. 원격 URL이면 실행을 거부한다.
- 시작할 때 로컬의 문장·출처 데이터를 지우고 테스트 계정(admin/editor/pending)을 다시 만든다.
- 테스트끼리 DB를 공유하므로 한 번에 하나씩 실행된다. 다른 워크트리에서 동시에 돌리지 않는다.
