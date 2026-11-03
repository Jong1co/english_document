import { execSync } from 'node:child_process'

export type LocalSupabaseEnv = { url: string; publishableKey: string; secretKey: string }

export function getLocalSupabaseEnv(): LocalSupabaseEnv {
  const raw = execSync('pnpm --silent supabase status -o json', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  const status = JSON.parse(raw.slice(raw.indexOf('{'))) as Record<string, string | undefined>
  const url = status.API_URL
  const publishableKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY
  const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY
  if (!url || !publishableKey || !secretKey) {
    throw new Error('로컬 Supabase가 실행 중이 아닙니다. `pnpm supabase start`를 먼저 실행하세요.')
  }
  const host = new URL(url).hostname
  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new Error(`e2e는 로컬 Supabase에서만 실행합니다. 현재 대상: ${host}`)
  }
  return { url, publishableKey, secretKey }
}
