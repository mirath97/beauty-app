'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function RemindersPage() {
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    fetchAppointments()
  }, [])

  async function fetchAppointments() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dateStr = tomorrow.toISOString().split('T')[0]

    const { data } = await supabase
      .from('appointments')
      .select(`
        id,
        data,
        status,
        clients (nome, telefono),
        appointment_services (
          services (nome)
        )
      `)
      .gte('data', dateStr + 'T00:00:00')
      .lte('data', dateStr + 'T23:59:59')

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

  const text = `Ciao ${cliente.nome}

Ti ricordiamo il tuo appuntamento alle ${time}
Trattamento: ${servizi}

Rispondi SI per confermare
Rispondi NO per modificare

Beauty Lab Antonella`

  return encodeURIComponent(text)
}

  function sendReminder(app) {
    const cliente = app.clients

    if (!cliente?.telefono) {
      alert('Numero mancante')
      return
    }

    const msg = buildMessage(app)

    window.open(`https://wa.me/${cliente.telefono}?text=${msg}`, '_blank')
  }

  async function updateStatus(id, status) {
    await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)

    fetchAppointments()
  }

  return (
    <div className="space-y-6 p-4">

      <h1 className="text-3xl font-bold text-pink-700">
        Conferma appuntamenti
      </h1>

      <div className="space-y-3">

        {appointments.map(app => (
          <div
            key={app.id}
            className="p-4 bg-white rounded-2xl shadow border border-pink-100 space-y-2"
          >

            <div className="flex justify-between items-center">

              <div>
                <div className="font-semibold text-pink-700">
                  {app.clients?.nome}
                </div>

                <div className="text-sm text-gray-400">
                  {new Date(app.data).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <button
                onClick={() => sendReminder(app)}
                className="bg-green-500 text-white px-3 py-2 rounded-xl"
              >
                WhatsApp
              </button>

            </div>

            {/* STATUS */}
            <div className="flex gap-2">

              <button
                onClick={() => updateStatus(app.id, 'confirmed')}
                className={`px-3 py-1 rounded-xl ${
                  app.status === 'confirmed'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200'
                }`}
              >
                ✅ Confermato
              </button>

              <button
                onClick={() => updateStatus(app.id, 'cancelled')}
                className={`px-3 py-1 rounded-xl ${
                  app.status === 'cancelled'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200'
                }`}
              >
                ❌ Da ricontattare
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  )
}