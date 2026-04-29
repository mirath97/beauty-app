'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function WeekCalendar() {
  const [appointments, setAppointments] = useState([])
  const [currentWeek, setCurrentWeek] = useState(new Date())

  useEffect(() => {
    fetchAppointments()
  }, [currentWeek])

  async function fetchAppointments() {
    const start = new Date(currentWeek)
    start.setDate(start.getDate() - start.getDay())

    const end = new Date(start)
    end.setDate(start.getDate() + 7)

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

  function getWeekDays() {
    const start = new Date(currentWeek)
    start.setDate(start.getDate() - start.getDay())

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }

  function getAppointmentsForDay(day) {
    const date = day.toISOString().split('T')[0]

    return appointments.filter(app =>
      app.data.startsWith(date)
    )
  }

  function getTotal(app) {
    return app.appointment_services.reduce(
      (acc, s) => acc + (s.services.prezzo || 0),
      0
    )
  }

  const days = getWeekDays()

  return (
    <div className="p-4 space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-pink-700">
          Settimana
        </h1>

        <div className="flex gap-2">
          <button
            onClick={() =>
              setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() - 7)))
            }
            className="px-3 py-1 bg-gray-200 rounded"
          >
            ←
          </button>

          <button
            onClick={() =>
              setCurrentWeek(new Date(currentWeek.setDate(currentWeek.getDate() + 7)))
            }
            className="px-3 py-1 bg-gray-200 rounded"
          >
            →
          </button>
        </div>
      </div>

      {/* GRID SETTIMANA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">

        {days.map((day, i) => {
          const dayApps = getAppointmentsForDay(day)

          return (
            <div key={i} className="bg-white rounded-2xl shadow p-3 space-y-3">

              {/* HEADER GIORNO */}
              <div className="text-center font-semibold text-pink-700">
                {day.toLocaleDateString('it-IT', {
                  weekday: 'short',
                  day: 'numeric'
                })}
              </div>

              {/* APPUNTAMENTI */}
              <div className="space-y-2">

                {dayApps.length === 0 && (
                  <div className="text-gray-300 text-sm text-center">
                    Nessun appuntamento
                  </div>
                )}

                {dayApps.map(app => (
                  <div
                    key={app.id}
                    className="p-3 bg-pink-50 rounded-xl border border-pink-100"
                  >

                    <div className="font-semibold text-pink-700">
                      {app.clients?.nome}
                    </div>

                    <div className="text-xs text-gray-400">
                      {new Date(app.data).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>

                    <div className="text-xs text-pink-500">
                      {app.appointment_services
                        .map(s => s.services.nome)
                        .join(', ')
                      }
                    </div>

                    <div className="text-sm font-bold text-pink-700 mt-1">
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