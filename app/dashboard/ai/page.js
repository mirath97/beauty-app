'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AIPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('appointments')
      .select(`
        data,
        clients (nome),
        appointment_services (services (nome, prezzo))
      `)

    setAppointments(data || [])
    setLoading(false)
  }

  function getTopServices() {
    const map = {}

    appointments.forEach(app => {
      app.appointment_services?.forEach(s => {
        const nome = s.services?.nome
        if (!nome) return

        map[nome] = (map[nome] || 0) + 1
      })
    })

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
  }

  function getVIPClients() {
    const map = {}

    appointments.forEach(app => {
      const nome = app.clients?.nome
      if (!nome) return

      map[nome] = (map[nome] || 0) + 1
    })

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
  }

  if (loading) {
    return <div className="p-4">Caricamento...</div>
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        AI Business 💅
      </h1>

      {/* SERVIZI TOP */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="font-bold mb-2">🏆 Servizi più richiesti</div>

        {getTopServices().map(([nome, count], i) => (
          <div key={i} className="text-sm">
            {i + 1}. {nome} ({count})
          </div>
        ))}
      </div>

      {/* CLIENTI VIP */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="font-bold mb-2">👑 Clienti VIP</div>

        {getVIPClients().map(([nome, count], i) => (
          <div key={i} className="text-sm">
            {i + 1}. {nome} ({count} visite)
          </div>
        ))}
      </div>

    </div>
  )
}