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

  // 👉 cambio mese
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

  // 👉 filtro mese
  const filtered = appointments.filter(app => {
    const d = new Date(app.data)
    return d.getMonth() === month && d.getFullYear() === year
  })

  // 💰 totale mese
  const total = filtered.reduce((tot, app) => {
    return tot + (app.services || []).reduce(
      (acc, s) => acc + Number(s?.prezzo || 0),
      0
    )
  }, 0)

  // 📅 giornaliero
  const dailyTotals = {}
  filtered.forEach(app => {
    const day = new Date(app.data).toLocaleDateString()

    const val = (app.services || []).reduce(
      (acc, s) => acc + Number(s?.prezzo || 0),
      0
    )

    dailyTotals[day] = (dailyTotals[day] || 0) + val
  })

  // 🔥 per servizio
  const serviceTotals = {}
  filtered.forEach(app => {
    app.services?.forEach(s => {
      const nome = s?.nome
      if (!nome) return

      serviceTotals[nome] =
        (serviceTotals[nome] || 0) + Number(s?.prezzo || 0)
    })
  })

  // 📊 numero appuntamenti
  const totalAppointments = filtered.length

  // 📊 media giornaliera
  const daysCount = Object.keys(dailyTotals).length || 1
  const avgDaily = Math.round(total / daysCount)

  // 🏆 giorno migliore
  let bestDay = '-'
  let bestValue = 0

  Object.entries(dailyTotals).forEach(([day, val]) => {
    if (val > bestValue) {
      bestValue = val
      bestDay = day
    }
  })

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Incassi PRO 💰
      </h1>

      {/* NAV MESE */}
      <div className="flex justify-between items-center">

        <button onClick={() => changeMonth(-1)}>⬅</button>

        <div className="font-bold">
          {month + 1}/{year}
        </div>

        <button onClick={() => changeMonth(1)}>➡</button>

      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3">

        <div className="bg-green-100 p-4 rounded-xl">
          <div className="text-sm">Totale mese</div>
          <div className="text-xl font-bold">€ {total}</div>
        </div>

        <div className="bg-pink-100 p-4 rounded-xl">
          <div className="text-sm">Appuntamenti</div>
          <div className="text-xl font-bold">{totalAppointments}</div>
        </div>

        <div className="bg-yellow-100 p-4 rounded-xl">
          <div className="text-sm">Media giornaliera</div>
          <div className="text-xl font-bold">€ {avgDaily}</div>
        </div>

        <div className="bg-purple-100 p-4 rounded-xl">
          <div className="text-sm">Giorno migliore</div>
          <div className="text-sm font-bold">
            {bestDay} (€ {bestValue})
          </div>
        </div>

      </div>

      {/* 📅 GIORNI */}
      <div className="bg-white p-4 rounded-xl shadow">

        <div className="font-bold text-pink-600 mb-2">
          Incassi giornalieri
        </div>

        {Object.entries(dailyTotals).map(([day, val]) => (
          <div key={day} className="flex justify-between text-sm border-b py-1">
            <span>{day}</span>
            <span>€ {val}</span>
          </div>
        ))}

      </div>

      {/* 🔥 SERVIZI */}
      <div className="bg-white p-4 rounded-xl shadow">

        <div className="font-bold text-pink-600 mb-2">
          Servizi più redditizi
        </div>

        {Object.entries(serviceTotals)
          .sort((a, b) => b[1] - a[1])
          .map(([name, val]) => (
            <div key={name} className="flex justify-between text-sm border-b py-1">
              <span>{name}</span>
              <span>€ {val}</span>
            </div>
          ))}

      </div>

    </div>
  )
}