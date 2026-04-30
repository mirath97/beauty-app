import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Beauty Lab Antonella',
}

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="bg-pink-50">

        <div className="min-h-screen flex flex-col">

          {/* HEADER */}
          <div className="text-center py-4">
            <h1 className="text-3xl font-bold text-pink-700">
              Beauty Lab Antonella
            </h1>
          </div>

          {/* NAV COMPLETA */}
          <nav className="flex flex-wrap justify-around bg-white p-3 shadow text-xl gap-2">

            <Link href="/calendar">📅</Link>
            <Link href="/clients">👤</Link>
            <Link href="/services">💅</Link>
            <Link href="/dashboard/incassi">Incassi</Link>
            <Link href="/dashboard/ai">🧠</Link>
            <Link href="/reminders">📲</Link>

          </nav>

          {/* CONTENUTO */}
          <main className="flex-1 p-4">
            {children}
          </main>

        </div>

      </body>
    </html>
  )
}