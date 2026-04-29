'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CalendarPage() {
  const [appointments, setAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate])

  async function fetchAppointments() {
    const dateStr = selectedDate.toISOString().split('T')[0]

    const { data } = await supabase
      .from('appointments')
      .select(`
        id,
        data,
        clients (nome),
        appointment_services (
          services (nome)
        )
      `)
      .gte('data', dateStr + 'T00:00:00')
      .lte('data', dateStr + 'T23:59:59')
      .order('data')

    setAppointments(data || [])
  }

  function formatDate(date) {
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  function changeDay(offset) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + offset)
    setSelectedDate(d)
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <button
          onClick={() => changeDay(-1)}
          className="px-4 py-2 bg-gray-200 rounded-xl"
        >
          ←
        </button>

        <h1 className="text-xl font-bold text-pink-700 capitalize">
          {formatDate(selectedDate)}
        </h1>

        <button
          onClick={() => changeDay(1)}
          className="px-4 py-2 bg-gray-200 rounded-xl"
        >
          →
        </button>

      </div>

      {/* LISTA APPUNTAMENTI */}
      <div className="space-y-3">

        {appointments.length === 0 && (
          <div className="text-gray-400 text-center">
            Nessun appuntamento
          </div>
        )}

        {appointments.map(app => {

          const time = new Date(app.data).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })

          const servizi = app.appointment_services
            ?.map(s => s.services.nome)
            .join(', ')

          return (
            <div
              key={app.id}
              className="bg-white p-4 rounded-2xl shadow border border-pink-100 flex justify-between items-center"
            >

              <div>
                <div className="text-lg font-semibold text-pink-700">
                  {time}
                </div>

                <div className="font-semibold">
                  {app.clients?.nome}
                </div>

                <div className="text-sm text-gray-400">
                  {servizi}
                </div>
              </div>

            </div>
          )
        })}

      </div>

      {/* BOTTONE NUOVO */}
      <button
        className="w-full bg-pink-600 text-white p-4 rounded-2xl shadow-lg text-lg"
      >
        ➕ Nuovo Appuntamento
      </button>

    </div>
  )
}