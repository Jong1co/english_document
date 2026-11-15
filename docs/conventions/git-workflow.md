# Git 작업 방식

## 규칙

1. **`main`에서 직접 커밋하거나 푸시하지 않는다.** 모든 변경은 별도 브랜치 → PR → `main`에 **Squash and merge**.
2. 작업은 **워크트리**에서 한다. 메인 체크아웃은 `main`에 둔 채로 두고 건드리지 않는다.
3. 한 PR = 한 목적. 스쿼시 후 커밋 하나로 설명할 수 있어야 한다.

## 흐름

```bash
# 1. 최신 main에서 브랜치 + 워크트리 생성
git fetch origin
git worktree add .claude/worktrees/<이름> -b <타입>/<이름> origin/main
cd .claude/worktrees/<이름>
git branch --unset-upstream      # origin/main을 추적하지 않게 (실수로 main에 푸시 방지)
pnpm install
cp ../../../.env .env            # 로컬 환경 변수 (커밋되지 않음)

# 2. 작업 + 커밋 (여러 개 OK, 스쿼시되어 하나가 됨)
git commit -m "feat(sentences): add bulk delete"

# 3. 푸시 + PR
git push -u origin <타입>/<이름>
gh pr create --base main

# 4. 리뷰 후 GitHub에서 "Squash and merge" → 브랜치 삭제

# 5. 정리 (메인 체크아웃에서)
git worktree remove .claude/worktrees/<이름>
git branch -D <타입>/<이름>
git pull --ff-only               # main 갱신
```

Claude Code에서는 "워크트리에서 작업해줘"라고 하면 `.claude/worktrees/` 아래에 같은 방식으로 만든다. `.claude/worktrees/`는 `.gitignore`에 들어 있다.

## 브랜치 이름

`<타입>/<짧은-설명>` — 예: `feat/youtube-import`, `fix/login-redirect-loop`, `docs/api-table`

| 타입 | 용도 |
|---|---|
| `feat` | 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 동작 변화 없는 구조 변경 |
| `docs` | 문서만 |
| `test` | 테스트만 |
| `chore` | 설정, 의존성, 빌드 |

## 커밋 메시지

[Conventional Commits](https://www.conventionalcommits.org/): `<타입>(<범위>): <요약>`

- 범위 예: `auth`, `sentences`, `members`, `db`, `server`, `deps`
- 요약은 영어 소문자 명령형, 마침표 없음 — 기존 히스토리와 맞춘다 (`feat(auth): add login, signup, pending pages`)
- **PR 제목도 같은 형식으로 쓴다.** 스쿼시 머지하면 PR 제목이 `main`의 커밋 메시지가 된다.

## PR

본문에 다음을 쓴다.

- **요약**: 무엇을, 왜
- **변경 사항**: 주요 파일·결정
- **검증**: 실행한 명령과 결과

머지 전 확인 (자세한 내용은 [testing.md](../testing.md)):

```bash
pnpm lint && pnpm test && pnpm build
pnpm test:db && pnpm test:e2e      # DB·인증·화면 흐름을 건드렸다면
```
