import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { generateProjectKit } from '@/lib/ai/generateProjectKit'
import type { CommunityNeed } from '@/types/database'

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

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 503 },
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { needId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const needId = body.needId
  if (!needId || typeof needId !== 'string') {
    return NextResponse.json({ error: 'needId required' }, { status: 400 })
  }

  const { data: need, error: needError } = await supabase
    .from('community_needs')
    .select('*')
    .eq('id', needId)
    .single()

  if (needError || !need) {
    return NextResponse.json({ error: 'Need not found or access denied' }, { status: 404 })
  }

  const result = await generateProjectKit(need as CommunityNeed)

  if (!result.success || !result.kit) {
    return NextResponse.json(
      { error: result.error ?? 'Generation failed' },
      { status: 502 },
    )
  }

  return NextResponse.json({ kit: result.kit })
}
