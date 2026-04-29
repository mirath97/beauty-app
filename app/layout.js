import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Beauty Lab Antonella',
  description: 'Gestionale centro estetico'
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

          {/* NAV */}
          <nav className="flex justify-around bg-white p-3 shadow text-xl sticky top-0 z-50">

            <Link href="/calendar">📅</Link>
            <Link href="/clients">👤</Link>
            <Link href="/dashboard">💰</Link>
            <Link href="/dashboard/ai">🧠</Link>
            <Link href="/reminders">📲</Link>

          </nav>

          {/* CONTENUTO */}
          <main className="flex-1 w-full max-w-6xl mx-auto p-4">
            {children}
          </main>

        </div>

      </body>
    </html>
  )
}