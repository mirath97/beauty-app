'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function CalendarPage() {
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [selectedClient, setSelectedClient] = useState('')
  const [selectedServices, setSelectedServices] = useState([])
  const [date, setDate] = useState('')

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('day')

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

  function getWeekDays(date) {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }

  function getDuration(app) {
    return (app.services || []).reduce(
      (tot, s) => tot + Number(s?.durata || 30),
      0
    )
  }

  function getTotal(app) {
    return (app.services || []).reduce(
      (acc, s) => acc + Number(s?.prezzo || 0),
      0
    )
  }

  function sendWhatsApp(app) {
    let phone = app.client?.telefono || ''

    phone = phone.replace(/\s+/g, '').replace('+', '')

    if (phone.startsWith('0')) {
      phone = '39' + phone.substring(1)
    }

    const text = `Ciao ${app.client?.nome} 💅 ti aspettiamo!`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`)
  }

  const filteredAppointments = appointments.filter(app => {
    const d = new Date(app.data)
    return d.toDateString() === selectedDate.toDateString()
  })

  async function saveAppointment() {
    const supabase = getSupabase()

    let appId = editingId

    if (!editingId) {
      const { data } = await supabase
        .from('appointments')
        .insert({
          client_id: selectedClient,
          data: date
        })
        .select()
        .single()

      appId = data.id
    } else {
      await supabase
        .from('appointments')
        .update({ data: date })
        .eq('id', editingId)

      await supabase
        .from('appointment_services')
        .delete()
        .eq('appointment_id', editingId)
    }

    for (let s of selectedServices) {
      await supabase.from('appointment_services').insert({
        appointment_id: appId,
        service_id: s
      })
    }

    setShowModal(false)
    setEditingId(null)
    setSelectedClient('')
    setSelectedServices([])
    setDate('')

    fetchAll()
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Calendario 💅
      </h1>

      {/* TOGGLE */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('day')}
          className={`px-3 py-1 rounded ${viewMode === 'day' ? 'bg-pink-600 text-white' : 'bg-gray-200'}`}
        >
          Giorno
        </button>
        <button
          onClick={() => setViewMode('week')}
          className={`px-3 py-1 rounded ${viewMode === 'week' ? 'bg-pink-600 text-white' : 'bg-gray-200'}`}
        >
          Settimana
        </button>
      </div>

      {/* NAV GIORNO */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow">

        <button onClick={() =>
          setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))
        }>⬅</button>

        <div className="font-bold text-pink-600">
          {selectedDate.toLocaleDateString()}
        </div>

        <button onClick={() =>
          setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))
        }>➡</button>

      </div>

      {/* NUOVO */}
      <button
        onClick={() => setShowModal(true)}
        className="bg-pink-600 text-white px-4 py-2 rounded-xl shadow"
      >
        ➕ Nuovo appuntamento
      </button>

      {/* SETTIMANA */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {getWeekDays(selectedDate).map(day => (
            <div key={day} className="bg-white p-3 rounded-xl shadow">

              <div className="text-xs font-bold text-pink-600 mb-2">
                {day.toLocaleDateString()}
              </div>

              {appointments
                .filter(a => new Date(a.data).toDateString() === day.toDateString())
                .map(a => (
                  <div key={a.id} className="text-xs border-b py-1">
                    {new Date(a.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <br />
                    {a.client?.nome}
                  </div>
                ))}

            </div>
          ))}

        </div>
      )}

      {/* GIORNO */}
      {viewMode === 'day' &&
        filteredAppointments.map(app => (
          <div
            key={app.id}
            className="bg-gradient-to-r from-pink-500 to-pink-400 text-white p-4 rounded-xl shadow space-y-1"
          >

            <div className="flex justify-between">
              <div className="font-bold text-lg">
                {app.client?.nome}
              </div>

              <div>€ {getTotal(app)}</div>
            </div>

            <div className="text-sm">
              🕒 {new Date(app.data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            <div className="text-xs">
              ⏱ {getDuration(app)} min
            </div>

            <div className="text-xs">
              {(app.services || []).map(s => s?.nome).join(', ')}
            </div>

            <div className="flex gap-2 mt-2">

              <button
                onClick={() => sendWhatsApp(app)}
                className="bg-green-500 px-2 py-1 rounded text-xs"
              >
                WhatsApp
              </button>

              <button
                onClick={() => {
                  setEditingId(app.id)
                  setSelectedClient(app.client?.id)
                  setSelectedServices(app.services.map(s => s.id))
                  setDate(app.data)
                  setShowModal(true)
                }}
                className="bg-blue-500 px-2 py-1 rounded text-xs"
              >
                Modifica
              </button>

            </div>

          </div>
        ))}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

          <div className="bg-white p-5 rounded-xl w-80 space-y-3">

            <h2 className="font-bold text-pink-600">
              {editingId ? 'Modifica' : 'Nuovo'} appuntamento
            </h2>

            <select
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Cliente</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <div className="max-h-32 overflow-y-auto">
              {services.map(s => (
                <label key={s.id} className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(s.id)}
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

            <input
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border p-2 rounded"
            />

            <div className="flex justify-between">

              <button onClick={() => setShowModal(false)}>
                Annulla
              </button>

              <button
                onClick={saveAppointment}
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