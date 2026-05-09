import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('voluforge-guest', '1', {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('voluforge-guest', '', {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
