'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabaseClient'

export default function AIPage() {
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = createSupabaseClient()

    const { data: apps } = await supabase.from('appointments').select('*')
    const { data: clients } = await supabase.from('clients').select('*')
    const { data: services } = await supabase.from('services').select('*')
    const { data: appServices } = await supabase.from('appointment_services').select('*')

    const enriched = apps.map(app => {
      const client = clients?.find(c => c.id === app.client_id)

      const rel = appServices?.filter(r => r.appointment_id === app.id)

      const serv = rel?.map(r =>
        services?.find(s => s.id === r.service_id)
      )

      return {
        ...app,
        client,
        services: serv
      }
    })

    setAppointments(enriched || [])
  }

  // 👑 CLIENTI VIP
  function getVIPClients() {
    const map = {}

    appointments.forEach(app => {
      const nome = app.client?.nome
      if (!nome) return

      map[nome] = (map[nome] || 0) + 1
    })

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }

  // ⚠️ CLIENTI DA RECUPERARE
  function getInactiveClients() {
    const lastVisit = {}

    appointments.forEach(app => {
      const nome = app.client?.nome
      const date = new Date(app.data)

      if (!lastVisit[nome] || date > lastVisit[nome]) {
        lastVisit[nome] = date
      }
    })

    const now = new Date()

    return Object.entries(lastVisit)
      .filter(([_, date]) => {
        const diff = (now - date) / (1000 * 60 * 60 * 24)
        return diff > 30
      })
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5)
  }

  // 🔥 SERVIZI TOP
  function getTopServices() {
    const map = {}

    appointments.forEach(app => {
      app.services?.forEach(s => {
        const nome = s?.nome
        if (!nome) return

        map[nome] = (map[nome] || 0) + 1
      })
    })

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }

  // 📲 WhatsApp
  function sendWhatsApp(nome, telefono) {
    if (!telefono) {
      alert('Numero non presente')
      return
    }

    let phone = telefono.replace(/\s+/g, '').replace('+', '')

    if (phone.startsWith('0')) {
      phone = '39' + phone.substring(1)
    }

    const text = `Ciao ${nome} 💅 è un po' che non vieni, ti aspettiamo! Abbiamo novità per te ✨`

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`)
  }

  // 🎯 OFFERTE
  function getOfferSuggestion(serviceName) {
    if (!serviceName) return 'Promo personalizzata 🎁'

    if (serviceName.toLowerCase().includes('unghie'))
      return 'Sconto manicure 💅'

    if (serviceName.toLowerCase().includes('capelli'))
      return 'Trattamento capelli ✨'

    return 'Offerta speciale 🎁'
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        AI Business 💅
      </h1>

      {/* 👑 VIP */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="font-bold mb-2">👑 Clienti VIP</div>

        {getVIPClients().map(([nome, count], i) => (
          <div key={i} className="text-sm">
            {i + 1}. {nome} ({count} visite)
          </div>
        ))}
      </div>

      {/* ⚠️ RECUPERO */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="font-bold mb-2">⚠️ Clienti da recuperare</div>

        {getInactiveClients().map(([nome, date], i) => {
          const client = appointments.find(a => a.client?.nome === nome)?.client

          return (
            <div
              key={i}
              className="text-sm flex flex-col gap-1 border-b py-2"
            >
              <div>
                {nome} - ultima visita {date.toLocaleDateString()}
              </div>

              <div className="text-xs text-gray-500">
                💡 {getOfferSuggestion('')}
              </div>

              <button
                onClick={() => sendWhatsApp(nome, client?.telefono)}
                className="bg-green-500 text-white px-2 py-1 rounded text-xs w-fit"
              >
                Scrivi su WhatsApp
              </button>
            </div>
          )
        })}
      </div>

      {/* 🔥 SERVIZI */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="font-bold mb-2">🔥 Servizi più richiesti</div>

        {getTopServices().map(([nome, count], i) => (
          <div key={i} className="text-sm">
            {i + 1}. {nome} ({count})
          </div>
        ))}
      </div>

    </div>
  )
}