'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    fetchToday()
  }, [])

  async function fetchToday() {
    const today = new Date()
    const start = new Date(today)
    start.setHours(0,0,0,0)

    const end = new Date(today)
    end.setHours(23,59,59,999)

    const { data } = await supabase
      .from('appointments')
      .select(`
        data,
        clients (nome),
        appointment_services (services (prezzo))
      `)
      .gte('data', start.toISOString())
      .lte('data', end.toISOString())

    setAppointments(data || [])
  }

  function getTotal() {
    return appointments.reduce((tot, app) => {
      return tot + (app.appointment_services || []).reduce(
        (acc, s) => acc + Number(s.services?.prezzo || 0),
        0
      )
    }, 0)
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Dashboard
      </h1>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3">

        <div className="bg-pink-100 p-4 rounded-xl">
          <div className="text-sm">Appuntamenti oggi</div>
          <div className="text-xl font-bold">
            {appointments.length}
          </div>
        </div>

        <div className="bg-green-100 p-4 rounded-xl">
          <div className="text-sm">Incasso oggi</div>
          <div className="text-xl font-bold">
            € {getTotal()}
          </div>
        </div>

      </div>

      {/* LISTA */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="font-bold mb-2">
          📅 Oggi
        </div>

        {appointments.length === 0 && (
          <div className="text-gray-500 text-sm">
            Nessun appuntamento oggi
          </div>
        )}

        {appointments.map((app, i) => (
          <div key={i} className="flex justify-between border-b py-1 text-sm">
            <span>{app.clients?.nome}</span>
            <span>
              {new Date(app.data).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}