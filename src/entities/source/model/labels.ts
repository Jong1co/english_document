import type { SourceType } from '@contracts/source'

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  manual: '직접 입력',
  web: '웹',
  youtube: '유튜브',
  document: '문서',
}
