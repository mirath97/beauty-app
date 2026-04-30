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

  // 💰 totale appuntamento
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

  // 📅 GENERA TUTTI I GIORNI DEL MESE
  function getFullMonthDays() {
    const year = month.getFullYear()
    const m = month.getMonth()

    const daysInMonth = new Date(year, m + 1, 0).getDate()

    const map = {}

    appointments.forEach(app => {
      const key = new Date(app.data).toDateString()
      if (!map[key]) map[key] = 0
      map[key] += getAppTotal(app)
    })

    return Array.from({ length: daysInMonth }).map((_, i) => {
      const date = new Date(year, m, i + 1)
      const key = date.toDateString()

      return {
        date,
        total: map[key] || 0
      }
    })
  }

  const dailyTotals = getFullMonthDays()

  // 🔥 OGGI
  const todayTotal = dailyTotals.find(d =>
    d.date.toDateString() === new Date().toDateString()
  )?.total || 0

  // 🔥 SETTIMANA
  function getWeekTotal() {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - 7)

    return appointments
      .filter(a => new Date(a.data) >= start)
      .reduce((tot, app) => tot + getAppTotal(app), 0)
  }

  const weekTotal = getWeekTotal()

  // 🔥 MIGLIOR GIORNO
  const bestDay = [...dailyTotals].sort((a, b) => b.total - a.total)[0]

  // 🔥 PEGGIOR GIORNO
  const worstDay = [...dailyTotals].sort((a, b) => a.total - b.total)[0]

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
         INCASSI NUOVO
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

      {/* 💰 KPI VELOCI */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-100 p-3 rounded-xl text-center">
          <div className="text-xs">Oggi</div>
          <div className="font-bold">€ {todayTotal}</div>
        </div>

        <div className="bg-blue-100 p-3 rounded-xl text-center">
          <div className="text-xs">Settimana</div>
          <div className="font-bold">€ {weekTotal}</div>
        </div>

        <div className="bg-purple-100 p-3 rounded-xl text-center">
          <div className="text-xs">Mese</div>
          <div className="font-bold">€ {currentTotal}</div>
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

      {/* 🏆 INSIGHT */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-pink-700 font-semibold mb-2">
          🧠 Insight
        </h2>

        {bestDay && (
          <div className="text-green-600">
            🔥 Giorno migliore: € {bestDay.total}
          </div>
        )}

        {worstDay && (
          <div className="text-red-500">
            ⚠️ Giorno peggiore: € {worstDay.total}
          </div>
        )}
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