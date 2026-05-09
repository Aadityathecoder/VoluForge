import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code && isSupabaseConfigured()) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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
              // ignore when called outside Server Action / Route that can set cookies
            }
          },
        },
      },
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user

      if (user) {
        const meta = user.user_metadata ?? {}
        await supabase.from('profiles').upsert(
          {
            id: user.id,
            full_name: String(meta.full_name ?? '').trim() || null,
            role: ['student', 'partner', 'advisor', 'admin'].includes(meta.role)
              ? meta.role
              : 'student',
            school_or_org: String(meta.school_or_org ?? '').trim() || null,
            location: String(meta.location ?? '').trim() || null,
          },
          { onConflict: 'id' },
        )
      }

      return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/' + next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth`)
}
