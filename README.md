# 영어 문장 어드민

영어 문장(`sentence` / `meaning` / `description`)과 출처(`sources` 1 : N `sentences`)를 수집·관리하는 어드민입니다.
Next.js 16 + Supabase(Postgres, Auth) + Vercel.

이 문서는 **개발 환경과 배포 설정**만 다룹니다. 구조, 규칙, 권한 같은 프로젝트 문서는 [AGENTS.md](AGENTS.md)의 목차에서 찾습니다.

## 필요한 것

- Node.js 20 이상, pnpm 10 (`corepack enable`)
- Docker Desktop (로컬 Supabase, DB·e2e 테스트용)

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

## 검사와 테스트

```bash
pnpm lint        # 코드 규칙 + FE/BE·FSD 경계
pnpm test        # 단위 테스트 (Vitest)
pnpm build       # 타입 검사 + 프로덕션 빌드
pnpm test:db     # DB 권한 테스트 (pgTAP) — 로컬 Supabase 필요
pnpm test:e2e    # 브라우저 테스트 (Playwright) — 로컬 Supabase 필요
```

e2e는 `.env`의 값과 상관없이 **항상 로컬 Supabase**에 붙고, 시작할 때 로컬의 문장·출처 데이터를 지웁니다. 원격 URL이면 실행을 거부합니다. 무엇을 어디서 테스트하는지는 [docs/testing.md](docs/testing.md).

PR과 `main` 푸시마다 GitHub Actions(`.github/workflows/ci.yml`)가 위 다섯 가지를 모두 실행합니다.

스키마를 바꾼 뒤에는 타입을 다시 생성합니다.

```bash
pnpm supabase migration new <name>   # supabase/migrations/에 SQL 작성
pnpm supabase db reset               # 로컬에 적용
pnpm db:types                        # server/db/database.types.ts 갱신
```

## GitHub · Vercel 배포 인수인계

이 앱은 GitHub의 `main`을 Vercel에서 빌드하고 Supabase를 인증과 DB에 사용합니다. Vercel Git 연동 기준으로 **GitHub에 추가할 변수는 0개, Vercel에 추가할 변수는 환경별 2개**입니다.

### 1. GitHub 저장소 연결

1. Vercel에서 **Add New → Project → Import Git Repository**를 열고 `Jong1co/english_document`를 선택합니다. 목록에 없으면 **Configure GitHub App**에서 Vercel에 해당 저장소 접근 권한을 부여합니다. 이미 연결한 프로젝트는 **Settings → Git**에서 저장소 이름을 확인합니다.
2. 프레임워크는 **Next.js**, Root Directory는 저장소 루트(`.`)를 사용합니다. `pnpm-lock.yaml`과 `package.json`의 `build` 스크립트가 있으므로 설치·빌드·출력 설정은 자동 감지 기본값을 사용합니다.
3. **Settings → Environments → Production → Branch Tracking**에서 `main`을 확인합니다. 기능 브랜치나 PR은 Preview, `main`에 병합된 커밋은 Production으로 배포됩니다. [Vercel GitHub 연동](https://vercel.com/docs/git/vercel-for-github) · [배포 브랜치 설정](https://vercel.com/docs/git#production-branch)

`.github/workflows/ci.yml`은 PR 검사만 하고 배포하지 않습니다. CI는 러너 안에 로컬 Supabase를 띄워 쓰므로 GitHub **Settings → Secrets and variables → Actions**에 등록할 항목은 없으며 `VERCEL_TOKEN`도 필요하지 않습니다. [.env.example](.env.example)에는 이름과 예시만 두고 실제 값은 각 환경에 입력합니다.

### 2. Vercel 환경변수 입력

Supabase 대시보드에서 **대상 프로젝트 → Connect → Next.js**를 열어 아래 두 값을 복사합니다. Vercel의 프로젝트 가져오기 화면 또는 기존 프로젝트의 **Settings → Environment Variables**에서 한 줄씩 입력하고 적용할 환경을 선택해 저장합니다. [Supabase 키 확인](https://supabase.com/docs/guides/getting-started/api-keys) · [Vercel 환경변수 설정](https://vercel.com/docs/environment-variables/managing-environment-variables)

| Vercel의 Name | 같은 Supabase 프로젝트에서 복사할 Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL 전체. 기본 형식은 `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key 전체. `sb_publishable_`로 시작 |

- **Production**에는 운영 Supabase 프로젝트의 URL과 키를 넣습니다.
- **Preview**에서 로그인과 데이터 편집을 시험하려면 별도 테스트 Supabase 프로젝트의 URL과 키를 넣습니다. Preview에서 문장을 수정하면 연결한 DB에 즉시 반영되므로, 운영 값은 Production에만 지정하는 구성을 권장합니다.
- **Development**는 Vercel에서 로컬용 값을 내려받을 때 쓰는 선택 항목입니다. 위의 로컬 실행 절차를 따르면 개발 머신의 `.env.local`만으로 충분합니다.

기존 로컬 `.env`의 URL과 키가 대상 프로젝트의 Connect 화면과 일치하면 그대로 사용해도 됩니다. 두 값은 브라우저에 공개됩니다. `sb_secret_...`, `service_role` 키, DB 비밀번호는 이 칸에 입력하지 않습니다. 데이터 접근 권한은 로그인 세션과 마이그레이션에 정의된 RLS 정책으로 제어합니다.

### 3. 사용할 원격 DB 준비

대상 Supabase 프로젝트의 **Authentication → Sign In / Providers**에서 신규 가입과 Email 제공자를 활성화하고 **Email → Confirm email**을 끕니다. 이 앱은 가입 직후 `/pending`으로 이동하고 관리자가 역할을 부여하는 흐름을 사용합니다. Confirm email을 켜 두면 확인 링크를 처리하는 라우트가 추가로 필요합니다. [Supabase 가입 설정](https://supabase.com/docs/guides/auth/general-configuration)

아래 명령은 `supabase/migrations/`가 있는 체크아웃 루트에서 실행합니다. `YOUR_PROJECT_REF`를 대상 프로젝트의 실제 ref로 교체하세요.

```bash
pnpm install --frozen-lockfile
pnpm supabase login
pnpm supabase link --project-ref YOUR_PROJECT_REF
pnpm supabase db push --remote --dry-run   # 적용할 마이그레이션 먼저 확인
pnpm supabase db push --remote             # supabase/migrations/를 원격 DB에 적용
pnpm supabase migration list --remote      # 원격에 적용됐는지 확인 (REMOTE 칸에 버전이 보여야 함)
```

> Supabase CLI 3부터 `db push` · `migration list`는 **기본 대상이 로컬 DB**입니다. `--remote` 없이 실행하면 원격에는 아무것도 반영되지 않습니다.

초기 마이그레이션 버전은 `20261103000000`입니다. Preview에 별도 DB를 사용하면 해당 ref로 다시 연결해 그 DB에도 같은 스키마와 인증 설정을 적용합니다.

### 4. 배포와 첫 관리자 확인

1. 새 프로젝트는 **Deploy**를 누릅니다. 이미 배포했다면 **Deployments → 대상 환경의 배포 → ⋯ → Redeploy**를 실행합니다. `NEXT_PUBLIC_` 값은 빌드 시점에 고정되므로 값을 변경할 때마다 해당 환경을 다시 빌드해야 합니다. [Vercel 환경변수 반영](https://vercel.com/docs/environment-variables/managing-environment-variables)
2. 배포 URL을 시크릿 창에서 열어 `/login` 이동을 확인합니다. 첫 관리자 본인이 `/signup`에서 가입해 `/pending`에 도달하면, 해당 Supabase의 **Authentication → Users**에서 방금 생성한 계정의 **User UID**를 확인합니다.
3. 같은 프로젝트의 **SQL Editor**에서 아래 UUID를 그 UID로 교체해 실행합니다. 결과가 의도한 계정 한 행이고 역할이 `admin`인지 확인합니다.

```sql
update public.profiles
set role = 'admin'
where id = '<첫 관리자 User UID>'::uuid
returning id, email, role;
```

4. 관리자 계정으로 다시 로그인해 `/sentences`와 `/members`가 열리는지 확인합니다. 이후에는 `/members`에서 가입자를 승인합니다. Preview에서 만든 계정과 부여한 역할은 별도 운영 DB로 복사되지 않습니다.
