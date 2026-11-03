import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/supabase/database.types'
import { getLocalSupabaseEnv } from './local-env'
import { TEST_PASSWORD, TEST_USERS, type TestRole } from './helpers'

export default async function globalSetup() {
  const { url, secretKey } = getLocalSupabaseEnv()
  const admin = createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  await check(admin.from('sentences').delete().not('id', 'is', null))
  await check(admin.from('sources').delete().not('id', 'is', null))

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error

  for (const user of data.users) {
    if (user.email?.startsWith('signup-') && user.email.endsWith('@test.local')) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
      if (deleteError) throw deleteError
    }
  }

  for (const role of Object.keys(TEST_USERS) as TestRole[]) {
    const { email, name } = TEST_USERS[role]
    let userId = data.users.find((user) => user.email === email)?.id
    if (!userId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { name },
      })
      if (createError) throw createError
      userId = created.user.id
    }
    await check(admin.from('profiles').update({ role }).eq('id', userId))
  }
}

async function check(query: PromiseLike<{ error: unknown }>) {
  const { error } = await query
  if (error) throw error
}
