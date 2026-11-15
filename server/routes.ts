import * as auth from './controllers/auth.controller'
import * as members from './controllers/member.controller'
import * as sentences from './controllers/sentence.controller'
import * as sources from './controllers/source.controller'
import type { Handler } from './lib/context'
import type { Route } from './lib/router'

/** The whole HTTP API. Keep docs/architecture/backend.md in sync. */
export const routes: Route<Handler>[] = [
  { method: 'GET', path: '/api/auth/session', handler: auth.session },
  { method: 'GET', path: '/api/auth/me', handler: auth.me },
  { method: 'POST', path: '/api/auth/sign-in', handler: auth.signIn },
  { method: 'POST', path: '/api/auth/sign-up', handler: auth.signUp },
  { method: 'POST', path: '/api/auth/sign-out', handler: auth.signOut },

  { method: 'GET', path: '/api/sentences', handler: sentences.list },
  { method: 'POST', path: '/api/sentences', handler: sentences.create },
  { method: 'GET', path: '/api/sentences/:id', handler: sentences.show },
  { method: 'PUT', path: '/api/sentences/:id', handler: sentences.update },
  { method: 'DELETE', path: '/api/sentences/:id', handler: sentences.remove },

  { method: 'GET', path: '/api/sources', handler: sources.list },
  { method: 'POST', path: '/api/sources', handler: sources.create },

  { method: 'GET', path: '/api/members', handler: members.list },
  { method: 'PATCH', path: '/api/members/:id', handler: members.update },
]
