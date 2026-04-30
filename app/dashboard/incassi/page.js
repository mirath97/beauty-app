'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function IncassiPage() {
  const [appointments, setAppointments] = useState([])
  const [prevAppointments, setPrevAppointments] = useState([])
  const [month, setMonth] = useState(new Date())

  useEffect(() => {
    fetchData()
  }, [month])

  async function fetchData() {
    const start = new Date(month.getFullYear(), month.getMonth(), 1)
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)

    const prevStart = new Date(month.getFullYear(), month.getMonth() - 1, 1)
    const prevEnd = new Date(month.getFullYear(), month.getMonth(), 0)

    const { data } = await supabase
      .from('appointments')
      .select(`
        data,
        clients (id, nome),
        appointment_services (
          services (id, nome, prezzo)
        )
      `)
      .gte('data', prevStart.toISOString())
      .lte('data', end.toISOString())

    const all = data || []

    const current = []
    const prev = []

    all.forEach(app => {
      const d = new Date(app.data)
      if (d >= start && d <= end) current.push(app)
      if (d >= prevStart && d <= prevEnd) prev.push(app)
    })

    setAppointments(current)
    setPrevAppointments(prev)
  }

  // 🔥 FIX INCASSI (IDENTICO AL CALENDARIO)
  function getAppTotal(app) {
    return (app.appointment_services || []).reduce((acc, s) => {
      return acc + Number(s.services?.prezzo || 0)
    }, 0)
  }

  function getTotal(apps) {
    return apps.reduce((tot, app) => tot + getAppTotal(app), 0)
  }

  const currentTotal = getTotal(appointments)
  const prevTotal = getTotal(prevAppointments)

  const diff = currentTotal - prevTotal
  const diffPercent = prevTotal > 0
    ? ((diff / prevTotal) * 100).toFixed(0)
    : 0

  // 📅 TOTALE PER GIORNO
  function getDailyTotals() {
    const map = {}

    appointments.forEach(app => {
      const date = new Date(app.data).toDateString()

      if (!map[date]) map[date] = 0
      map[date] += getAppTotal(app)
    })

    return Object.entries(map)
      .map(([date, total]) => ({
        date: new Date(date),
        total
      }))
      .sort((a, b) => a.date - b.date)
  }

  const dailyTotals = getDailyTotals()

  function changeMonth(offset) {
    const d = new Date(month)
    d.setMonth(d.getMonth() + offset)
    setMonth(d)
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-pink-700">
          Incassi PRO
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
          € {currentTotal}
        </p>

        <p className={`mt-2 font-semibold ${
          diff >= 0 ? 'text-green-600' : 'text-red-500'
        }`}>
          {diff >= 0 ? '▲' : '▼'} {diff} € ({diffPercent}%)
        </p>
      </div>

      {/* 📊 GIORNO PER GIORNO */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-pink-700 font-semibold mb-3">
          📊 Incasso giornaliero
        </h2>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {dailyTotals.map((d, i) => (
            <div key={i} className="flex justify-between border-b pb-1">
              <span>
                {d.date.toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
              <span className="font-semibold">
                € {d.total}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 📈 CONFRONTO */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-pink-700 font-semibold mb-2">
          Confronto mese scorso
        </h2>

        <div className="flex justify-between">
          <span>Questo mese</span>
          <span className="font-semibold">€ {currentTotal}</span>
        </div>

        <div className="flex justify-between">
          <span>Mese scorso</span>
          <span className="font-semibold text-gray-500">
            € {prevTotal}
          </span>
        </div>
      </div>

    </div>
  )
}