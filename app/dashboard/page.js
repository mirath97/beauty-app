'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { getSupabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])

  const [todayTotal, setTodayTotal] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = getSupabase()

    const { data: apps } = await supabase
      .from('appointments')
      .select('*')

    const { data: clientsData } = await supabase
      .from('clients')
      .select('*')

    const { data: servicesData } = await supabase
      .from('services')
      .select('*')

    const { data: appServices } = await supabase
      .from('appointment_services')
      .select('*')

    setClients(clientsData || [])
    setServices(servicesData || [])

    const enriched = (apps || []).map(app => {
      const client = clientsData?.find(
        c => c.id === app.client_id
      )

      const rel = appServices?.filter(
        r => r.appointment_id === app.id
      )

      const serv = rel?.map(r =>
        servicesData?.find(
          s => s.id === r.service_id
        )
      )

      return {
        ...app,
        client,
        services: serv || []
      }
    })

    enriched.sort(
      (a, b) => new Date(a.data) - new Date(b.data)
    )

    setAppointments(enriched)

    // 💰 totale oggi
    const today = new Date().toDateString()

    const todayApps = enriched.filter(
      a =>
        new Date(a.data).toDateString() ===
        today
    )

    const total = todayApps.reduce((tot, app) => {
      return (
        tot +
        (app.services || []).reduce(
          (acc, s) =>
            acc + Number(s?.prezzo || 0),
          0
        )
      )
    }, 0)

    setTodayTotal(total)
  }

  // 📅 appuntamenti oggi
  const todayAppointments =
    appointments.filter(
      app =>
        new Date(app.data).toDateString() ===
        new Date().toDateString()
    )

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div>

        <h1 className="text-3xl font-bold text-pink-700">
          Dashboard 💅
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Benvenuta nel gestionale BeautyLab
        </p>

      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <div className="bg-white p-4 rounded-2xl shadow">

          <div className="text-sm text-gray-500">
            Appuntamenti oggi
          </div>

          <div className="text-2xl font-bold text-pink-600 mt-1">
            {todayAppointments.length}
          </div>

        </div>

        <div className="bg-white p-4 rounded-2xl shadow">

          <div className="text-sm text-gray-500">
            Clienti
          </div>

          <div className="text-2xl font-bold text-pink-600 mt-1">
            {clients.length}
          </div>

        </div>

        <div className="bg-white p-4 rounded-2xl shadow">

          <div className="text-sm text-gray-500">
            Servizi
          </div>

          <div className="text-2xl font-bold text-pink-600 mt-1">
            {services.length}
          </div>

        </div>

        <div className="bg-white p-4 rounded-2xl shadow">

          <div className="text-sm text-gray-500">
            Incasso oggi
          </div>

          <div className="text-2xl font-bold text-green-600 mt-1">
            € {todayTotal}
          </div>

        </div>

      </div>

      {/* SHORTCUT */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <Link
          href="/dashboard/calendar"
          className="bg-pink-600 text-white p-4 rounded-2xl shadow text-center"
        >
          📅 Calendario
        </Link>

        <Link
          href="/dashboard/clients"
          className="bg-white p-4 rounded-2xl shadow text-center"
        >
          👤 Clienti
        </Link>

        <Link
          href="/dashboard/services"
          className="bg-white p-4 rounded-2xl shadow text-center"
        >
          💅 Servizi
        </Link>

        <Link
          href="/dashboard/incassi"
          className="bg-white p-4 rounded-2xl shadow text-center"
        >
          💰 Incassi
        </Link>

      </div>

      {/* OGGI */}
      <div className="bg-white p-4 rounded-2xl shadow">

        <div className="flex justify-between items-center mb-4">

          <h2 className="font-bold text-pink-600">
            Appuntamenti di oggi
          </h2>

          <Link
            href="/dashboard/calendar"
            className="text-xs text-pink-600"
          >
            Vai al calendario →
          </Link>

        </div>

        {todayAppointments.length === 0 && (
          <div className="text-sm text-gray-500">
            Nessun appuntamento oggi
          </div>
        )}

        <div className="space-y-3">

          {todayAppointments.map(app => (

            <div
              key={app.id}
              className="border rounded-xl p-3 flex justify-between items-center"
            >

              <div>

                <div className="font-bold">
                  {app.client?.nome}
                </div>

                <div className="text-xs text-gray-500">

                  🕒 {new Date(app.data).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}

                </div>

                <div className="text-xs text-gray-500 mt-1">

                  {(app.services || [])
                    .map(s => s?.nome)
                    .join(', ')}

                </div>

              </div>

              <div className="font-bold text-green-600">
                €
                {(app.services || []).reduce(
                  (acc, s) =>
                    acc + Number(s?.prezzo || 0),
                  0
                )}
              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  )
}