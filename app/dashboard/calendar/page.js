'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function CalendarPage() {
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])

  const [showModal, setShowModal] = useState(false)

  const [selectedClient, setSelectedClient] = useState('')
  const [selectedServices, setSelectedServices] = useState([])
  const [date, setDate] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const supabase = getSupabase()

    const { data: apps } = await supabase.from('appointments').select('*')
    const { data: clientsData } = await supabase.from('clients').select('*')
    const { data: servicesData } = await supabase.from('services').select('*')
    const { data: appServices } = await supabase.from('appointment_services').select('*')

    setClients(clientsData || [])
    setServices(servicesData || [])

    const enriched = apps.map(app => {
      const client = clientsData?.find(c => c.id === app.client_id)

      const rel = appServices?.filter(r => r.appointment_id === app.id)

      const serv = rel?.map(r =>
        servicesData?.find(s => s.id === r.service_id)
      )

      return {
        ...app,
        client,
        services: serv
      }
    })

    enriched.sort((a, b) => new Date(a.data) - new Date(b.data))

    setAppointments(enriched || [])
  }

  // ➕ CREA APPUNTAMENTO
  async function createAppointment() {
    const supabase = createSupabaseClient()

    const { data: newApp } = await supabase
      .from('appointments')
      .insert({
        client_id: selectedClient,
        data: date
      })
      .select()
      .single()

    // collega servizi
    for (let s of selectedServices) {
      await supabase.from('appointment_services').insert({
        appointment_id: newApp.id,
        service_id: s
      })
    }

    setShowModal(false)
    setSelectedClient('')
    setSelectedServices([])
    setDate('')

    fetchAll()
  }

  // 📲 WhatsApp
  function sendWhatsApp(app) {
    let phone = app.client?.telefono || ''

    phone = phone.replace(/\s+/g, '').replace('+', '')

    if (phone.startsWith('0')) {
      phone = '39' + phone.substring(1)
    }

    const text = `Ciao ${app.client?.nome} 💅 ti aspettiamo!`

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`)
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Calendario 💅📅
      </h1>

      {/* ➕ NUOVO */}
      <button
        onClick={() => setShowModal(true)}
        className="bg-pink-600 text-white px-4 py-2 rounded-xl"
      >
        ➕ Nuovo appuntamento
      </button>

      {/* LISTA */}
      {appointments.map(app => (
        <div
          key={app.id}
          className="bg-gradient-to-r from-pink-500 to-pink-400 text-white p-4 rounded-xl shadow-md space-y-1"
        >
          <div className="font-semibold">{app.client?.nome}</div>

          <div className="text-xs">
            🕒 {new Date(app.data).toLocaleString()}
          </div>

          <div className="text-xs">
            {(app.services || []).map(s => s?.nome).join(', ')}
          </div>

          <div className="font-bold">
            € {(app.services || []).reduce(
              (acc, s) => acc + Number(s?.prezzo || 0),
              0
            )}
          </div>

          <button
            onClick={() => sendWhatsApp(app)}
            className="bg-green-500 px-2 py-1 rounded text-xs mt-2"
          >
            WhatsApp
          </button>
        </div>
      ))}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

          <div className="bg-white p-5 rounded-xl w-80 space-y-3">

            <h2 className="font-bold text-pink-600">
              Nuovo appuntamento
            </h2>

            {/* CLIENTE */}
            <select
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Seleziona cliente</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            {/* SERVIZI */}
            <div className="space-y-1">
              {services.map(s => (
                <label key={s.id} className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    value={s.id}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedServices([...selectedServices, s.id])
                      } else {
                        setSelectedServices(
                          selectedServices.filter(id => id !== s.id)
                        )
                      }
                    }}
                  />
                  {s.nome} (€{s.prezzo})
                </label>
              ))}
            </div>

            {/* DATA */}
            <input
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border p-2 rounded"
            />

            {/* BOTTONI */}
            <div className="flex justify-between mt-2">

              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500"
              >
                Annulla
              </button>

              <button
                onClick={createAppointment}
                className="bg-pink-600 text-white px-3 py-1 rounded"
              >
                Salva
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  )
}