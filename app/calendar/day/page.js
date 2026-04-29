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
        durata,
        clients (nome)
      `)
      .gte('data', start.toISOString())
      .lte('data', end.toISOString())

    setAppointments(data || [])
  }

  const START_HOUR = 9
  const END_HOUR = 19
  const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60

  function getTop(startDate) {
    const h = startDate.getHours()
    const m = startDate.getMinutes()

    const minutesFromStart =
      (h - START_HOUR) * 60 + m

    return (minutesFromStart / TOTAL_MINUTES) * 100
  }

  function getHeight(duration) {
    return (duration / TOTAL_MINUTES) * 100
  }

  return (
    <div className="p-4">

      <h1 className="text-2xl font-bold text-pink-700 mb-4">
        Timeline PRO
      </h1>

      <input
        type="date"
        onChange={e => setSelectedDate(new Date(e.target.value))}
        className="mb-4 border p-2 rounded"
      />

      <div className="flex">

        {/* COLONNA ORARI */}
        <div className="w-16 text-xs text-gray-400">
          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
            <div key={i} className="h-24 border-t">
              {START_HOUR + i}:00
            </div>
          ))}
        </div>

        {/* AREA TIMELINE */}
        <div className="flex-1 relative h-[720px] bg-white border rounded-xl">

          {/* LINEE ORARIE */}
          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t"
              style={{ top: `${(i / (END_HOUR - START_HOUR)) * 100}%` }}
            />
          ))}

          {/* APPUNTAMENTI */}
          {appointments.map(app => {
            const start = new Date(app.data)
            const durata = app.durata || 60

            const top = getTop(start)
            const height = getHeight(durata)

            return (
              <div
                key={app.id}
                className="absolute left-2 right-2 bg-pink-200 rounded-xl p-2 text-xs shadow"
                style={{
                  top: `${top}%`,
                  height: `${height}%`
                }}
              >
                <div className="font-semibold">
                  {start.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>

                <div>{app.clients?.nome}</div>

                <div className="text-gray-500">
                  {durata} min
                </div>
              </div>
            )
          })}

        </div>

      </div>

    </div>
  )
}