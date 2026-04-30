import { NextResponse } from 'next/server'

export function middleware(req) {
  const url = req.nextUrl

  // lascia sempre accesso a login
  if (url.pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  // 🔥 TEMP: non bloccare dashboard
  return NextResponse.next()
}