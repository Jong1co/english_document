# 역할과 권한

| 역할 | 할 수 있는 일 |
|---|---|
| `pending` | 가입 직후 상태. 승인 대기 화면만 볼 수 있음 |
| `editor` | 문장·출처 관리 |
| `admin` | 문장·출처 관리 + 회원 권한 변경 (자기 자신 제외) |

- 프로필 행이 없는 로그인 사용자는 `pending`으로 취급한다 (profiles 마이그레이션 전에 만든 계정 등).
- 첫 admin은 DB에서 직접 지정한다 (README의 로컬 실행·배포 절차 참고). 이후에는 `/members`에서 승인한다.

## 어디서 확인하나

| 위치 | 역할 |
|---|---|
| `contracts/auth.ts` | 역할 목록과 판정 함수 (`canManageSentences`, `canManageMembers`). FE·BE 공통 기준 |
| `server/controllers/guards.ts` | API마다 권한 확인 → 401 / 403 |
| `supabase/migrations/` RLS | 최종 방어선. API를 우회해도 DB가 막는다 |
| `src/entities/user/model/guards.ts` | 화면 이동만 담당 (`/login`, `/pending`, `/sentences`로 보냄) |
