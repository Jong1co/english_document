# 영어 문장 어드민

영어 문장(`sentence` / `meaning` / `description`)과 출처(`sources` 1 : N `sentences`)를 수집·관리하는 어드민입니다.
Next.js 16 + Supabase(Postgres, Auth) + Vercel.

## 권한

| 역할 | 할 수 있는 일 |
|---|---|
| `pending` | 가입 직후 상태. 승인 대기 화면만 볼 수 있음 |
| `editor` | 문장·출처 관리 |
| `admin` | 문장·출처 관리 + 회원 권한 변경 (자기 자신 제외) |

권한은 DB의 RLS가 최종적으로 막고, 서버 액션도 매번 역할을 다시 확인합니다.

## 로컬 실행

Docker Desktop이 실행 중이어야 합니다.

```bash
pnpm install
pnpm supabase start          # 로컬 Supabase (마이그레이션 자동 적용)
pnpm supabase status         # API URL, Publishable key 확인
```

`.env.local`(또는 `.env`)에 값을 넣습니다. 형식은 `.env.example` 참고.

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

```bash
pnpm dev
```

로컬 Studio(http://127.0.0.1:54323)의 SQL Editor에서 첫 admin을 지정합니다.

```sql
update public.profiles set role = 'admin' where email = '<가입한 이메일>';
```

## 테스트

| 명령 | 내용 |
|---|---|
| `pnpm test` | 단위 테스트 (Vitest) — 입력 검증, 검색어 처리, 역할 판정 |
| `pnpm test:db` | DB 권한 테스트 (pgTAP) — 역할별 RLS, 가입 트리거, 출처 삭제 제한 |
| `pnpm test:e2e` | 브라우저 테스트 (Playwright) — 로그인, 문장 관리, 회원 관리 |

`test:db`와 `test:e2e`는 로컬 Supabase가 실행 중이어야 합니다.
e2e는 `.env`의 값과 상관없이 **항상 로컬 Supabase**에 붙고, 시작할 때 로컬의 문장·출처 데이터를 지웁니다. 원격 URL이면 실행을 거부합니다.

스키마를 바꾼 뒤에는 타입을 다시 생성합니다.

```bash
pnpm supabase migration new <name>   # supabase/migrations/에 SQL 작성
pnpm supabase db reset               # 로컬에 적용
pnpm db:types                        # lib/supabase/database.types.ts 갱신
```

## 원격 Supabase · Vercel 연결

```bash
pnpm supabase login
pnpm supabase link --project-ref <project-ref>
pnpm supabase db push                # supabase/migrations/를 원격 DB에 적용
```

1. Supabase 대시보드 → Authentication → Sign In / Providers → Email에서 **Confirm email을 끕니다.**
   접근은 admin 승인으로 통제합니다. 켜 두면 확인 링크를 처리하는 라우트가 추가로 필요합니다.
2. 첫 계정으로 가입한 뒤 SQL Editor에서 admin을 지정합니다(위 SQL과 동일).
3. Vercel 프로젝트 → Settings → Environment Variables에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`만 등록합니다. 시크릿 키는 넣지 않습니다.

## 구조

```
proxy.ts                     세션 갱신 + 비로그인 리다이렉트 (Next 16의 middleware)
lib/supabase/                서버 클라이언트, 세션 갱신, 생성된 DB 타입
lib/auth/                    역할 판정, 현재 사용자(DAL)
lib/sentences/               입력 검증, 검색, 조회
app/(auth)/                  로그인, 가입
app/(admin)/sentences/       문장 관리
app/(admin)/members/         회원 관리
supabase/migrations/         스키마 + RLS
supabase/tests/database/     pgTAP 권한 테스트
e2e/                         Playwright 테스트
```

`next.config.ts`에서 `cacheComponents`가 켜져 있습니다. 세션이나 DB를 읽는 컴포넌트는 반드시 `<Suspense>` 안에 두어야 하며, 그렇지 않으면 `pnpm build`가 실패합니다.
