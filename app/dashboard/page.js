'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabaseClient'

export default function Dashboard() {
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = createSupabaseClient()

    const { data: apps } = await supabase.from('appointments').select('*')
    const { data: clients } = await supabase.from('clients').select('*')
    const { data: services } = await supabase.from('services').select('*')
    const { data: appServices } = await supabase.from('appointment_services').select('*')

    if (!apps) return

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

    setAppointments(enriched)
  }

  const total = appointments.reduce((tot, app) => {
    return tot + (app.services || []).reduce(
      (acc, s) => acc + Number(s?.prezzo || 0),
      0
    )
  }, 0)

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-3">

        <div className="bg-pink-100 p-4 rounded-xl">
          <div className="text-sm">Appuntamenti totali</div>
          <div className="text-xl font-bold">
            {appointments.length}
          </div>
        </div>

        <div className="bg-green-100 p-4 rounded-xl">
          <div className="text-sm">Incasso totale</div>
          <div className="text-xl font-bold">
            € {total}
          </div>
        </div>

      </div>

      <div className="bg-white p-4 rounded-xl shadow">

        <div className="font-bold mb-2">
          Tutti gli appuntamenti
        </div>

        {appointments.map((app, i) => (
          <div key={i} className="flex justify-between border-b py-2 text-sm">

            <span>
              {app.client?.nome || 'Cliente'}
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