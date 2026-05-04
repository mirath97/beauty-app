'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function Dashboard() {
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = getSupabase()

    const { data: apps } = await supabase.from('appointments').select('*')
    const { data: clients } = await supabase.from('clients').select('*')
    const { data: services } = await supabase.from('services').select('*')
    const { data: appServices } = await supabase.from('appointment_services').select('*')

    const enriched = apps.map(app => {
      const client = clients?.find(c => c.id === app.client_id)

      const rel = appServices?.filter(r => r.appointment_id === app.id)

      const serv = rel?.map(r =>
        services?.find(s => s.id === r.service_id)
      )

      return {
        ...app,
        client,
        services: serv
      }
    })

    setAppointments(enriched || [])
  }

  // 📅 oggi
  const today = new Date()

  const todayApps = appointments.filter(app => {
    const d = new Date(app.data)
    return d.toDateString() === today.toDateString()
  })

  // 💰 incasso oggi
  const todayTotal = todayApps.reduce((tot, app) => {
    return tot + (app.services || []).reduce(
      (acc, s) => acc + Number(s?.prezzo || 0),
      0
    )
  }, 0)

  // 👑 cliente top
  function getTopClient() {
    const map = {}

    appointments.forEach(app => {
      const nome = app.client?.nome
      if (!nome) return
      map[nome] = (map[nome] || 0) + 1
    })

    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])

    return sorted[0] || ['-', 0]
  }

  // 🔥 servizio top
  function getTopService() {
    const map = {}

    appointments.forEach(app => {
      app.services?.forEach(s => {
        const nome = s?.nome
        if (!nome) return
        map[nome] = (map[nome] || 0) + 1
      })
    })

    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])

    return sorted[0] || ['-', 0]
  }

  const [topClient, topCount] = getTopClient()
  const [topService, serviceCount] = getTopService()

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Dashboard 💅
      </h1>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3">

        <div className="bg-pink-100 p-4 rounded-xl">
          <div className="text-sm">Appuntamenti oggi</div>
          <div className="text-xl font-bold">
            {todayApps.length}
          </div>
        </div>

        <div className="bg-green-100 p-4 rounded-xl">
          <div className="text-sm">Incasso oggi</div>
          <div className="text-xl font-bold">
            € {todayTotal}
          </div>
        </div>

        <div className="bg-purple-100 p-4 rounded-xl">
          <div className="text-sm">Cliente top</div>
          <div className="text-sm font-bold">
            {topClient} ({topCount})
          </div>
        </div>

        <div className="bg-yellow-100 p-4 rounded-xl">
          <div className="text-sm">Servizio top</div>
          <div className="text-sm font-bold">
            {topService} ({serviceCount})
          </div>
        </div>

      </div>

      {/* LISTA OGGI */}
      <div className="bg-white p-4 rounded-xl shadow">

        <div className="font-bold mb-2">
          📅 Appuntamenti oggi
        </div>

        {todayApps.length === 0 && (
          <div className="text-gray-500 text-sm">
            Nessun appuntamento oggi
          </div>
        )}

        {todayApps.map(app => (
          <div
            key={app.id}
            className="flex justify-between border-b py-2 text-sm"
          >

            <span>
              {app.client?.nome}
            </span>

            <span>
              € {(app.services || []).reduce(
                (acc, s) => acc + Number(s?.prezzo || 0),
                0
              )}
            </span>

          </div>
        ))}

      </div>

    </div>
  )
}