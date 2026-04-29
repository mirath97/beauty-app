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

        <div className="max-w-md mx-auto min-h-screen flex flex-col gap-4 p-4">

          {/* HEADER */}
          <div className="text-center">
            <h1 style={{color: 'red'}}>TEST GITHUB</h1>
          </div>

          {/* NAV */}
          <nav className="flex justify-between bg-white p-3 rounded-2xl shadow text-xl">

            <Link href="/calendar" className="flex-1 text-center">
              📅
            </Link>

            <Link href="/clients" className="flex-1 text-center">
              👤
            </Link>

            <Link href="/dashboard" className="flex-1 text-center">
              💰
            </Link>

            <Link href="/dashboard/ai" className="flex-1 text-center">
              🧠
            </Link>

            <Link href="/reminders" className="flex-1 text-center">
              📲
            </Link>

          </nav>

          {/* CONTENUTO */}
          <div className="flex-1">
            {children}
          </div>

        </div>

      </body>
    </html>
  )
}