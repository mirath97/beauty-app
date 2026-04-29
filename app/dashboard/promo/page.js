'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PromoPage() {
  const [clients, setClients] = useState([])
  const [vip, setVip] = useState([])
  const [inactive, setInactive] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('appointments')
      .select(`
        data,
        clients (id, nome, telefono),
        appointment_services (
          services (prezzo)
        )
      `)

    const map = {}

    ;(data || []).forEach(app => {
      const c = app.clients
      if (!c) return

      const total = app.appointment_services.reduce(
        (acc, s) => acc + (s.services.prezzo || 0),
        0
      )

      map[c.id] = map[c.id] || {
        nome: c.nome,
        telefono: c.telefono,
        totale: 0,
        lastVisit: new Date(app.data)
      }

      map[c.id].totale += total

      if (new Date(app.data) > map[c.id].lastVisit) {
        map[c.id].lastVisit = new Date(app.data)
      }
    })

    const all = Object.values(map)

    // 👑 VIP
    const vipClients = all
      .sort((a, b) => b.totale - a.totale)
      .slice(0, 5)

    // 😴 INATTIVI (30 giorni)
    const inactiveClients = all.filter(c => {
      const days = (new Date() - c.lastVisit) / (1000 * 60 * 60 * 24)
      return days > 30
    })

    setClients(all)
    setVip(vipClients)
    setInactive(inactiveClients)
  }

  function sendWhatsApp(cliente, tipo) {
    if (!cliente.telefono) return

    let text = ''

    if (tipo === 'vip') {
      text = `Ciao ${cliente.nome},

abbiamo una promo esclusiva pensata per te 💅
Ti aspettiamo da Beauty Lab Antonella 💖`
    }

    if (tipo === 'inactive') {
      text = `Ciao ${cliente.nome},

ci manchi! 💕
Abbiamo una promo speciale per farti tornare.

Beauty Lab Antonella`
    }

    const msg = encodeURIComponent(text)
    const phone = cliente.telefono.replace(/\D/g, '')

    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold text-pink-700">
        Promo intelligenti
      </h1>

      {/* VIP */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-3">
        <h2 className="text-pink-700 font-semibold">
          👑 Clienti VIP
        </h2>

        {vip.map((c, i) => (
          <div key={i} className="flex justify-between items-center border-b pb-2">
            <span>{c.nome}</span>
            <button
              onClick={() => sendWhatsApp(c, 'vip')}
              className="bg-green-500 text-white px-3 py-1 rounded-xl"
            >
              WhatsApp
            </button>
          </div>
        ))}
      </div>

      {/* INATTIVI */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-3">
        <h2 className="text-pink-700 font-semibold">
          😴 Clienti inattivi
        </h2>

        {inactive.length === 0 && (
          <div className="text-gray-400">Nessuno</div>
        )}

        {inactive.map((c, i) => (
          <div key={i} className="flex justify-between items-center border-b pb-2">
            <span>{c.nome}</span>
            <button
              onClick={() => sendWhatsApp(c, 'inactive')}
              className="bg-green-500 text-white px-3 py-1 rounded-xl"
            >
              WhatsApp
            </button>
          </div>
        ))}
      </div>

    </div>
  )
}