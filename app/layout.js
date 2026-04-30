'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function RootLayout({ children }) {
  const pathname = usePathname()

  const links = [
    { name: '📅 Calendario', href: '/dashboard/calendar' },
    { name: '💅 Servizi', href: '/dashboard/services' },
    { name: '💰 Incassi', href: '/dashboard/incassi' },
    { name: '🤖 AI', href: '/dashboard/ai' },
  ]

  return (
    <html lang="it">
      <body className="bg-gray-50">

        {/* 🔝 MENU */}
        <nav className="flex gap-3 p-4 bg-white shadow sticky top-0 z-50">

          {links.map(link => {
            const active = pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {link.name}
              </Link>
            )
          })}

        </nav>

        {/* 📦 CONTENUTO */}
        <main className="p-4">
          {children}
        </main>

      </body>
    </html>
  )
}