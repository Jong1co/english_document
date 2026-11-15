export const PAGE_SIZE = 20

export type ListQuery = { q: string; page: number }

/** Reads `q` and `page` from a query string; repeated keys use the first value. */
export function parseListQuery(params: URLSearchParams): ListQuery {
  const q = (params.get('q') ?? '').trim()
  const rawPage = params.get('page') ?? ''
  const parsed = /^\d{1,9}$/.test(rawPage) ? Number(rawPage) : NaN
  return { q, page: parsed >= 1 ? parsed : 1 }
}

/** Inclusive row range for a 1-based page. */
export function pageRange(page: number): { from: number; to: number } {
  const from = (page - 1) * PAGE_SIZE
  return { from, to: from + PAGE_SIZE - 1 }
}

/** Escape LIKE/ILIKE wildcards so user input matches literally. */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (char) => `\\${char}`)
}
