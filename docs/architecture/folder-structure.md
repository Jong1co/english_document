# 폴더 구조

```
.
├── app/                         Next.js 라우팅 (= FSD app 레이어)
│   ├── layout.tsx               루트 레이아웃, 폰트
│   ├── globals.css              전역 스타일 (Tailwind, shadcn 토큰)
│   ├── not-found.tsx            → @/views/not-found
│   ├── (auth)/                  비로그인 화면 그룹
│   │   ├── layout.tsx           가운데 정렬 카드 레이아웃
│   │   ├── login/page.tsx       → @/views/login
│   │   └── signup/page.tsx      → @/views/signup
│   ├── (admin)/                 로그인 후 화면 그룹
│   │   ├── layout.tsx           헤더(@/widgets/admin-header) + 본문
│   │   ├── sentences/…          → @/views/sentences, sentence-new, sentence-edit
│   │   └── members/page.tsx     → @/views/members
│   ├── pending/page.tsx         → @/views/pending
│   └── api/[...path]/route.ts   BE를 /api/* 에 마운트 (→ @server). 버전(/api/v1)은 BE 라우터가 처리
│
├── proxy.ts                     세션 갱신 + 비로그인 리다이렉트 (Next 16의 middleware)
│
├── src/                         FE — Feature-Sliced Design
│   ├── views/                   페이지 단위 화면 (FSD pages 레이어)
│   │   └── <page>/  index.ts, ui/
│   ├── widgets/                 여러 기능을 조합한 화면 블록
│   │   ├── admin-header/        상단 헤더, 메뉴, 로그아웃
│   │   ├── sentence-table/      검색, 문장 목록, 페이지네이션
│   │   └── member-table/        회원 목록
│   ├── features/                사용자 동작 하나 = 슬라이스 하나
│   │   ├── auth/                로그인, 가입, 로그아웃
│   │   ├── sentence-editor/     문장 생성·수정 폼, 출처 추가
│   │   ├── delete-sentence/     문장 삭제
│   │   └── change-member-role/  회원 역할 변경
│   ├── entities/                도메인 객체: 타입, 표시용 라벨, 조회
│   │   ├── user/                현재 사용자, 회원, 역할, 페이지 가드
│   │   ├── sentence/            문장 조회
│   │   └── source/              출처 조회, 유형 라벨
│   └── shared/                  도메인을 모르는 공용 코드
│       ├── api/                 BE 호출 (client.ts, backend.ts, set-cookie.ts)
│       ├── config/              라우트 경로 상수
│       ├── lib/                 cn, 날짜 포맷
│       └── ui/                  shadcn 컴포넌트, NativeSelect
│
├── server/                      BE — MVC (+ Service)
│   ├── index.ts                 공개 진입점 handleApiRequest(Request) → Response
│   ├── routes.ts                API 라우팅 표 (메서드 + 경로 → 컨트롤러)
│   ├── controllers/             입력 파싱·검증, 권한 확인, 서비스 호출, 응답 만들기
│   ├── services/                업무 규칙 (자기 역할 변경 금지, 페이지 계산 등)
│   ├── models/                  DB 접근 (Supabase 쿼리). 테이블 행 타입 반환
│   ├── views/                   DB 행 → 응답 DTO 변환 (snake_case → camelCase)
│   ├── lib/                     라우터, 에러, HTTP 응답, 요청 컨텍스트, 쿠키
│   ├── db/                      요청별 Supabase 클라이언트, 생성된 DB 타입
│   └── config/                  환경 변수
│
├── contracts/                   FE↔BE 계약 (zod만 의존)
│   ├── common.ts                에러 코드, 에러 응답 형식, 검증 헬퍼
│   ├── auth.ts                  역할, 권한 판정, 로그인·가입 요청/응답
│   ├── sentence.ts              문장 DTO, 요청 스키마
│   ├── source.ts                출처 DTO, 요청 스키마
│   └── member.ts                회원 DTO, 역할 변경 요청
│
├── supabase/                    BE 소유. 마이그레이션, RLS, pgTAP 테스트, 로컬 설정
├── e2e/                         Playwright 테스트 (브라우저로 전체 흐름 확인)
├── docs/                        프로젝트 문서 (목차는 AGENTS.md)
└── public/                      정적 파일
```

## 경로 별칭

| 별칭 | 가리키는 곳 | 쓰는 곳 |
|---|---|---|
| `@/*` | `src/*` | FE (`app/`, `src/`, `proxy.ts`) |
| `@server` | `server/index.ts` | `app/api/`, `src/shared/api/backend.ts`만 |
| `@contracts/*` | `contracts/*` | FE, BE 모두 |

`server/` 안에서는 상대 경로를 쓴다. 분리할 때 별칭 설정 없이 옮길 수 있다.

## 파일 이름

- 파일·폴더: `kebab-case` (`sentence-form.tsx`, `change-member-role/`)
- BE 계층 파일: `<도메인>.<계층>.ts` (`sentence.controller.ts`, `sentence.service.ts`)
- 테스트: 대상 옆에 `<이름>.test.ts`
