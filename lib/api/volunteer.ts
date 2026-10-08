import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function id(value: unknown): string {
  if (typeof value !== 'string' || !uuid.test(value)) throw new ApiError(400, 'Invalid UUID.')
  return value
}
function text(value: unknown, name: string, min: number, max: number): string {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max)
    throw new ApiError(400, `${name} must contain ${min}–${max} characters.`)
  return value.trim()
}
async function body(request: Request): Promise<Record<string, unknown>> {
  if (Number(request.headers.get('content-length')) > 32768) throw new ApiError(413, 'Request too large.')
  const raw = await request.text()
  if (raw.length > 32768) throw new ApiError(413, 'Request too large.')
  try {
    const value = JSON.parse(raw)
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error()
    return value
  } catch { throw new ApiError(400, 'Expected a JSON object.') }
}
async function client(request: Request): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new ApiError(503, 'Supabase is not configured.')
  const auth = request.headers.get('authorization')
  if (auth) {
    if (!/^Bearer \S+$/.test(auth)) throw new ApiError(401, 'Invalid authorization header.')
    return createClient(url, key, { global: { headers: { Authorization: auth } }, auth: { persistSession: false, autoRefreshToken: false } })
  }
  const store = await cookies()
  return createServerClient(url, key, { cookies: {
    getAll: () => store.getAll(),
    setAll: (values: { name: string; value: string; options: CookieOptions }[]) => values.forEach(({ name, value, options }) => store.set(name, value, options)),
  } })
}
function fail(error: { code?: string; message: string } | null) {
  if (!error) return
  if (error.code === '42501' || /staff|Organization access|verified organization/i.test(error.message)) throw new ApiError(403, 'Organization permission or verification required.')
  if (error.code === '23505') throw new ApiError(409, 'Record already exists.')
  if (/not found/i.test(error.message)) throw new ApiError(404, 'Record not found.')
  if (error.code === 'P0001') throw new ApiError(409, error.message)
  if (['23514', '23502', '22P02', '22007', '22008'].includes(error.code ?? '')) throw new ApiError(400, 'Invalid field values.')
  throw new ApiError(502, 'Database request failed.')
}
const reply = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store' } })

export async function volunteerApi(request: Request, path: string[]) {
  try {
    // Cookie mutations must originate from this website. CLI requests omit Origin.
    if (request.method !== 'GET' && request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin)
      throw new ApiError(403, 'Cross-origin request denied.')
    const route = path.join('/')
    const known = ['auth/signup', 'auth/login', 'auth/logout', 'auth/me', 'opportunities', 'applications']
    const apply = path.length === 3 && path[0] === 'opportunities' && path[2] === 'applications'
    if (!known.includes(route) && !apply) throw new ApiError(404, 'Endpoint not found.')
    const methods = route === 'opportunities' ? ['GET', 'POST'] : ['auth/me', 'applications'].includes(route) ? ['GET'] : ['POST']
    if (!methods.includes(request.method)) return NextResponse.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: methods.join(', ') } })
    const supabase = await client(request)
    if (route === 'auth/signup' && request.method === 'POST') {
      const b = await body(request)
      const email = text(b.email, 'email', 3, 254).toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Invalid email.')
      if (typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 128) throw new ApiError(400, 'Password must contain 8–128 characters.')
      if (b.role !== undefined && !['student', 'partner'].includes(b.role as string)) throw new ApiError(400, 'Invalid signup role.')
      const accountType = b.accountType ?? (b.role === 'partner' ? 'nonprofit' : 'volunteer')
      if (!['volunteer', 'nonprofit'].includes(accountType as string)) throw new ApiError(400, 'Invalid accountType.')
      const fullName = text(b.fullName, 'fullName', 1, 120)
      const organizationName = accountType === 'nonprofit' ? text(b.organizationName ?? b.schoolOrOrg, 'organizationName', 2, 200) : undefined
      const { data, error } = await supabase.auth.signUp({ email, password: b.password, options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
        data: { full_name: fullName, account_type: accountType, organization_name: organizationName },
      } })
      if (error) throw new ApiError(error.status === 429 ? 429 : 400, 'Signup could not be completed.')
      // Supabase may mask duplicate signups; don't claim a new account in that case.
      return reply({ user: data.user ? { id: data.user.id } : null, session: data.session, requiresEmailConfirmation: !data.session }, 201)
    }
    if (route === 'auth/login' && request.method === 'POST') {
      const b = await body(request)
      const email = text(b.email, 'email', 3, 254)
      if (typeof b.password !== 'string' || !b.password || b.password.length > 128) throw new ApiError(400, 'Invalid password.')
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: b.password })
      if (error) throw new ApiError(error.status === 429 ? 429 : 401, 'Invalid credentials or email not confirmed.')
      return reply({ user: { id: data.user.id }, session: data.session })
    }
    const bearer = request.headers.get('authorization')?.slice(7)
    const { data: { user }, error: userError } = await supabase.auth.getUser(bearer)
    if (userError || !user) throw new ApiError(401, 'Authentication required.')
    const { data: profile, error: profileError } = await supabase.from('vf_profiles').select('id,full_name,deletion_requested_at').eq('id', user.id).maybeSingle()
    fail(profileError)
    if (!profile || profile.deletion_requested_at) throw new ApiError(403, 'Account is unavailable.')
    if (route === 'auth/logout') {
      if (bearer) {
        // Public Auth endpoint revokes the current session without a service key.
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/logout?scope=local`, { method: 'POST', headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${bearer}` } })
        if (!response.ok) throw new ApiError(502, 'Logout failed.')
      } else {
        const { error } = await supabase.auth.signOut({ scope: 'local' })
        if (error) throw new ApiError(502, 'Logout failed.')
      }
      return reply({ loggedOut: true })
    }
    if (route === 'auth/me') {
      const { data: memberships, error } = await supabase.from('vf_org_staff').select('org_id,role,active').eq('user_id', user.id).eq('active', true)
      fail(error)
      return reply({ user: profile, memberships })
    }
    if (route === 'opportunities' && request.method === 'GET') {
      const params = new URL(request.url).searchParams
      const limit = Number(params.get('limit') ?? 50), offset = Number(params.get('offset') ?? 0)
      if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0 || offset > 10000) throw new ApiError(400, 'Invalid pagination.')
      const { data, error } = await supabase.from('vf_opportunities').select('*,organization:vf_organizations!inner(id,name,verified)').eq('status', 'published').eq('vf_organizations.verified', true).gt('ends_at', new Date().toISOString()).order('starts_at').order('id').range(offset, offset + limit - 1)
      fail(error)
      return reply({ opportunities: data, limit, offset })
    }
    if (route === 'opportunities' && request.method === 'POST') {
      const b = await body(request)
      const orgId = id(b.org_id)
      const { data: membership, error: membershipError } = await supabase.from('vf_org_staff').select('org_id').eq('org_id', orgId).eq('user_id', user.id).eq('active', true).maybeSingle()
      fail(membershipError)
      if (!membership) throw new ApiError(403, 'Organization membership required.')
      const title = text(b.title, 'title', 3, 160), description = text(b.description, 'description', 10, 12000)
      if (typeof b.starts_at !== 'string' || typeof b.ends_at !== 'string' || !Number.isFinite(Date.parse(b.starts_at)) || !Number.isFinite(Date.parse(b.ends_at)) || Date.parse(b.ends_at) <= Date.parse(b.starts_at)) throw new ApiError(400, 'Invalid opportunity dates.')
      if (!Number.isInteger(b.capacity) || Number(b.capacity) < 1 || Number(b.capacity) > 10000) throw new ApiError(400, 'Invalid capacity.')
      if (b.status !== undefined && !['draft', 'published', 'closed'].includes(b.status as string)) throw new ApiError(400, 'Invalid status.')
      for (const key of ['remote', 'proof_required']) if (b[key] !== undefined && typeof b[key] !== 'boolean') throw new ApiError(400, `Invalid ${key}.`)
      if (b.skills !== undefined && (!Array.isArray(b.skills) || b.skills.length > 30 || !b.skills.every(s => typeof s === 'string' && s.length <= 200))) throw new ApiError(400, 'Invalid skills.')
      if (b.requirements !== undefined && (!Array.isArray(b.requirements) || b.requirements.length > 30 || !b.requirements.every(s => typeof s === 'string' && s.length <= 1000))) throw new ApiError(400, 'Invalid requirements.')
      for (const [key, max] of [['category', 80], ['location', 300], ['address', 500]] as const) if (b[key] !== undefined && (typeof b[key] !== 'string' || String(b[key]).length > max || (key === 'category' && !String(b[key]).length))) throw new ApiError(400, `Invalid ${key}.`)
      if (b.image_url !== undefined && b.image_url !== null && (typeof b.image_url !== 'string' || !/^https:\/\//.test(b.image_url))) throw new ApiError(400, 'Invalid image_url.')
      if (b.min_age !== undefined && (!Number.isInteger(b.min_age) || Number(b.min_age) < 13 || Number(b.min_age) > 100)) throw new ApiError(400, 'Invalid min_age.')
      if ((b.latitude == null) !== (b.longitude == null)) throw new ApiError(400, 'Supply both coordinates.')
      for (const [key, max] of [['latitude', 90], ['longitude', 180]] as const) if (b[key] != null && (typeof b[key] !== 'number' || !Number.isFinite(b[key]) || Math.abs(Number(b[key])) > max)) throw new ApiError(400, `Invalid ${key}.`)
      const allowed = ['category', 'location', 'remote', 'image_url', 'min_age', 'skills', 'proof_required', 'status', 'address', 'latitude', 'longitude', 'requirements']
      const data: Record<string, unknown> = { org_id: orgId, title, description, starts_at: b.starts_at, ends_at: b.ends_at, capacity: b.capacity }
      allowed.forEach(key => { if (b[key] !== undefined) data[key] = b[key] })
      const { data: opportunity, error } = await supabase.rpc('vf_upsert_opportunity', { p_data: data })
      fail(error)
      return reply({ opportunity }, 201)
    }
    if (apply) {
      const opportunityId = id(path[1]), b = await body(request)
      const { data, error } = await supabase.rpc('vf_apply_to_opportunity', { p_opportunity_id: opportunityId, p_message: text(b.message, 'message', 10, 3000), p_availability: text(b.availability, 'availability', 2, 1000) })
      fail(error)
      return reply({ application: data }, 201)
    }
    if (route === 'applications') {
      const opportunityId = id(new URL(request.url).searchParams.get('opportunity_id'))
      const { data: opportunity, error: opportunityError } = await supabase.from('vf_opportunities').select('org_id').eq('id', opportunityId).maybeSingle()
      fail(opportunityError)
      if (!opportunity) throw new ApiError(404, 'Opportunity not found.')
      const { data: staff, error: staffError } = await supabase.from('vf_org_staff').select('org_id').eq('org_id', opportunity.org_id).eq('user_id', user.id).eq('active', true).maybeSingle()
      fail(staffError)
      if (!staff) throw new ApiError(403, 'Organization membership required.')
      const params = new URL(request.url).searchParams
      const limit = Number(params.get('limit') ?? 50), offset = Number(params.get('offset') ?? 0)
      if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0 || offset > 10000) throw new ApiError(400, 'Invalid pagination.')
      const { data, error } = await supabase.from('vf_applications').select('*').eq('opportunity_id', opportunityId).order('created_at').order('id').range(offset, offset + limit - 1)
      fail(error)
      return reply({ applications: data, limit, offset })
    }
    throw new ApiError(404, 'Endpoint not found.')
  } catch (error) {
    if (error instanceof ApiError) return reply({ error: error.message }, error.status)
    return reply({ error: 'API request failed.' }, 500)
  }
}
