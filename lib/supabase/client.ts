import { createBrowserClient } from '@supabase/ssr'

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

function createFallbackQuery() {
  const empty = { data: null, error: null }

  const query = {
    select() {
      return query
    },
    eq() {
      return query
    },
    or() {
      return query
    },
    order() {
      return query
    },
    limit() {
      return query
    },
    in() {
      return query
    },
    not() {
      return query
    },
    maybeSingle() {
      return Promise.resolve(empty)
    },
    single() {
      return Promise.resolve(empty)
    },
  }

  return query
}

function createFallbackClient(): any {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
      signInWithPassword: async () => ({ data: null, error: null }),
      signInWithOtp: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({ error: null }),
      signOut: async () => ({ error: null }),
    },
    from() {
      return createFallbackQuery()
    },
  }
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    return createFallbackClient() as ReturnType<typeof createFallbackClient>
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
