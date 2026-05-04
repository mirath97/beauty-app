'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function IncassiPage() {
  const [appointments, setAppointments] = useState([])
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = getSupabase()

    const { data: apps } = await supabase.from('appointments').select('*')
    const { data: services } = await supabase.from('services').select('*')
    const { data: appServices } = await supabase.from('appointment_services').select('*')

    const enriched = apps.map(app => {
      const rel = appServices.filter(r => r.appointment_id === app.id)

      const serv = rel.map(r =>
        services.find(s => s.id === r.service_id)
      )

      return { ...app, services: serv }
    })

    setAppointments(enriched)
  }

  const filtered = appointments.filter(app => {
    const d = new Date(app.data)
    return d.getMonth() === month && d.getFullYear() === year
  })

  const total = filtered.reduce((tot, app) => {
    return tot + (app.services || []).reduce(
      (acc, s) => acc + Number(s?.prezzo || 0),
      0
    )
  }, 0)

  function changeMonth(dir) {
    let newMonth = month + dir
    let newYear = year

    if (newMonth < 0) {
      newMonth = 11
      newYear--
    }

    if (newMonth > 11) {
      newMonth = 0
      newYear++
    }

    setMonth(newMonth)
    setYear(newYear)
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Incassi 💰
      </h1>

      <div className="flex justify-between items-center">

        <button onClick={() => changeMonth(-1)}>⬅</button>

        <div className="font-bold">
          {month + 1}/{year}
        </div>

        <button onClick={() => changeMonth(1)}>➡</button>

      </div>

      <div className="bg-green-100 p-4 rounded-xl text-xl font-bold">
        Totale mese: € {total}
      </div>

    </div>
  )
}