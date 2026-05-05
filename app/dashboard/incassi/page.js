'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function IncassiPage() {
  const [appointments, setAppointments] = useState([])
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = getSupabase()

    const { data: apps } = await supabase.from('appointments').select('*')
    const { data: services } = await supabase.from('services').select('*')
    const { data: appServices } = await supabase.from('appointment_services').select('*')

    const enriched = apps.map(app => {
      const rel = appServices.filter(r => r.appointment_id === app.id)

      const serv = rel.map(r =>
        services.find(s => s.id === r.service_id)
      )

      return { ...app, services: serv }
    })

    setAppointments(enriched)
  }

  // 🔁 cambio mese
  function changeMonth(dir) {
    let newMonth = month + dir
    let newYear = year

    if (newMonth < 0) {
      newMonth = 11
      newYear--
    }

    if (newMonth > 11) {
      newMonth = 0
      newYear++
    }

    setMonth(newMonth)
    setYear(newYear)
  }

  // 📅 filtro mese attuale
  const filtered = appointments.filter(app => {
    const d = new Date(app.data)
    return d.getMonth() === month && d.getFullYear() === year
  })

  // 📅 mese precedente
  let prevMonth = month - 1
  let prevYear = year

  if (prevMonth < 0) {
    prevMonth = 11
    prevYear--
  }

  const filteredPrev = appointments.filter(app => {
    const d = new Date(app.data)
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear
  })

  // 💰 totale mese
  const totalMonth = filtered.reduce((tot, app) => {
    return tot + (app.services || []).reduce(
      (acc, s) => acc + Number(s?.prezzo || 0),
      0
    )
  }, 0)

  // 💰 totale mese precedente
  const totalPrevMonth = filteredPrev.reduce((tot, app) => {
    return tot + (app.services || []).reduce(
      (acc, s) => acc + Number(s?.prezzo || 0),
      0
    )
  }, 0)

  // 📊 differenza
  const diff = totalMonth - totalPrevMonth

  const percent =
    totalPrevMonth > 0
      ? Math.round((diff / totalPrevMonth) * 100)
      : 0

  // 📊 giornaliero
  const daily = {}

  filtered.forEach(app => {
    const day = new Date(app.data).toLocaleDateString()

    const value = (app.services || []).reduce(
      (acc, s) => acc + Number(s?.prezzo || 0),
      0
    )

    if (!daily[day]) {
      daily[day] = { total: 0, count: 0 }
    }

    daily[day].total += value
    daily[day].count += 1
  })

  const sortedDays = Object.entries(daily).sort(
    (a, b) => new Date(a[0]) - new Date(b[0])
  )

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Incassi 💰
      </h1>

      {/* NAV MESE */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow">
        <button onClick={() => changeMonth(-1)}>⬅</button>

        <div className="font-bold text-pink-600">
          {month + 1}/{year}
        </div>

        <button onClick={() => changeMonth(1)}>➡</button>
      </div>

      {/* TOTALE */}
      <div className="bg-gradient-to-r from-green-400 to-green-300 text-white p-5 rounded-2xl shadow text-center">

        <div className="text-sm">Totale mese</div>

        <div className="text-3xl font-bold mt-1">
          € {totalMonth}
        </div>

        {/* 👉 NUOVO: confronto */}
        <div className="text-sm mt-2">

          {diff >= 0 ? '📈' : '📉'} {diff >= 0 ? '+' : ''}{diff} € 
          ({percent}% rispetto al mese precedente)

        </div>

      </div>

      {/* LISTA GIORNI */}
      <div className="space-y-2">

        {sortedDays.length === 0 && (
          <div className="text-gray-500 text-sm">
            Nessun incasso in questo mese
          </div>
        )}

        {sortedDays.map(([day, data]) => (
          <div
            key={day}
            className="bg-white p-4 rounded-xl shadow flex justify-between items-center"
          >

            <div>
              <div className="font-bold text-sm">
                {day}
              </div>

              <div className="text-xs text-gray-500">
                {data.count} appuntamenti
              </div>
            </div>

            <div className="font-bold text-green-600">
              € {data.total}
            </div>

          </div>
        ))}

      </div>

    </div>
  )
}