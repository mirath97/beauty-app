'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PromoPage() {
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

    const vipClients = all
      .sort((a, b) => b.totale - a.totale)
      .slice(0, 5)

    const inactiveClients = all.filter(c => {
      const days = (new Date() - c.lastVisit) / (1000 * 60 * 60 * 24)
      return days > 30
    })

    setVip(vipClients)
    setInactive(inactiveClients)
  }

  function buildMessage(cliente, tipo) {
    if (tipo === 'vip') {
      return encodeURIComponent(
`Ciao ${cliente.nome},

abbiamo una promo esclusiva pensata per te 💅✨
Prenota ora il tuo prossimo trattamento 💖

Beauty Lab Antonella`
      )
    }

    if (tipo === 'inactive') {
      return encodeURIComponent(
`Ciao ${cliente.nome},

ci manchi 💕
Abbiamo una promo speciale per farti tornare ✨

Scrivici per prenotare 💅
Beauty Lab Antonella`
      )
    }
  }

  function sendOne(cliente, tipo) {
    if (!cliente.telefono) return

    const phone = cliente.telefono.replace(/\D/g, '')
    const msg = buildMessage(cliente, tipo)

    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  function sendAll(list, tipo) {
    list.forEach(cliente => {
      if (!cliente.telefono) return

      const phone = cliente.telefono.replace(/\D/g, '')
      const msg = buildMessage(cliente, tipo)

      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
    })
  }

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold text-pink-700">
        Campagne automatiche
      </h1>

      {/* VIP */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-3">

        <div className="flex justify-between items-center">
          <h2 className="text-pink-700 font-semibold">
            👑 Clienti VIP
          </h2>

          <button
            onClick={() => sendAll(vip, 'vip')}
            className="bg-pink-600 text-white px-3 py-2 rounded-xl"
          >
            Invia a tutti
          </button>
        </div>

        {vip.map((c, i) => (
          <div key={i} className="flex justify-between items-center border-b pb-2">
            <span>{c.nome}</span>
            <button
              onClick={() => sendOne(c, 'vip')}
              className="bg-green-500 text-white px-3 py-1 rounded-xl"
            >
              WhatsApp
            </button>
          </div>
        ))}

      </div>

      {/* INATTIVI */}
      <div className="bg-white p-6 rounded-2xl shadow space-y-3">

        <div className="flex justify-between items-center">
          <h2 className="text-pink-700 font-semibold">
            😴 Clienti inattivi
          </h2>

          <button
            onClick={() => sendAll(inactive, 'inactive')}
            className="bg-pink-600 text-white px-3 py-2 rounded-xl"
          >
            Invia a tutti
          </button>
        </div>

        {inactive.length === 0 && (
          <div className="text-gray-400">Nessuno</div>
        )}

        {inactive.map((c, i) => (
          <div key={i} className="flex justify-between items-center border-b pb-2">
            <span>{c.nome}</span>
            <button
              onClick={() => sendOne(c, 'inactive')}
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