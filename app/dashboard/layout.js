'use client'

import './globals.css'

import Link from 'next/link'

import { usePathname, useRouter } from 'next/navigation'

import { useEffect, useState } from 'react'

import { getSupabase } from '@/lib/supabaseClient'

export default function DashboardLayout({ children }) {
  const pathname = usePathname()

  const router = useRouter()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const supabase = getSupabase()

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setLoading(false)
  }

  async function logout() {
    const supabase = getSupabase()

    await supabase.auth.signOut()

    router.push('/login')
  }

  const links = [
    {
      name: '🏠 Dashboard',
      href: '/dashboard'
    },
    {
      name: '📅 Calendario',
      href: '/dashboard/calendar'
    },
    {
      name: '💅 Servizi',
      href: '/dashboard/services'
    },
    {
      name: '💰 Incassi',
      href: '/dashboard/incassi'
    },
    {
      name: '👤 Clienti',
      href: '/dashboard/clients'
    },
    {
      name: '🤖 AI',
      href: '/dashboard/ai'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Caricamento...
      </div>
    )
  }

  return (
    <html lang="it">

      <body className="bg-gray-100">

        <div className="flex min-h-screen">

          {/* SIDEBAR */}
          <aside className="w-64 bg-white shadow-lg p-4 hidden md:block">

            <h1 className="text-xl font-bold text-pink-600 mb-6">
              BeautyLab 💅
            </h1>

            <nav className="flex flex-col gap-2">

              {links.map(link => {
                const active = pathname === link.href

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      active
                        ? 'bg-pink-600 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              })}

            </nav>

            {/* LOGOUT */}
            <button
              onClick={logout}
              className="mt-6 w-full bg-red-500 text-white py-2 rounded-xl"
            >
              🚪 Logout
            </button>

          </aside>

          {/* MOBILE NAV */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg flex justify-around p-2 z-50">

            {links.map(link => {
              const active = pathname === link.href

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs ${
                    active
                      ? 'text-pink-600 font-bold'
                      : 'text-gray-500'
                  }`}
                >
                  {link.name.split(' ')[0]}
                </Link>
              )
            })}

          </div>

          {/* CONTENT */}
          <main className="flex-1 p-4 md:p-6 pb-16 md:pb-6">
            {children}
          </main>

        </div>

      </body>

    </html>
  )
}