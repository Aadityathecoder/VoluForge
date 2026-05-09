import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieToSet = {
  name: string
  value: string
  options: CookieOptions
}

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

function createFallbackSupabaseClient(): any {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
    from() {
      return createFallbackQuery()
    },
  }
}

export async function createServerComponentClient() {
  if (!isSupabaseConfigured()) {
    return createFallbackSupabaseClient() as ReturnType<
      typeof createFallbackSupabaseClient
    >
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )
}

export async function createServerActionClient() {
  if (!isSupabaseConfigured()) {
    return createFallbackSupabaseClient() as ReturnType<
      typeof createFallbackSupabaseClient
    >
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        },
      },
    },
  )
}
