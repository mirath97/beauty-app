'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function IncassiPage() {
  const [appointments, setAppointments] = useState([])
  const [month, setMonth] = useState(new Date())

  useEffect(() => {
    fetchData()
  }, [month])

  async function fetchData() {
    const start = new Date(month.getFullYear(), month.getMonth(), 1)
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)

    const { data } = await supabase
      .from('appointments')
      .select(`
        data,
        clients (id, nome),
        appointment_services (
          services (prezzo)
        )
      `)
      .gte('data', start.toISOString())
      .lte('data', end.toISOString())

    setAppointments(data || [])
  }

  // 💰 totale mese
  function getTotal() {
    return appointments.reduce((tot, app) => {
      const sum = app.appointment_services.reduce(
        (acc, s) => acc + (s.services.prezzo || 0),
        0
      )
      return tot + sum
    }, 0)
  }

  // 📅 guadagno giornaliero
  function getDailyTotals() {
    const map = {}

    appointments.forEach(app => {
      const date = new Date(app.data).toLocaleDateString()

      const total = app.appointment_services.reduce(
        (acc, s) => acc + (s.services.prezzo || 0),
        0
      )

      map[date] = (map[date] || 0) + total
    })

    return Object.entries(map).sort((a, b) => new Date(b[0]) - new Date(a[0]))
  }

  // 👑 clienti top
  function getTopClients() {
    const map = {}

    appointments.forEach(app => {
      const client = app.clients
      if (!client) return

      const total = app.appointment_services.reduce(
        (acc, s) => acc + (s.services.prezzo || 0),
        0
      )

      map[client.id] = map[client.id] || {
        nome: client.nome,
        totale: 0
      }

      map[client.id].totale += total
    })

    return Object.values(map)
      .sort((a, b) => b.totale - a.totale)
      .slice(0, 5)
  }

  function changeMonth(offset) {
    const d = new Date(month)
    d.setMonth(d.getMonth() + offset)
    setMonth(d)
  }

  const dailyTotals = getDailyTotals()
  const topClients = getTopClients()

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-pink-700">
          Incassi
        </h1>

        <div className="flex gap-2">
          <button onClick={() => changeMonth(-1)}>←</button>
          <div>
            {month.toLocaleDateString('it-IT', {
              month: 'long',
              year: 'numeric'
            })}
          </div>
          <button onClick={() => changeMonth(1)}>→</button>
        </div>
      </div>

      {/* 💰 TOTALE */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-pink-600">Totale mese</h2>
        <p className="text-3xl font-bold">
          € {getTotal()}
        </p>
      </div>

      {/* 📅 GIORNALIERO */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-3">
        <h2 className="text-pink-700 font-semibold">
          Guadagno giornaliero
        </h2>

        {dailyTotals.length === 0 && (
          <div className="text-gray-400">Nessun dato</div>
        )}

        {dailyTotals.map(([date, total], i) => (
          <div key={i} className="flex justify-between border-b pb-2">
            <span>{date}</span>
            <span className="font-semibold text-pink-600">
              € {total}
            </span>
          </div>
        ))}
      </div>

      {/* 👑 CLIENTI TOP */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-3">
        <h2 className="text-pink-700 font-semibold">
          Clienti più redditizi
        </h2>

        {topClients.length === 0 && (
          <div className="text-gray-400">Nessun dato</div>
        )}

        {topClients.map((c, i) => (
          <div key={i} className="flex justify-between border-b pb-2">
            <span>{i + 1}. {c.nome}</span>
            <span className="font-semibold text-pink-600">
              € {c.totale}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}