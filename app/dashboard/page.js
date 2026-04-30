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
        data,
        clients (nome),
        appointment_services (services (prezzo))
      `)

    setAppointments(data || [])
  }

  function getToday() {
    const today = new Date().toDateString()

    return appointments.filter(a =>
      new Date(a.data).toDateString() === today
    )
  }

  function getTodayTotal() {
    return getToday().reduce((tot, app) => {
      return tot + app.appointment_services.reduce(
        (acc, s) => acc + Number(s.services?.prezzo || 0),
        0
      )
    }, 0)
  }

  const todayApps = getToday()

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
            {todayApps.length}
          </div>
        </div>

        <div className="bg-green-100 p-4 rounded-xl">
          <div className="text-sm">Incasso oggi</div>
          <div className="text-xl font-bold">
            € {getTodayTotal()}
          </div>
        </div>

      </div>

      {/* LISTA OGGI */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="font-bold mb-2">
          📅 Oggi
        </div>

        {todayApps.map((app, i) => (
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