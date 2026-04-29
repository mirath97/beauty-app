import Link from 'next/link'
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="bg-pink-50">

        <div className="flex h-screen">

          {/* SIDEBAR */}
          <aside className="w-64 bg-white border-r border-pink-100 p-6 flex flex-col justify-between">

            <div>
             <h1 className="text-2xl font-bold text-pink-600">
					Beauty Lab Antonella
				</h1>

              <nav className="flex flex-col gap-2">
                <Link href="/" className="p-3 rounded-xl hover:bg-pink-100">
                  🏠 Home
                </Link>

                <Link href="/calendar" className="p-3 rounded-xl hover:bg-pink-100">
                  📅 Calendario
                </Link>
				<Link href="/calendar/week" className="p-3 rounded-xl hover:bg-pink-100">
					📅 Settimana
				</Link>
				<Link href="/dashboard" className="p-3 rounded-xl hover:bg-pink-100">
					📊 Dashboard
				</Link>
				<Link href="/dashboard/ai" className="p-3 rounded-xl hover:bg-pink-100">
					🧠 AI
				</Link>
				<Link href="/reminders" className="p-3 rounded-xl hover:bg-pink-100">
					📲 Reminder
					</Link>

                <Link href="/clients" className="p-3 rounded-xl hover:bg-pink-100">
                  👤 Clienti
                </Link>
              </nav>
            </div>

            <div className="text-sm text-pink-300">
              Beauty App v1.0
            </div>

          </aside>

          {/* CONTENUTO */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>

        </div>

      </body>
    </html>
  )
}