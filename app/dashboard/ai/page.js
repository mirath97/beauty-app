'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabaseClient'

export default function AIPage() {
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

async function fetchData() {
  const supabase = createSupabaseClient()
  if (!supabase) return

  const { data } = await supabase
    .from('appointments')
    .select('*')

  setAppointments(data || [])
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

    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3)
  }

  function getVIPClients() {
    const map = {}

    appointments.forEach(app => {
      const nome = app.clients?.nome
      if (!nome) return
      map[nome] = (map[nome] || 0) + 1
    })

    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3)
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        AI Business 💅
      </h1>

      <div className="bg-white p-4 rounded-xl shadow">
        <div className="font-bold mb-2">🏆 Servizi top</div>

        {getTopServices().map(([nome, count], i) => (
          <div key={i}>{i + 1}. {nome} ({count})</div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <div className="font-bold mb-2">👑 Clienti VIP</div>

        {getVIPClients().map(([nome, count], i) => (
          <div key={i}>{i + 1}. {nome} ({count})</div>
        ))}
      </div>

    </div>
  )
}