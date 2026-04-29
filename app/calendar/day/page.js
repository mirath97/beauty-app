'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DayView() {
  const [appointments, setAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate])

  async function fetchAppointments() {
    const start = new Date(selectedDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(selectedDate)
    end.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from('appointments')
      .select(`
        id,
        data,
        clients (nome),
        appointment_services (
          services (nome, durata)
        )
      `)
      .gte('data', start.toISOString())
      .lte('data', end.toISOString())

    setAppointments(data || [])
  }

  function getHours() {
    const hours = []
    for (let i = 9; i <= 19; i++) {
      hours.push(i)
    }
    return hours
  }

  function getPosition(app) {
    const date = new Date(app.data)
    const hour = date.getHours()
    const minutes = date.getMinutes()

    const top = (hour - 9) * 80 + (minutes / 60) * 80

    // durata
    const duration = app.appointment_services.reduce(
      (acc, s) => acc + (s.services.durata || 30),
      0
    )

    const height = (duration / 60) * 80

    return { top, height }
  }

  return (
    <div className="p-4">

      <h1 className="text-2xl font-bold text-pink-700 mb-4">
        Timeline giornaliera
      </h1>

      <input
        type="date"
        onChange={e => setSelectedDate(new Date(e.target.value))}
        className="mb-4 border p-2 rounded"
      />

      <div className="relative border rounded-xl h-[800px] bg-white">

        {/* ORARI */}
        {getHours().map(h => (
          <div
            key={h}
            className="absolute left-0 w-full border-t text-xs text-gray-400"
            style={{ top: (h - 9) * 80 }}
          >
            {h}:00
          </div>
        ))}

        {/* APPUNTAMENTI */}
        {appointments.map(app => {
          const { top, height } = getPosition(app)

          return (
            <div
              key={app.id}
              className="absolute left-16 right-2 bg-pink-200 rounded-xl p-2 text-xs shadow"
              style={{
                top,
                height
              }}
            >
              <div className="font-semibold">
                {new Date(app.data).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              <div>{app.clients?.nome}</div>
            </div>
          )
        })}

      </div>

    </div>
  )
}