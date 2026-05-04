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

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        data,
        clients (nome),
        appointment_services (services (prezzo))
      `)

    console.log('DATA:', data)
    console.log('ERROR:', error)

    if (error) return

    setAppointments(data || [])
  }

  // 🔥 ORA MOSTRA TUTTI I DATI (NON SOLO OGGI)
  const total = appointments.reduce((tot, app) => {
    return tot + (app.appointment_services || []).reduce(
      (acc, s) => acc + Number(s.services?.prezzo || 0),
      0
    )
  }, 0)

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Dashboard
      </h1>

      {/* KPI */}
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

      {/* LISTA */}
      <div className="bg-white p-4 rounded-xl shadow">

        <div className="font-bold mb-2">
          Tutti gli appuntamenti
        </div>

        {appointments.length === 0 && (
          <div className="text-gray-500 text-sm">
            Nessun dato trovato
          </div>
        )}

        {appointments.map((app, i) => (
          <div key={i} className="flex justify-between border-b py-1 text-sm">

            <span>{app.clients?.nome || 'Cliente'}</span>

            <span>
              € {(app.appointment_services || []).reduce(
                (acc, s) => acc + Number(s.services?.prezzo || 0),
                0
              )}
            </span>

          </div>
        ))}

      </div>

    </div>
  )
}