// Client-safe public API. Server-only functions are in ./server.ts.
export type {
  SentenceDto as Sentence,
  SentenceListResponse as SentenceList,
  SentenceRequest,
} from '@contracts/sentence'
