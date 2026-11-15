import { API_PREFIX } from '@contracts/common'
import * as auth from './controllers/auth.controller'
import * as members from './controllers/member.controller'
import * as sentences from './controllers/sentence.controller'
import * as sources from './controllers/source.controller'
import type { Handler } from './lib/context'
import type { Route } from './lib/router'

const v1 = (path: string) => `${API_PREFIX}${path}`

/** The whole HTTP API. Keep docs/architecture/backend.md in sync. */
export const routes: Route<Handler>[] = [
  { method: 'GET', path: v1('/auth/session'), handler: auth.session },
  { method: 'GET', path: v1('/auth/me'), handler: auth.me },
  { method: 'POST', path: v1('/auth/sign-in'), handler: auth.signIn },
  { method: 'POST', path: v1('/auth/sign-up'), handler: auth.signUp },
  { method: 'POST', path: v1('/auth/sign-out'), handler: auth.signOut },

  { method: 'GET', path: v1('/sentences'), handler: sentences.list },
  { method: 'POST', path: v1('/sentences'), handler: sentences.create },
  { method: 'GET', path: v1('/sentences/:id'), handler: sentences.show },
  { method: 'PUT', path: v1('/sentences/:id'), handler: sentences.update },
  { method: 'DELETE', path: v1('/sentences/:id'), handler: sentences.remove },

  { method: 'GET', path: v1('/sources'), handler: sources.list },
  { method: 'POST', path: v1('/sources'), handler: sources.create },

  { method: 'GET', path: v1('/members'), handler: members.list },
  { method: 'PATCH', path: v1('/members/:id'), handler: members.update },
]
