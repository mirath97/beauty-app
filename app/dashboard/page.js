'use client'

import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-pink-700">
          Dashboard
        </h1>
        <p className="text-gray-400">
          Benvenuta nel gestionale
        </p>
      </div>

      {/* CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* CALENDARIO */}
        <Link
          href="/calendar"
          className="bg-gradient-to-br from-pink-500 to-pink-400 text-white p-6 rounded-2xl shadow-lg"
        >
          <div className="text-3xl mb-2">📅</div>
          <div className="text-lg font-semibold">
            Calendario
          </div>
        </Link>

        {/* CLIENTI */}
        <Link
          href="/clients"
          className="bg-white p-6 rounded-2xl shadow border border-pink-100"
        >
          <div className="text-3xl mb-2">👤</div>
          <div className="text-lg font-semibold text-pink-700">
            Clienti
          </div>
        </Link>

        {/* INCASSI */}
        <Link
          href="/dashboard/incassi"
          className="bg-white p-6 rounded-2xl shadow border border-pink-100"
        >
          <div className="text-3xl mb-2">💰</div>
          <div className="text-lg font-semibold text-pink-700">
            Incassi
          </div>
        </Link>

        {/* AI */}
        <Link
          href="/dashboard/ai"
          className="bg-white p-6 rounded-2xl shadow border border-pink-100"
        >
          <div className="text-3xl mb-2">🧠</div>
          <div className="text-lg font-semibold text-pink-700">
            AI Business
          </div>
        </Link>

        {/* REMINDER */}
        <Link
          href="/reminders"
          className="bg-white p-6 rounded-2xl shadow border border-pink-100"
        >
          <div className="text-3xl mb-2">📲</div>
          <div className="text-lg font-semibold text-pink-700">
            Reminder
          </div>
        </Link>

      </div>

    </div>
  )
}