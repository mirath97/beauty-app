'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AIPage() {
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: apps } = await supabase
      .from('appointments')
      .select(`
        *,
        clients (nome, telefono),
        appointment_services (services (*))
      `)

    const { data: clientsData } = await supabase.from('clients').select('*')

    setAppointments(apps || [])
    setClients(clientsData || [])
  }
  
  {/* ================= AI EXTRA (SERVIZI + VIP) ================= */}

{(() => {

  function getTopServices() {
    const count = {}

    appointments.forEach(app => {
      app.appointment_services?.forEach(s => {
        const name = s.services?.nome
        if (!name) return
        count[name] = (count[name] || 0) + 1
      })
    })

    return Object.entries(count)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
  }

  function getVipClients() {
    const count = {}

    appointments.forEach(app => {
      const name = app.clients?.nome
      if (!name) return
      count[name] = (count[name] || 0) + 1
    })

    return Object.entries(count)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
  }

  return (
    <div className="space-y-4">

      {/* 💅 SERVIZI TOP */}
      <div className="bg-blue-100 p-4 rounded-xl">
        <div className="font-bold mb-2">
          💅 Servizi più richiesti
        </div>

        {getTopServices().slice(0, 5).map((s, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{s.name}</span>
            <span>{s.total}x</span>
          </div>
        ))}
      </div>

      {/* 👑 CLIENTI VIP */}
      <div className="bg-purple-100 p-4 rounded-xl">
        <div className="font-bold mb-2">
          👑 Clienti VIP
        </div>

        {getVipClients().slice(0, 5).map((c, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{c.name}</span>
            <span>{c.total} visite</span>
          </div>
        ))}
      </div>

    </div>
  )

})()}
  
  // 💰 incasso settimana
  function getWeeklyTotal() {
    const now = new Date()
    const start = new Date()
    start.setDate(now.getDate() - 7)

    return appointments
      .filter(a => new Date(a.data) >= start)
      .reduce((tot, a) => {
        return (
          tot +
          a.appointment_services.reduce(
            (acc, s) => acc + (s.services.prezzo || 0),
            0
          )
        )
      }, 0)
  }

  // 🔥 clienti inattivi
  function getInactiveClients() {
    const map = {}

    appointments.forEach(app => {
      const id = app.client_id
      const date = new Date(app.data)

      if (!map[id] || new Date(map[id].data) < date) {
        map[id] = app
      }
    })

    const now = new Date()

    return Object.values(map)
      .map(app => {
        const diff = Math.floor((now - new Date(app.data)) / (1000 * 60 * 60 * 24))
        return { ...app, diff }
      })
      .filter(c => c.diff >= 30)
      .sort((a, b) => b.diff - a.diff)
  }

  function sendWhatsApp(client) {
    const phone = client.clients?.telefono
    if (!phone) return

    const text = `Ciao ${client.clients?.nome} 💅
Ti aspettiamo per il prossimo appuntamento!`

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`)
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        🤖 Centro Controllo Business
      </h1>

      {/* 💰 PERFORMANCE */}
      <div className="bg-green-100 p-4 rounded-xl">
        <div className="font-bold">💰 Incasso settimana</div>
        <div className="text-2xl font-bold">
          € {getWeeklyTotal()}
        </div>
      </div>

      {/* ⚠️ CLIENTI PERSI */}
      <div className="bg-red-100 p-4 rounded-xl">
        <div className="font-bold mb-2">
          ⚠️ Clienti da recuperare
        </div>

        {getInactiveClients().slice(0, 5).map((c, i) => (
          <div key={i} className="flex justify-between items-center bg-white p-2 rounded mb-2">

            <div>
              <div className="font-semibold">
                {c.clients?.nome}
              </div>
              <div className="text-xs text-gray-500">
                {c.diff} giorni
              </div>
            </div>

            <button
              onClick={() => sendWhatsApp(c)}
              className="bg-green-500 text-white px-2 py-1 rounded text-xs"
            >
              📲 Scrivi
            </button>

          </div>
        ))}

      </div>

      {/* 🚀 AZIONI */}
      <div className="bg-yellow-100 p-4 rounded-xl">
        <div className="font-bold mb-2">
          🚀 Azioni consigliate
        </div>

        <div className="text-sm">
          • Contatta clienti inattivi  
          <br />
          • Riempi giorni vuoti  
          <br />
          • Spingi servizi più richiesti  
        </div>
      </div>

    </div>
  )
}