'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabaseClient'

export default function IncassiPage() {
  const [appointments, setAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState('')

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

    if (error) {
      console.error(error)
      return
    }

    setAppointments(data || [])
  }

  function isSameDay(dateStr, selected) {
    if (!selected) return true

    const d1 = new Date(dateStr)
    const d2 = new Date(selected)

    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    )
  }

  const filtered = appointments.filter(a =>
    isSameDay(a.data, selectedDate)
  )

  function getTotal() {
    return filtered.reduce((tot, app) => {
      return tot + (app.appointment_services || []).reduce(
        (acc, s) => acc + Number(s.services?.prezzo || 0),
        0
      )
    }, 0)
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Incassi 💰
      </h1>

      {/* FILTRO DATA */}
      <div className="bg-white p-3 rounded-xl shadow">
        <div className="text-sm mb-1">Seleziona giorno</div>

        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>

      {/* TOTALE */}
      <div className="bg-green-100 p-4 rounded-xl">
        <div className="text-sm">Totale</div>
        <div className="text-2xl font-bold">
          € {getTotal()}
        </div>
      </div>

      {/* LISTA */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="font-bold mb-2">
          Appuntamenti
        </div>

        {filtered.length === 0 && (
          <div className="text-gray-500 text-sm">
            Nessun dato
          </div>
        )}

        {filtered.map((app, i) => (
          <div
            key={i}
            className="flex justify-between border-b py-1 text-sm"
          >
            <span>{app.clients?.nome}</span>

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