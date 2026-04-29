'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CalendarPage() {
  const [appointments, setAppointments] = useState([])
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()))

  useEffect(() => {
    fetchAppointments()
  }, [weekStart])

  function getStartOfWeek(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  function getWeekDays() {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }

  async function fetchAppointments() {
    const start = new Date(weekStart)
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 7)

    const { data } = await supabase
      .from('appointments')
      .select(`
        id,
        data,
        clients (nome),
        appointment_services (
          services (nome, prezzo)
        )
      `)
      .gte('data', start.toISOString())
      .lte('data', end.toISOString())
      .order('data')

    setAppointments(data || [])
  }

  function changeWeek(offset) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + offset * 7)
    setWeekStart(d)
  }

  function getAppointmentsForDay(day) {
    return appointments.filter(app => {
      const d = new Date(app.data)
      return d.toDateString() === day.toDateString()
    })
  }

  function formatDay(d) {
    return d.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric'
    })
  }

  function getTotal(app) {
    return app.appointment_services.reduce(
      (acc, s) => acc + (s.services.prezzo || 0),
      0
    )
  }

  function getDailyTotal(dayApps) {
    return dayApps.reduce((tot, app) => tot + getTotal(app), 0)
  }

  // 🔥 LOGICA INTELLIGENTE COLORI
  function getDayColor(total) {
    if (total === 0) return 'bg-gray-100'
    if (total < 80) return 'bg-red-100'
    if (total < 150) return 'bg-yellow-100'
    return 'bg-green-100'
  }

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <button onClick={() => changeWeek(-1)}>←</button>

        <h1 className="text-2xl font-bold text-pink-700">
          Calendario intelligente
        </h1>

        <button onClick={() => changeWeek(1)}>→</button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-7 gap-2">

        {getWeekDays().map((day, i) => {
          const dayApps = getAppointmentsForDay(day)
          const total = getDailyTotal(dayApps)

          return (
            <div
              key={i}
              className={`p-2 rounded-xl ${getDayColor(total)}`}
            >

              {/* GIORNO */}
              <div className="text-center">

                <div className="font-bold text-pink-700">
                  {formatDay(day)}
                </div>

                <div className="text-green-700 text-sm font-semibold">
                  € {total}
                </div>

              </div>

              {/* APPUNTAMENTI */}
              <div className="mt-2 space-y-1">

                {dayApps.map(app => (
                  <div
                    key={app.id}
                    className="bg-white p-2 rounded-lg text-xs shadow"
                  >
                    <div className="font-semibold">
                      {new Date(app.data).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>

                    <div>{app.clients?.nome}</div>

                    <div className="text-green-600 font-bold">
                      € {getTotal(app)}
                    </div>
                  </div>
                ))}

              </div>

            </div>
          )
        })}

      </div>

    </div>
  )
}