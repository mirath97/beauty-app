'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('appointments')
      .select(`
        id,
        data,
        appointment_services (
          services (prezzo)
        )
      `)

    setAppointments(data || [])
  }

  function getTotal(app) {
    return app.appointment_services.reduce(
      (acc, s) => acc + (s.services.prezzo || 0),
      0
    )
  }

  function isToday(date) {
    const d = new Date(date)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  }

  function isThisWeek(date) {
    const d = new Date(date)
    const now = new Date()

    const first = now.getDate() - now.getDay() + 1
    const start = new Date(now.setDate(first))
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    return d >= start && d < end
  }

  function isThisMonth(date) {
    const d = new Date(date)
    const now = new Date()

    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    )
  }

  const todayTotal = appointments
    .filter(a => isToday(a.data))
    .reduce((tot, a) => tot + getTotal(a), 0)

  const weekTotal = appointments
    .filter(a => isThisWeek(a.data))
    .reduce((tot, a) => tot + getTotal(a), 0)

  const monthTotal = appointments
    .filter(a => isThisMonth(a.data))
    .reduce((tot, a) => tot + getTotal(a), 0)

  function groupByDay() {
    const map = {}

    appointments.forEach(a => {
      const key = new Date(a.data).toLocaleDateString('it-IT')

      if (!map[key]) map[key] = 0
      map[key] += getTotal(a)
    })

    return Object.entries(map).slice(-7).reverse()
  }

  return (
    <div className="p-4 space-y-6">

      <h1 className="text-3xl font-bold text-pink-700">
        Dashboard Incassi
      </h1>

      {/* TOTALI */}
      <div className="grid grid-cols-3 gap-4">

        <div className="bg-white p-4 rounded-2xl shadow text-center">
          <div className="text-gray-400 text-sm">Oggi</div>
          <div className="text-xl font-bold text-green-600">
            € {todayTotal}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow text-center">
          <div className="text-gray-400 text-sm">Settimana</div>
          <div className="text-xl font-bold text-green-600">
            € {weekTotal}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow text-center">
          <div className="text-gray-400 text-sm">Mese</div>
          <div className="text-xl font-bold text-green-600">
            € {monthTotal}
          </div>
        </div>

      </div>

      {/* ULTIMI GIORNI */}
      <div className="bg-white p-4 rounded-2xl shadow">

        <h2 className="font-bold mb-3 text-pink-600">
          Ultimi giorni
        </h2>

        <div className="space-y-2">

          {groupByDay().map(([day, total], i) => (
            <div
              key={i}
              className="flex justify-between border-b pb-1"
            >
              <div>{day}</div>
              <div className="font-semibold text-green-600">
                € {total}
              </div>
            </div>
          ))}

        </div>

      </div>

    </div>
  )
}