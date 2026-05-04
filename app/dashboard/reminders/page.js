'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabaseClient'

export default function RemindersPage() {
  const [appointments, setAppointments] = useState([])
  const [filter, setFilter] = useState('tomorrow')

  useEffect(() => {
    fetchAppointments()
  }, [filter])

  async function fetchAppointments() {
    const baseDate = new Date()

    if (filter === 'tomorrow') {
      baseDate.setDate(baseDate.getDate() + 1)
    }

    const dateStr = baseDate.toISOString().split('T')[0]

    const { data } = await supabase
      .from('appointments')
      .select(`
        id,
        data,
        reminder_sent,
        clients (nome, telefono),
        appointment_services (
          services (nome)
        )
      `)
      .gte('data', dateStr + 'T00:00:00')
      .lte('data', dateStr + 'T23:59:59')
      .order('data')

    setAppointments(data || [])
  }

  function buildMessage(app) {
    const cliente = app.clients

    const time = new Date(app.data).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })

    const servizi = app.appointment_services
      ?.map(s => s.services.nome)
      .join(', ')

    const text = `Ciao ${cliente.nome},

ti ricordiamo il tuo appuntamento alle ${time}.
Trattamento: ${servizi}

Rispondi SI per confermare
Rispondi NO per modificare

Beauty Lab Antonella`

    return encodeURIComponent(text)
  }

  async function sendReminder(app) {
    const cliente = app.clients

    if (!cliente?.telefono) {
      alert('Numero mancante')
      return
    }

    const phone = cliente.telefono.replace(/\D/g, '')

    const msg = buildMessage(app)

    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')

    // segna come inviato
    await supabase
      .from('appointments')
      .update({ reminder_sent: true })
      .eq('id', app.id)

    fetchAppointments()
  }

  async function sendAll() {
    for (const app of appointments) {
      if (!app.reminder_sent && app.clients?.telefono) {
        await sendReminder(app)
      }
    }
  }

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold text-pink-700">
        Reminder WhatsApp
      </h1>

      {/* FILTRI */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('today')}
          className={`px-4 py-2 rounded-xl ${
            filter === 'today'
              ? 'bg-pink-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          Oggi
        </button>

        <button
          onClick={() => setFilter('tomorrow')}
          className={`px-4 py-2 rounded-xl ${
            filter === 'tomorrow'
              ? 'bg-pink-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          Domani
        </button>
      </div>

      {/* LISTA */}
      <div className="space-y-3">

        {appointments.length === 0 && (
          <div className="text-gray-400">
            Nessun appuntamento
          </div>
        )}

        {appointments.map(app => {
          const time = new Date(app.data).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })

          const servizi = app.appointment_services
            ?.map(s => s.services.nome)
            .join(', ')

          return (
            <div
              key={app.id}
              className={`p-4 rounded-2xl shadow flex justify-between items-center ${
                app.reminder_sent
                  ? 'bg-green-50'
                  : 'bg-white border border-pink-100'
              }`}
            >

              <div>
                <div className="font-semibold text-pink-700">
                  {app.clients?.nome}
                </div>

                <div className="text-sm text-gray-400">
                  {time}
                </div>

                <div className="text-xs text-pink-500">
                  {servizi}
                </div>
              </div>

              {app.reminder_sent ? (
                <span className="text-green-600 text-sm">
                  Inviato
                </span>
              ) : (
                <button
                  onClick={() => sendReminder(app)}
                  className="bg-green-500 text-white px-3 py-2 rounded-xl"
                >
                  WhatsApp
                </button>
              )}

            </div>
          )
        })}

      </div>

      {/* INVIO MASSIVO */}
      {appointments.some(a => !a.reminder_sent) && (
        <button
          onClick={sendAll}
          className="w-full p-4 bg-pink-600 text-white rounded-2xl"
        >
          📲 Invia tutti i reminder
        </button>
      )}

    </div>
  )
}