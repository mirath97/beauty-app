import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(req) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => req.cookies.get(key)?.value,
        set: (key, value) => res.cookies.set(key, value),
        remove: (key) => res.cookies.set(key, '', { maxAge: 0 }),
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 🔒 protezione dashboard
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 🔁 evita login se già loggato
  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}