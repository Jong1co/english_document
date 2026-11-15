export const ROUTES = {
  login: '/login',
  signup: '/signup',
  pending: '/pending',
  sentences: '/sentences',
  newSentence: '/sentences/new',
  editSentence: (id: string) => `/sentences/${id}/edit`,
  members: '/members',
} as const
