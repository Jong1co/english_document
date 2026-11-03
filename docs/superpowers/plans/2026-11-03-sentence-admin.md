# 문장 수집 어드민 1차 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인·권한이 있는 어드민에서 문장(sentence / meaning / description)과 출처(sources 1:N sentences)를 등록·조회·수정·삭제한다.

**Architecture:** Next.js 16 App Router + Supabase(Postgres, Auth). 권한은 DB의 RLS가 최종 방어선이고, 서버 액션은 매번 DAL로 역할을 재확인하며, `proxy.ts`는 세션 갱신과 로그인 리다이렉트만 한다. 화면은 서버 컴포넌트 + 서버 액션 폼.

**Tech Stack:** Next.js 16.4.4, React 19.3, TypeScript, Tailwind 4 + shadcn/ui, `@supabase/ssr` + `@supabase/supabase-js`, zod, Supabase CLI(로컬 Docker), Vitest, pgTAP(`supabase test db`), Playwright.

**Spec:** 별도 설계 문서 없음(설계는 사용자가 함). 2026-11-03 대화에서 합의한 범위를 아래에 그대로 옮긴다.

### 합의된 범위

- `sources` 1 : N `sentences`. 문장 필드는 `sentence`, `meaning`, `description`.
- 직접 입력한 문장은 출처 없이 저장 가능 (`source_id` nullable).
- `sources`는 `type`, `title`, `url`. 출처는 문장 폼에서 선택하거나 새로 추가한다. 출처 관리 전용 페이지는 이번 범위에서 제외.
- 권한: `admin`(회원 관리 + 문장 관리), `editor`(문장 관리). 가입 직후는 `pending`(아무것도 못 함). 첫 admin은 SQL로 지정.
- 문장 삭제는 hard delete. 문장이 연결된 출처는 삭제 불가(FK restrict).
- 화면: 로그인, 가입, 승인 대기, 문장 관리(목록·검색·추가·수정·삭제), 회원 관리(권한 변경, admin 전용).
- 범위 밖: 유저별 문장 할당, 크롤링/유튜브 수집, 복습 기능.

## Global Constraints

- 코드 작성 전 해당 주제의 `node_modules/next/dist/docs/` 문서를 읽는다 (AGENTS.md). 특히 `01-app/02-guides/authentication-with-cache-components.md`, `01-app/01-getting-started/16-proxy.md`, `01-app/01-getting-started/07-mutating-data.md`.
- `next.config.ts`의 `cacheComponents: true`, `partialPrefetching: true`는 유지한다. 그 결과 `createClient()`(서버)·DAL·`searchParams`·`params`를 읽는 컴포넌트는 반드시 `<Suspense>` 안에서 렌더링하고, layout 최상단에서 await하지 않는다. 위반 시 `pnpm build`가 실패한다.
- 미들웨어 파일은 `proxy.ts`(named export `proxy`), Node 런타임. `runtime` export 금지.
- 사용자 데이터는 `use cache`로 캐시하지 않는다 (RLS·역할에 따라 결과가 다름).
- 앱 env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. 시크릿 키(`SUPABASE_SECRET_KEY`)는 e2e 셋업에서만 사용하고 `app/`, `lib/`에서 import 금지.
- 모든 서버 액션은 DAL(`requireSentenceManager` / `requireAdmin`)로 시작한다. proxy를 권한 체크로 믿지 않는다.
- UI 문구는 한국어.
- 패키지 매니저는 pnpm.
- `supabase start`, `pnpm test:db`, `pnpm test:e2e`는 Docker Desktop이 실행 중이어야 한다.

## Review Focus

1. 검색어에 `%`, `_`, `\` 포함 (예: `50%`) → 와일드카드가 아니라 글자 그대로 검색돼야 함. → Task 4 `escapeLike` 단위 테스트 + e2e "특수문자 검색".
2. 잘못된 UUID 또는 없는 id로 `/sentences/<id>/edit` 접근 → 500이 아니라 404. → Task 4 e2e "없는 문장 수정 URL".
3. admin이 자기 자신의 권한을 바꿔 아무도 admin이 아닌 상태가 됨 → 자기 자신의 권한은 변경 불가. → Task 5 e2e "자기 권한 변경 불가".
4. 공백만 입력한 문장/뜻 → 저장되지 않고 필드 오류 표시. → Task 4 `parseSentenceForm` 단위 테스트.
5. 페이지 번호 `?page=abc`, `?page=-1`, `?page=1.5` → 1페이지로 보정. → Task 4 `parseListParams` 단위 테스트.

---

## File Structure

```
proxy.ts                                  세션 갱신 + 비로그인 리다이렉트
next.config.ts                            (수정) "/" → "/sentences" redirect
supabase/config.toml                      supabase init 생성
supabase/migrations/20261103000000_init.sql   스키마 + RLS
supabase/tests/database/rls.test.sql      pgTAP 권한 테스트
lib/supabase/database.types.ts            생성 파일 (pnpm db:types)
lib/supabase/server.ts                    서버용 Supabase 클라이언트
lib/supabase/proxy.ts                     updateSession()
lib/auth/roles.ts (+ roles.test.ts)       역할 판정 (순수 함수)
lib/auth/dal.ts                           현재 사용자 조회·역할 강제
lib/sentences/schema.ts (+ .test.ts)      폼 검증 (zod)
lib/sentences/search.ts (+ .test.ts)      검색어 이스케이프, 페이지 파라미터
lib/sentences/queries.ts                  목록·단건·출처 조회
app/(auth)/login/page.tsx                 로그인
app/(auth)/signup/page.tsx                가입
app/(auth)/actions.ts                     signIn / signUp / signOut
app/(auth)/auth-form.tsx                  로그인·가입 공용 클라이언트 폼
app/pending/page.tsx                      승인 대기
app/(admin)/layout.tsx                    상단 네비게이션
app/(admin)/admin-nav.tsx                 역할별 메뉴 (Suspense 안)
app/(admin)/sentences/page.tsx            목록·검색·페이지네이션
app/(admin)/sentences/new/page.tsx        추가
app/(admin)/sentences/[id]/edit/page.tsx  수정
app/(admin)/sentences/actions.ts          create/update/deleteSentence, createSource
app/(admin)/sentences/sentence-form.tsx   추가·수정 공용 클라이언트 폼
app/(admin)/sentences/source-dialog.tsx   출처 추가 다이얼로그
app/(admin)/sentences/delete-button.tsx   삭제 확인
app/(admin)/members/page.tsx              회원 목록
app/(admin)/members/actions.ts            updateMemberRole
app/(admin)/members/role-select.tsx       권한 변경 select
components/ui/*                           shadcn 생성
e2e/local-env.ts                          로컬 Supabase 접속값 읽기
e2e/global-setup.ts                       테스트 계정·데이터 초기화
e2e/helpers.ts                            login()
e2e/auth.spec.ts, e2e/sentences.spec.ts, e2e/members.spec.ts
playwright.config.ts, vitest.config.mts, .env.example
```

---

### Task 1: Supabase 로컬 환경, 스키마, RLS

**Files:**
- Create: `supabase/` (via `supabase init`), `supabase/migrations/20261103000000_init.sql`, `supabase/tests/database/rls.test.sql`, `lib/supabase/database.types.ts`
- Modify: `package.json` (devDependency `supabase`, scripts), `.gitignore`

**Interfaces:**
- Produces: 테이블 `public.profiles`, `public.sources`, `public.sentences`; enum `public.user_role('pending','editor','admin')`, `public.source_type('manual','web','youtube','document')`; 함수 `public.app_role()`; 생성 컬럼 `sentences.search_text`; 타입 `Database` (`lib/supabase/database.types.ts`).

- [ ] **Step 1: 스캐폴드 커밋과 브랜치**

현재 저장소는 커밋이 없다. `.gitignore`에 `!.env.example` 한 줄을 추가한 뒤 기존 파일 전체를 `chore: initial Next.js scaffold`로 main에 커밋하고, `feat/sentence-admin` 브랜치를 만든다.

- [ ] **Step 2: Supabase CLI 설치·초기화**

```bash
pnpm add -D supabase
pnpm supabase init
```
`package.json` scripts 추가: `"test:db": "supabase test db"`, `"db:types": "supabase gen types typescript --local > lib/supabase/database.types.ts"`.
`supabase/config.toml`의 `[auth.email] enable_confirmations = false`인지 확인한다. 로컬에서는 가입 즉시 세션이 생겨야 e2e가 동작한다.
Docker Desktop 실행 후 `pnpm supabase start` → 출력에 `API URL`이 보이면 성공.

- [ ] **Step 3: 실패하는 pgTAP 테스트 작성** — `supabase/tests/database/rls.test.sql`

`begin; select plan(N); … select * from finish(); rollback;` 구조. 셋업은 postgres 권한으로 `auth.users`에 3명(admin/editor/pending)을 insert(`raw_user_meta_data`에 `{"name": "..."}`)하고, `profiles.role`을 각각 지정하고, 출처 1개와 그 출처에 연결된 문장 1개를 넣는다. 사용자 전환은 `set local role authenticated; select set_config('request.jwt.claims', json_build_object('sub', <id>, 'role', 'authenticated')::text, true);`, anon은 `set local role anon;`.

반드시 포함할 단언:
```sql
-- 가입 트리거
select is((select role::text from public.profiles where id = :pending_id), 'pending', 'new user gets pending role');
select is((select name from public.profiles where id = :editor_id), 'Editor', 'name copied from metadata');
-- anon
select is((select count(*) from public.sentences)::int, 0, 'anon sees no sentences');
-- pending
select is((select count(*) from public.sentences)::int, 0, 'pending sees no sentences');
select throws_ok($$ insert into public.sentences (sentence, meaning) values ('a', 'b') $$, '42501', null, 'pending cannot insert');
-- editor
select is((select count(*) from public.sentences where id = :sentence_id)::int, 1, 'editor sees sentences');
select lives_ok($$ insert into public.sentences (sentence, meaning) values ('Hi', '안녕') $$, 'editor inserts without source');
select is((select created_by from public.sentences where sentence = 'Hi'), :editor_id, 'created_by defaults to auth.uid()');
select ok((select search_text from public.sentences where sentence = 'Hi') like 'Hi 안녕%', 'search_text combines fields');
select throws_ok($$ delete from public.sources where id = :source_id $$, '23503', null, 'source with sentences cannot be deleted');
select is((select count(*) from public.profiles)::int, 1, 'editor sees only own profile');
update public.profiles set role = 'admin' where id = :editor_id;
select is((select role::text from public.profiles where id = :editor_id), 'editor', 'editor cannot promote self');
-- admin
select is((select count(*) from public.profiles where id in (:admin_id, :editor_id, :pending_id))::int, 3, 'admin sees all profiles');
update public.profiles set role = 'editor' where id = :pending_id;
select is((select role::text from public.profiles where id = :pending_id), 'editor', 'admin can change roles');
```
(`:x_id`는 셋업에서 고정 UUID 리터럴로 치환해 쓴다. 로컬 DB에 e2e 데이터가 남아 있어도 깨지지 않도록, 개수 단언은 테스트가 만든 id로 범위를 좁힌다. 단, "본인 행만 보임"·"0건" 단언은 예외.)

- [ ] **Step 4: 실패 확인**

Run: `pnpm test:db` → Expected: FAIL (`relation "public.profiles" does not exist`)

- [ ] **Step 5: 마이그레이션 작성** — `supabase/migrations/20261103000000_init.sql`

```sql
create type public.user_role as enum ('pending', 'editor', 'admin');
create type public.source_type as enum ('manual', 'web', 'youtube', 'document');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  role public.user_role not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  type public.source_type not null,
  title text not null check (btrim(title) <> ''),
  url text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.sentences (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sources (id) on delete restrict,
  sentence text not null check (btrim(sentence) <> ''),
  meaning text not null check (btrim(meaning) <> ''),
  description text,
  search_text text generated always as
    (sentence || ' ' || meaning || ' ' || coalesce(description, '')) stored,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sentences_source_id_idx on public.sentences (source_id);
create index sentences_created_at_idx on public.sentences (created_at desc);

create function public.set_updated_at() returns trigger
  language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger sentences_set_updated_at before update on public.sentences
  for each row execute function public.set_updated_at();

create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, nullif(btrim(new.raw_user_meta_data ->> 'name'), ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.app_role() returns public.user_role
  language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.sources enable row level security;
alter table public.sentences enable row level security;

create policy "profiles_select_self_or_admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.app_role()) = 'admin');
create policy "profiles_update_admin" on public.profiles for update to authenticated
  using ((select public.app_role()) = 'admin')
  with check ((select public.app_role()) = 'admin');

create policy "sources_managers_all" on public.sources for all to authenticated
  using ((select public.app_role()) in ('editor', 'admin'))
  with check ((select public.app_role()) in ('editor', 'admin'));
create policy "sentences_managers_all" on public.sentences for all to authenticated
  using ((select public.app_role()) in ('editor', 'admin'))
  with check ((select public.app_role()) in ('editor', 'admin'));
```

- [ ] **Step 6: 적용 후 통과 확인**

Run: `pnpm supabase db reset && pnpm test:db` → Expected: 모든 테스트 `ok`, `Result: PASS`

- [ ] **Step 7: 타입 생성**

Run: `pnpm db:types` → `lib/supabase/database.types.ts`에 `sentences`, `sources`, `profiles`, `user_role` 포함 확인.

- [ ] **Step 8: Commit** — `feat(db): add sentences/sources/profiles schema with RLS`

---

### Task 2: Supabase 클라이언트, proxy, 역할 판정, DAL

**Files:**
- Create: `lib/supabase/server.ts`, `lib/supabase/proxy.ts`, `proxy.ts`, `lib/auth/roles.ts`, `lib/auth/roles.test.ts`, `lib/auth/dal.ts`, `vitest.config.mts`, `.env.example`
- Modify: `package.json`

**Interfaces:**
- Consumes: `Database` (Task 1)
- Produces:
  - `createClient(): Promise<SupabaseClient<Database>>` — `lib/supabase/server.ts`
  - `updateSession(request: NextRequest): Promise<NextResponse>` — `lib/supabase/proxy.ts`
  - `type Role = Database['public']['Enums']['user_role']`
  - `canManageSentences(role: Role): boolean`, `canManageMembers(role: Role): boolean`, `homePathFor(role: Role): '/sentences' | '/pending'` — `lib/auth/roles.ts`
  - `type CurrentUser = { id: string; email: string; name: string | null; role: Role }`
  - `getCurrentUser(): Promise<CurrentUser | null>`, `requireSentenceManager(): Promise<CurrentUser>`, `requireAdmin(): Promise<CurrentUser>` — `lib/auth/dal.ts`

- [ ] **Step 1: 의존성·테스트 도구**

```bash
pnpm add @supabase/ssr @supabase/supabase-js zod server-only
pnpm add -D vitest vite-tsconfig-paths
```
`vitest.config.mts`: `plugins: [tsconfigPaths()]`, `test: { environment: 'node', include: ['lib/**/*.test.ts'] }`. script `"test": "vitest run"`.
`.env.example`: `NEXT_PUBLIC_SUPABASE_URL=`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=`. 로컬 `.env.local`에는 `pnpm supabase status`의 API URL과 publishable(anon) key를 넣는다.

- [ ] **Step 2: 실패하는 테스트** — `lib/auth/roles.test.ts`

```ts
expect(canManageSentences('admin')).toBe(true)
expect(canManageSentences('editor')).toBe(true)
expect(canManageSentences('pending')).toBe(false)
expect(canManageMembers('admin')).toBe(true)
expect(canManageMembers('editor')).toBe(false)
expect(homePathFor('pending')).toBe('/pending')
expect(homePathFor('editor')).toBe('/sentences')
```

- [ ] **Step 3: 실패 확인** — `pnpm test` → FAIL (module not found)

- [ ] **Step 4: `lib/auth/roles.ts` 구현** 후 `pnpm test` → PASS

- [ ] **Step 5: Supabase 클라이언트와 proxy**

- `lib/supabase/server.ts`: `import 'server-only'`. `createServerClient<Database>`에 `cookies()`의 `getAll` / `setAll`을 연결한다. `setAll`은 서버 컴포넌트에서 호출될 때 던지므로 try/catch로 무시한다.
- `lib/supabase/proxy.ts` `updateSession`: 요청 쿠키로 클라이언트를 만들고 `supabase.auth.getClaims()`로 세션을 갱신한다. 그 뒤:
  - claims가 없고 경로가 `/login`·`/signup`이 아니면 `/login`으로 redirect
  - claims가 있고 경로가 `/login`·`/signup`이면 `/sentences`로 redirect
  - 그 외에는 갱신된 쿠키를 실은 response를 반환
- `proxy.ts`: `export async function proxy(request: NextRequest) { return updateSession(request) }`. matcher는 `'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'`.

- [ ] **Step 6: DAL** — `lib/auth/dal.ts`

`import 'server-only'`. `getCurrentUser`는 React `cache()`로 감싸고 다음 순서로 동작한다.
1. `getClaims()`로 `sub`를 얻는다.
2. `profiles`에서 `id, email, name, role`을 조회한다.
3. 둘 중 하나라도 없으면 `null`을 반환한다.

`requireSentenceManager`:
- 사용자가 `null`이면 `redirect('/login')`
- `canManageSentences`가 false면 `redirect('/pending')`

`requireAdmin`:
- 사용자가 `null`이면 `redirect('/login')`
- `pending`이면 `redirect('/pending')`
- `editor`면 `redirect('/sentences')`

- [ ] **Step 7: 검증** — `pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 모두 통과

- [ ] **Step 8: Commit** — `feat(auth): add supabase clients, proxy session refresh, role DAL`

---

### Task 3: 로그인·가입·로그아웃·승인 대기 화면

**Files:**
- Create: `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, `app/(auth)/actions.ts`, `app/(auth)/auth-form.tsx`, `app/pending/page.tsx`, `app/(admin)/layout.tsx`, `app/(admin)/admin-nav.tsx`, `app/(admin)/sentences/page.tsx`(자리용 — Task 4에서 확장), `components/ui/*`, `playwright.config.ts`, `e2e/local-env.ts`, `e2e/global-setup.ts`, `e2e/helpers.ts`, `e2e/auth.spec.ts`
- Modify: `app/layout.tsx` (lang `ko`, title `영어 문장 어드민`), `next.config.ts` (`redirects`: `/` → `/sentences`, `permanent: false`), `package.json`
- Delete: `app/page.tsx`

**Interfaces:**
- Consumes: `createClient`, `getCurrentUser`, `homePathFor` (Task 2)
- Produces:
  - `type AuthFormState = { message?: string } | null`
  - `signIn(prev: AuthFormState, formData: FormData): Promise<AuthFormState>`, `signUp(prev: AuthFormState, formData: FormData): Promise<AuthFormState>`, `signOut(): Promise<void>` — `app/(auth)/actions.ts`
  - e2e: `login(page: Page, role: 'admin' | 'editor' | 'pending'): Promise<void>`, 계정 상수 `TEST_USERS` — `e2e/helpers.ts`

- [ ] **Step 1: UI·e2e 도구**

```bash
pnpm dlx shadcn@latest init -d
pnpm dlx shadcn@latest add button input textarea label table alert-dialog dialog badge
pnpm add -D @playwright/test && pnpm exec playwright install chromium
```

`e2e/local-env.ts`:
- `getLocalSupabaseEnv(): { url: string; publishableKey: string; secretKey: string }`
- `pnpm supabase status -o json`를 실행해 다음 키를 읽는다.
  - `url` ← `API_URL`
  - `publishableKey` ← `PUBLISHABLE_KEY`, 없으면 `ANON_KEY`
  - `secretKey` ← `SECRET_KEY`, 없으면 `SERVICE_ROLE_KEY`
- `url`의 host가 `127.0.0.1`이나 `localhost`가 아니면 throw한다. 원격 DB 초기화를 막기 위한 장치다.

`playwright.config.ts`:
- `webServer`: `pnpm dev --port 3100`, `reuseExistingServer: false`
- `env`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 위 값으로 지정. process env가 `.env.local`보다 우선하므로, `.env.local`이 원격 프로젝트를 가리켜도 e2e는 로컬로 붙는다.
- `baseURL`: `http://localhost:3100`
- `globalSetup`: `./e2e/global-setup.ts`

`e2e/global-setup.ts`: 시크릿 키로 admin 클라이언트를 만들고 다음을 수행한다.
1. `sentences`, `sources` 전체 삭제
2. `TEST_USERS` 3명이 없으면 `auth.admin.createUser({ email_confirm: true, user_metadata: { name } })`로 생성
3. `profiles.role`을 각각 `admin` / `editor` / `pending`으로 재설정
4. 이전 실행에서 가입 테스트로 만든 `signup-*@test.local` 사용자를 삭제

script `"test:e2e": "playwright test"`.

- [ ] **Step 2: 실패하는 e2e** — `e2e/auth.spec.ts`

```ts
test('비로그인 사용자는 /sentences에서 /login으로 이동', …) // expect(page).toHaveURL(/\/login$/)
test('잘못된 비밀번호는 오류 문구', …)            // getByText('이메일 또는 비밀번호가 올바르지 않습니다.')
test('pending 로그인 → /pending, /sentences 접근도 /pending', …)
test('editor 로그인 → /sentences, 로그아웃 → /login', …)
test('가입하면 /pending으로 이동', …)            // email: `signup-${Date.now()}@test.local`
```

- [ ] **Step 3: 실패 확인** — `pnpm supabase start && pnpm test:e2e e2e/auth.spec.ts` → FAIL

- [ ] **Step 4: 구현**

`actions.ts`:
- `signIn`: 실패하면 위 오류 문구를 반환한다. 성공하면 같은 클라이언트로 `profiles`에서 `data.user.id`의 `role`을 조회한 뒤 `redirect(homePathFor(role))`.
- `signUp`: 이메일, 비밀번호(8자 이상), 이름을 받아 `options.data.name`에 넣는다.
  - `data.session`이 없으면(이메일 확인이 켜진 프로젝트) `{ message: '확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인하세요.' }`를 반환한다.
  - 세션이 있으면 `redirect('/pending')`.
- `signOut`: 로그아웃 후 `redirect('/login')`.

화면:
- `auth-form.tsx`: `useActionState`를 쓰는 클라이언트 폼. 진행 중에는 버튼을 비활성화한다.
- `app/pending/page.tsx`: 정적 제목 "관리자 승인 대기 중"을 둔다. 사용자 확인은 `<Suspense>` 안의 컴포넌트에서 한다. 사용자가 `null`이면 `/login`, `canManageSentences`가 true면 `/sentences`로 redirect. 로그아웃 버튼 포함.
- `(admin)/layout.tsx`: 정적 헤더와 `<Suspense><AdminNav/></Suspense>`, `{children}`. 세션 await 금지.
- `admin-nav.tsx`: 메뉴는 "문장"과, admin에게만 보이는 "회원". 사용자 이름과 로그아웃 버튼을 표시한다.
- `(admin)/sentences/page.tsx` (자리용): 정적 제목 "문장 관리"와, `<Suspense>` 안에서 `await requireSentenceManager()`만 하는 컴포넌트.

- [ ] **Step 5: 통과 확인** — `pnpm test:e2e e2e/auth.spec.ts` → PASS, `pnpm build` → 성공 (Suspense 누락 시 여기서 실패)

- [ ] **Step 6: Commit** — `feat(auth): add login, signup, pending pages and e2e harness`

---

### Task 4: 문장 관리 (목록·검색·추가·수정·삭제, 출처 추가)

**Files:**
- Modify: `app/(admin)/sentences/page.tsx` (Task 3의 자리용 페이지)
- Create: `lib/sentences/schema.ts`, `lib/sentences/schema.test.ts`, `lib/sentences/search.ts`, `lib/sentences/search.test.ts`, `lib/sentences/queries.ts`, `app/(admin)/sentences/new/page.tsx`, `app/(admin)/sentences/[id]/edit/page.tsx`, `app/(admin)/sentences/actions.ts`, `app/(admin)/sentences/sentence-form.tsx`, `app/(admin)/sentences/source-dialog.tsx`, `app/(admin)/sentences/delete-button.tsx`, `e2e/sentences.spec.ts`

**Interfaces:**
- Consumes: `createClient`, `requireSentenceManager` (Task 2), `login`, `TEST_USERS` (Task 3)
- Produces:
  - `type SentenceInput = { sentence: string; meaning: string; description: string | null; sourceId: string | null }`
  - `type SourceInput = { type: 'manual' | 'web' | 'youtube' | 'document'; title: string; url: string | null }`
  - `type FieldErrors<T> = Partial<Record<keyof T, string>>`
  - `parseSentenceForm(fd: FormData): { ok: true; data: SentenceInput } | { ok: false; fieldErrors: FieldErrors<SentenceInput> }`
  - `parseSourceForm(fd: FormData): { ok: true; data: SourceInput } | { ok: false; fieldErrors: FieldErrors<SourceInput> }` — `lib/sentences/schema.ts`
  - `PAGE_SIZE = 20`, `escapeLike(input: string): string`, `parseListParams(sp: { q?: string | string[]; page?: string | string[] }): { q: string; page: number }`, `pageRange(page: number): { from: number; to: number }` — `lib/sentences/search.ts`
  - `type SourceOption = { id: string; type: SourceInput['type']; title: string; url: string | null }`
  - `type SentenceRow = { id: string; sentence: string; meaning: string; description: string | null; created_at: string; updated_at: string; source: SourceOption | null }`
  - `listSentences(p: { q: string; page: number }): Promise<{ rows: SentenceRow[]; total: number }>`, `getSentence(id: string): Promise<SentenceRow | null>`, `listSources(): Promise<SourceOption[]>` — `lib/sentences/queries.ts`
  - `type SentenceFormState = { fieldErrors?: FieldErrors<SentenceInput>; message?: string } | null`
  - `type SourceFormState = { fieldErrors?: FieldErrors<SourceInput>; message?: string; source?: SourceOption } | null`
  - `createSentence(prev: SentenceFormState, fd: FormData): Promise<SentenceFormState>`, `updateSentence(id: string, prev: SentenceFormState, fd: FormData): Promise<SentenceFormState>`, `deleteSentence(id: string): Promise<void>`, `createSource(prev: SourceFormState, fd: FormData): Promise<SourceFormState>` — `app/(admin)/sentences/actions.ts`

- [ ] **Step 1: 실패하는 단위 테스트** — `lib/sentences/search.test.ts`, `lib/sentences/schema.test.ts`

```ts
// search
expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\')
expect(parseListParams({})).toEqual({ q: '', page: 1 })
expect(parseListParams({ q: '  hello ', page: '3' })).toEqual({ q: 'hello', page: 3 })
expect(parseListParams({ q: ['a', 'b'], page: ['2', '5'] })).toEqual({ q: 'a', page: 2 })
for (const bad of ['abc', '-1', '0', '1.5', '']) expect(parseListParams({ page: bad }).page).toBe(1)
expect(pageRange(1)).toEqual({ from: 0, to: 19 })
expect(pageRange(3)).toEqual({ from: 40, to: 59 })

// schema
const fd = (o: Record<string, string>) => { const f = new FormData(); for (const k in o) f.set(k, o[k]); return f }
expect(parseSentenceForm(fd({ sentence: ' Hi ', meaning: ' 안녕 ', description: '', sourceId: '' })))
  .toEqual({ ok: true, data: { sentence: 'Hi', meaning: '안녕', description: null, sourceId: null } })
const blank = parseSentenceForm(fd({ sentence: '   ', meaning: '\n', description: '', sourceId: '' }))
expect(blank.ok).toBe(false) // fieldErrors.sentence === '문장을 입력하세요.', fieldErrors.meaning === '뜻을 입력하세요.'
expect(parseSentenceForm(fd({ sentence: 'a', meaning: 'b', sourceId: 'not-a-uuid' })).ok).toBe(false)
expect(parseSentenceForm(fd({ sentence: 'a'.repeat(1001), meaning: 'b' })).ok).toBe(false)
expect(parseSourceForm(fd({ type: 'web', title: 'Blog', url: 'ftp://x' })).ok).toBe(false)
expect(parseSourceForm(fd({ type: 'youtube', title: ' 영상 ', url: '' })))
  .toEqual({ ok: true, data: { type: 'youtube', title: '영상', url: null } })
```
제한값: `sentence`·`meaning`은 trim 후 1–1000자, `description`은 trim 후 최대 5000자(빈 값은 `null`), `sourceId`는 uuid(빈 값은 `null`). `title`은 trim 후 1–200자, `url`은 `http(s)://`만 허용(빈 값은 `null`).

- [ ] **Step 2: 실패 확인** — `pnpm test` → FAIL

- [ ] **Step 3: `search.ts`, `schema.ts` 구현** 후 `pnpm test` → PASS

- [ ] **Step 4: 실패하는 e2e** — `e2e/sentences.spec.ts` (editor로 로그인)

```ts
test('새 출처와 함께 문장 추가 → 목록에 표시', …)
  // 출처 다이얼로그에서 type=youtube, title='Cebu vlog' 추가 → 셀렉트에 선택된 상태
  // sentence='Did you sleep well?', meaning='잘 잤어?', description='지난밤 잠에 대해 묻는다.'
  // 저장 후 /sentences, 행에 'Did you sleep well?'와 'Cebu vlog'
test('출처 없이 추가 가능', …)
test('공백만 입력하면 필드 오류', …)               // getByText('문장을 입력하세요.')
test('수정하면 목록에 반영', …)
test('삭제 확인 후 목록에서 사라짐', …)            // 다이얼로그 문구 '이 문장을 삭제할까요? 되돌릴 수 없습니다.'
test('특수문자 검색은 글자 그대로', …)            // 'Save 50% now'와 'Save 500 now' 추가 → ?q=50% 결과 1건
test('없는 문장 수정 URL은 404', …)              // /sentences/not-a-uuid/edit, /sentences/<random uuid>/edit 모두 404
test('세션이 끊긴 상태로 저장하면 /login', …)       // 폼을 연 뒤 context.clearCookies() → 저장 → /login
```

- [ ] **Step 5: 실패 확인** — `pnpm test:e2e e2e/sentences.spec.ts` → FAIL

- [ ] **Step 6: 쿼리와 액션 구현**

`queries.ts` (`import 'server-only'`):
- `listSentences`
  - select: `id, sentence, meaning, description, created_at, updated_at, source:sources(id, type, title, url)`, `{ count: 'exact' }`
  - 정렬: `created_at desc`, 범위: `pageRange(page)`
  - `q`가 있으면 `.ilike('search_text', \`%${escapeLike(q)}%\`)`
- `getSentence`: uuid 형식이 아니면 DB 조회 없이 `null`을 반환한다. 조회는 `.maybeSingle()`을 쓴다.
- 쿼리 에러는 throw한다.

`actions.ts` (`'use server'`): 각 함수 첫 줄은 `await requireSentenceManager()`.
- `createSentence` / `updateSentence`
  - 검증에 실패하면 `fieldErrors`를 반환한다.
  - DB 에러가 나면 `{ message: '저장하지 못했습니다. 다시 시도하세요.' }`를 반환한다.
  - 성공하면 `redirect('/sentences')`.
- `deleteSentence`: 삭제 후 `refresh()` (from `next/cache`).
- `createSource`: 성공하면 `{ source }`를 반환한다.

- [ ] **Step 7: 화면 구현**

`sentences/page.tsx`:
- 정적 제목 "문장 관리"와 "새 문장" 링크(`/sentences/new`)를 둔다.
- `<Suspense>` 안의 `SentenceList`가 `searchParams`를 받아 `parseListParams` → `listSentences`를 호출한다.
- 표 컬럼: 문장 / 뜻 / 설명(한 줄 말줄임) / 출처(url이 있으면 새 탭 링크) / 수정일 / 작업(수정 링크, `DeleteButton`).
- 상단에 GET 검색 폼(`name="q"`)을 둔다. 하단에는 "총 N개"와 이전/다음 링크를 두고, 검색어를 유지한다.
- 결과가 0건이면 "문장이 없습니다."를 표시한다.

`new/page.tsx`, `[id]/edit/page.tsx`:
- `<Suspense>` 안에서 `listSources()`(수정 화면은 `getSentence()`도)를 호출한다.
- 수정 화면에서 문장이 `null`이면 `notFound()`.
- 수정 화면은 `updateSentence.bind(null, id)`를 넘긴다.

`sentence-form.tsx` (client):
- `useActionState` 사용. 필드는 `sentence`(textarea), `meaning`(input), `description`(textarea), `sourceId`.
- `sourceId`는 네이티브 `<select>`이고 첫 옵션은 `''` = "출처 없음".
- 필드별 오류를 표시한다.
- `SourceDialog`의 `onCreated(source)`를 받으면 옵션에 추가하고 선택 상태로 만든다.

`source-dialog.tsx`:
- shadcn `Dialog` 안에 별도 `<form>`을 둔다. 포털로 렌더링되므로 form 중첩이 아니다.
- 필드: type select(직접 입력/웹/유튜브/문서), title, url.
- `createSource`에 연결한다.

`delete-button.tsx`: shadcn `AlertDialog` 확인 후 `deleteSentence(id)`를 호출한다.

- [ ] **Step 8: 통과 확인** — `pnpm test && pnpm test:e2e && pnpm build` → 모두 성공

- [ ] **Step 9: Commit** — `feat(sentences): add sentence CRUD with sources, search, pagination`

---

### Task 5: 회원 관리 (admin 전용)

**Files:**
- Create: `app/(admin)/members/page.tsx`, `app/(admin)/members/actions.ts`, `app/(admin)/members/role-select.tsx`, `e2e/members.spec.ts`

**Interfaces:**
- Consumes: `requireAdmin`, `Role`, `createClient` (Task 2), `login` (Task 3)
- Produces: `updateMemberRole(memberId: string, role: Role): Promise<{ ok: true } | { ok: false; message: string }>` — `app/(admin)/members/actions.ts`

- [ ] **Step 1: 실패하는 e2e** — `e2e/members.spec.ts`

```ts
test('admin은 회원 목록과 역할을 본다', …)        // 3명의 이메일, 각 역할 표시
test('admin이 pending을 editor로 바꾸면 그 사용자는 /sentences 접근 가능', …)
test('자기 권한 변경 불가', …)                   // 본인 행 select disabled, '(나)' 표시
test('editor가 /members 접근 → /sentences', …)
test('editor 네비게이션에 "회원" 메뉴 없음', …)
```
테스트 후 pending 사용자의 역할 원복은 `global-setup`의 재설정에 맡긴다.

- [ ] **Step 2: 실패 확인** — `pnpm test:e2e e2e/members.spec.ts` → FAIL

- [ ] **Step 3: 구현**

`actions.ts` `updateMemberRole`:
- `const me = await requireAdmin()`
- `memberId === me.id`이면 `{ ok: false, message: '자기 자신의 권한은 변경할 수 없습니다.' }`
- `role`이 enum 값이 아니면 `{ ok: false, message: '알 수 없는 권한입니다.' }`
- 업데이트 결과가 0행이면 `{ ok: false, message: '회원을 찾을 수 없습니다.' }`
- 성공하면 `refresh()` 후 `{ ok: true }`

`page.tsx`:
- 정적 제목 "회원 관리"를 둔다.
- `<Suspense>` 안에서 `requireAdmin()` 후 `profiles`를 `created_at` 순으로 조회한다.
- 표 컬럼: 이메일 / 이름 / 권한(`RoleSelect`) / 가입일.

`role-select.tsx` (client):
- 네이티브 select(승인 대기/에디터/관리자)를 쓰고, `onChange`에서 `startTransition`으로 `updateMemberRole`을 호출한다.
- 실패하면 메시지를 표시하고 이전 값으로 되돌린다.
- `disabled` prop을 받는다(본인 행).

- [ ] **Step 4: 통과 확인** — `pnpm test:e2e && pnpm build` → 모두 성공

- [ ] **Step 5: Commit** — `feat(members): add admin member role management`

---

### Task 6: 원격 Supabase·Vercel 연결 (사용자 수행 단계 포함)

**Files:**
- Modify: `README.md` (실행·테스트·배포 절차로 교체)

- [ ] **Step 1: README 작성**

다음 절차를 짧게 정리한다.
- 로컬 실행: Docker → `pnpm supabase start` → `.env.local` → `pnpm dev`
- 테스트 3종: `pnpm test`, `pnpm test:db`, `pnpm test:e2e`
- 아래 Step 2의 원격 연결 절차

- [ ] **Step 2: 원격 연결 (사용자가 Supabase 프로젝트를 준비한 뒤 함께 수행)**

```bash
pnpm supabase link --project-ref <ref>
pnpm supabase db push
```
- Supabase 대시보드 → Authentication → Email에서 "Confirm email"을 끈다. 접근은 admin 승인으로 통제하므로 이메일 확인은 필요 없다. 켜 두면 확인 링크 처리 라우트가 추가로 필요하다.
- 첫 계정 가입 후 SQL Editor에서 `update public.profiles set role = 'admin' where email = '<본인 이메일>';`
- Vercel 프로젝트 env에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 설정한다(시크릿 키는 넣지 않음).

- [ ] **Step 3: 확인** — 배포 URL에서 로그인 → `/sentences`에서 문장 1건 추가·수정·삭제.

- [ ] **Step 4: Commit** — `docs: add setup, testing, and deploy instructions`
