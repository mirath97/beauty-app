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

  function getTotal(apps) {
    return apps.reduce((tot, app) => {
      const sum = app.appointment_services.reduce(
        (acc, s) => acc + (s.services.prezzo || 0),
        0
      )
      return tot + sum
    }, 0)
  }

  const currentTotal = getTotal(appointments)
  const prevTotal = getTotal(prevAppointments)

  const diff = currentTotal - prevTotal
  const diffPercent = prevTotal > 0
    ? ((diff / prevTotal) * 100).toFixed(0)
    : 0

  // 🎯 ANALISI SERVIZI
  function analyzeServices() {
    const map = {}
    const prevMap = {}

    appointments.forEach(app => {
      app.appointment_services.forEach(s => {
        const serv = s.services
        map[serv.id] = map[serv.id] || { nome: serv.nome, count: 0 }
        map[serv.id].count++
      })
    })

    prevAppointments.forEach(app => {
      app.appointment_services.forEach(s => {
        const serv = s.services
        prevMap[serv.id] = (prevMap[serv.id] || 0) + 1
      })
    })

    const suggestions = []

    const top = Object.values(map).sort((a,b)=>b.count-a.count)[0]
    if (top) {
      suggestions.push(`💡 Spingi ${top.nome}: è il più richiesto`)
    }

    Object.keys(map).forEach(id => {
      const curr = map[id].count
      const prev = prevMap[id] || 0

      if (prev > 0 && curr < prev) {
        suggestions.push(`⚠️ ${map[id].nome} è in calo`)
      }
    })

    return suggestions
  }

  const suggestions = analyzeServices()

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
          {diff >= 0 ? '▲' : '▼'} {diff} € ({diffPercent}% rispetto al mese scorso)
        </p>
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

      {/* 🎯 SUGGERIMENTI */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-2">
        <h2 className="text-pink-700 font-semibold">
          Suggerimenti intelligenti
        </h2>

        {suggestions.length === 0 && (
          <div className="text-gray-400">Dati insufficienti</div>
        )}

        {suggestions.map((s, i) => (
          <div key={i} className="bg-pink-50 p-3 rounded-xl text-pink-700">
            {s}
          </div>
        ))}
      </div>

    </div>
  )
}