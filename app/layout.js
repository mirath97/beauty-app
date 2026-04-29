import './globals.css'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const metadata = {
  title: 'Beauty Lab Antonella',
}

export default async function RootLayout({ children }) {
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="it">
      <body className="bg-pink-50">

        {!user ? (
          <div className="flex items-center justify-center min-h-screen">
            <a href="/login" className="text-pink-600 text-xl">
              Vai al login
            </a>
          </div>
        ) : (

          <div className="min-h-screen flex flex-col">

            <div className="text-center py-4">
              <h1 className="text-3xl font-bold text-pink-700">
                Beauty Lab Antonella
              </h1>
            </div>

            <nav className="flex justify-around bg-white p-3 shadow text-xl">
              <Link href="/calendar">📅</Link>
              <Link href="/clients">👤</Link>
              <Link href="/dashboard/incassi">💰</Link>
              <Link href="/services">💅</Link>
              <Link href="/reminders">📲</Link>
            </nav>

            <main className="flex-1 p-4">
              {children}
            </main>

          </div>

        )}

      </body>
    </html>
  )
}