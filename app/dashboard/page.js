'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [appointments, setAppointments] = useState([])
  const [month, setMonth] = useState(new Date())

  useEffect(() => {
    fetchData()
  }, [month])

  async function fetchData() {
    const start = new Date(month.getFullYear(), month.getMonth(), 1)
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)

    const { data } = await supabase
      .from('appointments')
      .select(`
        data,
        appointment_services (
          services (prezzo)
        )
      `)
      .gte('data', start.toISOString())
      .lte('data', end.toISOString())

    setAppointments(data || [])
  }

  function getTotal() {
    return appointments.reduce((tot, app) => {
      const sum = app.appointment_services.reduce(
        (acc, s) => acc + (s.services.prezzo || 0),
        0
      )
      return tot + sum
    }, 0)
  }

  function changeMonth(offset) {
    const d = new Date(month)
    d.setMonth(d.getMonth() + offset)
    setMonth(d)
  }

  return (
    <div className="p-4 space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-pink-700">
          Incassi
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

      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-pink-600">Totale mese</h2>
        <p className="text-3xl font-bold">
          € {getTotal()}
        </p>
      </div>

    </div>
  )
}