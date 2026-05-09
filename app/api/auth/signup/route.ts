import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/types/database'

type CookieToSet = {
  name: string
  value: string
  options: CookieOptions
}

type SignUpBody = {
  email?: string
  password?: string
  fullName?: string
  role?: UserRole
  schoolOrOrg?: string
  location?: string
  origin?: string
}

const validRoles: UserRole[] = ['student', 'partner', 'advisor', 'admin']

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.',
      },
      { status: 503 },
    )
  }

  let body: SignUpBody

  try {
    body = (await request.json()) as SignUpBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''
  const fullName = body.fullName?.trim() ?? ''
  const role = validRoles.includes(body.role ?? 'student') ? (body.role as UserRole) : 'student'
  const schoolOrOrg = body.schoolOrOrg?.trim() ?? ''
  const location = body.location?.trim() ?? ''
  const origin = body.origin?.trim()

  if (!email || !password || !fullName || !schoolOrOrg) {
    return NextResponse.json(
      { error: 'Missing required signup fields.' },
      { status: 400 },
    )
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 },
    )
  }

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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        },
      },
    },
  )

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: origin ? `${origin}/auth/callback?next=/dashboard` : undefined,
      data: {
        full_name: fullName,
        role,
        school_or_org: schoolOrOrg,
        location,
      },
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (data.user?.id && data.session) {
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        full_name: fullName,
        role,
        school_or_org: schoolOrOrg,
        location: location || null,
      },
      { onConflict: 'id' },
    )

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 },
      )
    }
  }

  return NextResponse.json({
    requiresEmailConfirmation: !data.session,
  })
}
