import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const signedInOnly = ['/home', '/opportunities', '/fellowships', '/activity', '/profile', '/admin', '/onboarding']

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || request.nextUrl.pathname.startsWith('/api/')) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        list.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  if (!user && signedInOnly.some(p => path === p || path.startsWith(p + '/'))) {
    const login = request.nextUrl.clone()
    login.pathname = '/login'
    login.search = ''
    login.searchParams.set('next', path + request.nextUrl.search)
    return NextResponse.redirect(login)
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)'],
}
