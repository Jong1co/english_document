# 프로젝트 문서 목차

이 파일은 목차만 둡니다. 문서는 모두 `docs/`에 있고, 개발 환경·배포 설정은 [README.md](README.md)에 있습니다.
작업 전에 해당 문서를 먼저 읽으세요.

## 작업 방식

- [Git 작업 방식](docs/conventions/git-workflow.md) — main 직접 작업·푸시 금지, 워크트리, 브랜치·커밋 이름, PR, 스쿼시 머지. **모든 작업 전에**

## 아키텍처

- [아키텍처 개요](docs/architecture/overview.md) — FE/BE 분리 원칙, 의존 규칙, 요청 흐름, BE 분리 절차. **구조를 바꾸거나 새 영역을 만들 때**
- [폴더 구조](docs/architecture/folder-structure.md) — 전체 폴더 트리와 각 폴더의 역할, 경로 별칭, 파일 이름. **파일을 어디 둘지 정할 때**
- [FE (FSD)](docs/architecture/frontend.md) — 레이어·슬라이스 규칙, 공개 API(index.ts / server.ts), 데이터 흐름, 새 화면 추가 순서. **`src/`, `app/`을 건드릴 때**
- [BE (MVC)](docs/architecture/backend.md) — 계층 책임, API 목록, 에러 계약, contracts, 새 API 추가 순서. **`server/`, `contracts/`를 건드릴 때**

## 도메인

- [역할과 권한](docs/domain/roles.md) — pending / editor / admin, 권한을 확인하는 위치

## 품질

- [테스트](docs/testing.md) — 명령별 대상, 무엇을 어디서 테스트하나, e2e 주의

## 기록

- [문장 어드민 구현 계획 (2026-11-03)](docs/superpowers/plans/2026-11-03-sentence-admin.md) — 초기 구현 계획. 구조는 위 아키텍처 문서가 우선

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
