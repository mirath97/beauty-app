'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardAI() {
  const [insights, setInsights] = useState([])
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

    const currentApps = all.filter(a => {
      const d = new Date(a.data)
      return d >= start && d <= end
    })

    const prevApps = all.filter(a => {
      const d = new Date(a.data)
      return d >= prevStart && d <= prevEnd
    })

    buildInsights(currentApps, prevApps)
  }

  function buildInsights(currentApps, prevApps) {
    const suggestions = []

    const serviceMap = {}
    const prevServiceMap = {}
    const clientMap = {}

    // mese corrente
    currentApps.forEach(app => {
      app.appointment_services.forEach(s => {
        const serv = s.services

        serviceMap[serv.id] = serviceMap[serv.id] || {
          nome: serv.nome,
          count: 0
        }

        serviceMap[serv.id].count++
      })

      if (app.clients) {
        const c = app.clients

        clientMap[c.id] = clientMap[c.id] || {
          nome: c.nome,
          totale: 0
        }

        const total = app.appointment_services.reduce(
          (acc, s) => acc + (s.services.prezzo || 0),
          0
        )

        clientMap[c.id].totale += total
      }
    })

    // mese precedente
    prevApps.forEach(app => {
      app.appointment_services.forEach(s => {
        const serv = s.services
        prevServiceMap[serv.id] = (prevServiceMap[serv.id] || 0) + 1
      })
    })

    // 💅 servizio top
    const topService = Object.values(serviceMap).sort((a,b)=>b.count-a.count)[0]
    if (topService) {
      suggestions.push(`💡 Spingi ${topService.nome}: è il più richiesto`)
    }

    // ⚠️ servizi in calo
    Object.keys(serviceMap).forEach(id => {
      const current = serviceMap[id].count
      const prev = prevServiceMap[id] || 0

      if (prev > 0 && current < prev) {
        suggestions.push(`⚠️ ${serviceMap[id].nome} è in calo`)
      }
    })

    // 👑 cliente top
    const topClient = Object.values(clientMap).sort((a,b)=>b.totale-a.totale)[0]
    if (topClient) {
      suggestions.push(`👑 ${topClient.nome} è una cliente VIP`)
    }

    setInsights(suggestions)
  }

  function changeMonth(offset) {
    const d = new Date(month)
    d.setMonth(d.getMonth() + offset)
    setMonth(d)
  }

  return (
    <div className="p-4 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-pink-700">
          AI Business
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

      {/* INSIGHTS */}
      <div className="space-y-3">

        {insights.length === 0 && (
          <div className="text-gray-400">
            Nessun dato disponibile
          </div>
        )}

        {insights.map((i, index) => (
          <div
            key={index}
            className="p-4 bg-pink-50 rounded-2xl text-pink-700"
          >
            {i}
          </div>
        ))}

      </div>

    </div>
  )
}