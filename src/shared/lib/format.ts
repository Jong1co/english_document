const dateFormat = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeZone: 'Asia/Seoul' })

/** e.g. "2026. 11. 15." in Korea time. */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}
