# FE — Feature-Sliced Design

FE 코드는 `src/`에 [Feature-Sliced Design](https://feature-sliced.design/)으로 둔다. Next.js 라우팅 폴더 `app/`이 FSD의 app 레이어 역할을 한다.

## 레이어

위에서 아래로만 import한다. 같은 레이어의 다른 슬라이스는 import하지 않는다.

| 레이어 | 무엇을 두나 | 예 |
|---|---|---|
| `app/` (Next) | 라우트 파일, 레이아웃, 전역 스타일. 라우트 파일은 views를 다시 내보내기만 한다 | `export { SentencesPage as default } from '@/views/sentences'` |
| `views` | 페이지 하나의 화면. 가드 호출, 데이터 조회, 위젯 배치 | `SentencesPage` |
| `widgets` | 여러 feature·entity를 묶은 독립 화면 블록. 데이터는 props로 받는다 | `SentenceTable`, `AdminHeader` |
| `features` | 사용자 동작 하나 (폼 + 서버 액션) | `sentence-editor`, `delete-sentence` |
| `entities` | 도메인 객체의 타입, 라벨, 조회 함수, 페이지 가드 | `user`, `sentence`, `source` |
| `shared` | 도메인을 모르는 코드: UI 키트, BE 호출 도구, 설정 | `shared/ui/button`, `shared/api/client` |

> FSD의 `pages` 레이어 이름을 `views`로 쓴다. Next.js가 `src/pages`를 Pages Router로 인식하는 충돌을 피하기 위해서다.

`@contracts/*`는 어느 레이어에서든 import할 수 있다 (`shared`보다 아래로 취급).

## 슬라이스와 세그먼트

```
features/sentence-editor/
├── index.ts          공개 API (클라이언트에서 import해도 안전한 것만)
├── server.ts         서버 전용 공개 API (필요할 때만, 'server-only')
├── ui/               컴포넌트
├── api/              서버 액션, BE 호출
├── model/            상태, 업무 로직, 가드
└── lib/              슬라이스 안에서만 쓰는 도우미
```

- 슬라이스 밖에서는 **`index.ts` 또는 `server.ts`로만** import한다. `@/entities/user/model/roles` 같은 깊은 경로는 lint 에러다.
- 슬라이스 안에서는 상대 경로(`../api/actions`)를 쓴다.
- `shared`는 슬라이스가 없으므로 세그먼트 파일을 바로 import한다 (`@/shared/ui/button`).

### 왜 `server.ts`를 따로 두나

`index.ts`가 서버 전용 모듈(`cookies()`를 쓰는 조회 함수 등)을 다시 내보내면, 클라이언트 컴포넌트가 타입이나 라벨 하나만 가져가도 서버 코드가 번들에 끌려 들어와 빌드가 깨진다. 그래서

- `index.ts`: 타입, 상수, 순수 함수, 클라이언트 컴포넌트, 서버 액션
- `server.ts`: 서버 컴포넌트·서버 액션에서만 부르는 함수 (`getCurrentUser`, `listSentences`, `requireAdmin`)

로 나눈다.

## 데이터 흐름

| 상황 | 방법 |
|---|---|
| 조회 (서버 컴포넌트) | `entities/*/server.ts`의 조회 함수 → `apiGet()` |
| 변경 (폼 제출, 버튼) | `features/*/api/actions.ts`의 서버 액션 → `apiRequest()` → 성공 시 `redirect()` 또는 `refresh()` |
| 페이지 접근 제어 | `entities/user/server.ts`의 `requireSentenceManager()`, `requireAdmin()` |

- BE 호출은 **항상 `src/shared/api/client.ts`를 통한다**. `fetch('/api/...')`를 직접 쓰지 않는다.
- 응답 실패는 `{ ok: false, status, error: { code, message, fieldErrors? } }`로 온다. `VALIDATION_FAILED`면 `fieldErrors`를 폼에 보여주고, 4xx의 `message`는 그대로 사용자에게 보여줘도 된다. 5xx는 화면에 맞는 문구로 바꾼다.
- 세션·DB를 읽는 컴포넌트는 반드시 `<Suspense>` 안에 둔다 (`cacheComponents` 사용 중. 어기면 `pnpm build`가 실패한다).

## 새 화면을 추가할 때

1. 필요한 BE API가 없으면 먼저 BE에 추가한다 ([backend.md](backend.md)).
2. 조회 함수: `entities/<도메인>/api/` + `server.ts`에 내보내기
3. 사용자 동작: `features/<동작>/` (ui + api/actions.ts) + `index.ts`
4. 화면 블록이 크면 `widgets/<이름>/`
5. 페이지: `views/<페이지>/ui/<페이지>-page.tsx` + `index.ts`
6. 라우트: `app/.../page.tsx`에서 `export { XPage as default } from '@/views/<페이지>'`
7. `pnpm lint`로 경계 확인
