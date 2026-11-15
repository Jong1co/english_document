/**
 * BE가 읽는 환경 변수. 요청 시점에 읽어서 빌드 단계에서는 값이 없어도 된다.
 * 이름은 배포 설정과 맞추기 위해 기존 NEXT_PUBLIC_* 를 그대로 쓴다 (docs/architecture/overview.md 참고).
 */
export function getEnv() {
  return {
    supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL'),
    supabasePublishableKey: required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
  }
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`환경 변수 ${name}가 없습니다.`)
  return value
}
