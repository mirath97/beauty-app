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

  // 🔥 CALCOLO TOTALE APPUNTAMENTO (UGUALE AL CALENDARIO)
  function getAppTotal(app) {
    return (app.appointment_services || []).reduce((acc, s) => {
      return acc + Number(s.services?.prezzo || 0)
    }, 0)
  }

  // 💰 INCASSO SETTIMANA
  function getWeeklyTotal() {
    const now = new Date()
    const start = new Date()
    start.setDate(now.getDate() - 7)

    return appointments
      .filter(a => new Date(a.data) >= start)
      .reduce((tot, app) => tot + getAppTotal(app), 0)
  }

  // 👑 CLIENTI VIP (basati su ID, non nome)
  function getVipClients() {
    const map = {}

    appointments.forEach(app => {
      const id = app.client_id
      if (!id) return

      if (!map[id]) {
        map[id] = {
          nome: app.clients?.nome,
          total: 0
        }
      }

      map[id].total += 1
    })

    return Object.values(map).sort((a, b) => b.total - a.total)
  }

  // 💰 SERVIZI PIÙ REDDITIZI
  function getTopServices() {
    const map = {}

    appointments.forEach(app => {
      app.appointment_services?.forEach(s => {
        const name = s.services?.nome
        const prezzo = Number(s.services?.prezzo || 0)

        if (!name) return

        if (!map[name]) {
          map[name] = 0
        }

        map[name] += prezzo
      })
    })

    return Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
  }

  // 🔥 CLIENTI INATTIVI
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

      {/* 💰 INCASSO */}
      <div className="bg-green-100 p-4 rounded-xl">
        <div className="font-bold">💰 Incasso settimana</div>
        <div className="text-2xl font-bold">
          € {getWeeklyTotal()}
        </div>
      </div>

      {/* 👑 CLIENTI VIP */}
      <div className="bg-purple-100 p-4 rounded-xl">
        <div className="font-bold mb-2">
          👑 Top 3 Clienti VIP
        </div>

        {getVipClients().slice(0, 3).map((c, i) => (
          <div key={i} className="flex justify-between bg-white p-2 rounded mb-2">
            <span>{c.nome}</span>
            <span>{c.total} visite</span>
          </div>
        ))}
      </div>

      {/* 💰 SERVIZI TOP */}
      <div className="bg-blue-100 p-4 rounded-xl">
        <div className="font-bold mb-2">
          💰 Top 3 Servizi più redditizi
        </div>

        {getTopServices().slice(0, 3).map((s, i) => (
          <div key={i} className="flex justify-between bg-white p-2 rounded mb-2">
            <span>{s.name}</span>
            <span>€ {s.total}</span>
          </div>
        ))}
      </div>

      {/* ⚠️ CLIENTI DA RECUPERARE */}
      <div className="bg-red-100 p-4 rounded-xl">
        <div className="font-bold mb-2">
          ⚠️ Clienti da recuperare
        </div>

        {getInactiveClients().slice(0, 5).map((c, i) => (
          <div key={i} className="flex justify-between items-center bg-white p-2 rounded mb-2">
            <div>
              <div className="font-semibold">{c.clients?.nome}</div>
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

    </div>
  )
}