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

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('day')

  const [time, setTime] = useState('')

  // 🔍 ricerca cliente
  const [clientSearch, setClientSearch] = useState('')
  const [filteredClients, setFilteredClients] = useState([])

  // 🚫 nuovo stato conflitto
  const [conflictMessage, setConflictMessage] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    const results = clients.filter(c =>
      c.nome?.toLowerCase().includes(clientSearch.toLowerCase())
    )

    setFilteredClients(results)
  }, [clientSearch, clients])

  async function fetchAll() {
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
  }

  // 📅 settimana
  function getWeekDays(date) {
    const start = new Date(date)

    start.setDate(
      date.getDate() - date.getDay()
    )

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start)

      d.setDate(start.getDate() + i)

      return d
    })
  }

  // ⏱ durata
  function getDuration(app) {
    return (app.services || []).reduce(
      (tot, s) => tot + Number(s?.durata || 30),
      0
    )
  }

  // 💰 totale
  function getTotal(app) {
    return (app.services || []).reduce(
      (acc, s) => acc + Number(s?.prezzo || 0),
      0
    )
  }

  // 📲 whatsapp
  function sendWhatsApp(app) {
    let phone = app.client?.telefono || ''

    phone = phone
      .replace(/\s+/g, '')
      .replace('+', '')

    if (phone.startsWith('0')) {
      phone = '39' + phone.substring(1)
    }

    const text =
      `Ciao ${app.client?.nome} 💅 ti aspettiamo!`

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    )
  }

  // 🚫 controllo sovrapposizioni
  function hasConflict(startDate, totalDuration) {
    const newStart = new Date(startDate)

    const newEnd = new Date(startDate)
    newEnd.setMinutes(
      newEnd.getMinutes() + totalDuration
    )

    const sameDayAppointments =
      appointments.filter(app => {
        const appDate = new Date(app.data)

        return (
          appDate.toDateString() ===
          newStart.toDateString()
        )
      })

    for (const app of sameDayAppointments) {
      // ignora appuntamento corrente in modifica
      if (editingId && app.id === editingId) {
        continue
      }

      const existingStart = new Date(app.data)

      const existingEnd = new Date(app.data)

      const duration = getDuration(app)

      existingEnd.setMinutes(
        existingEnd.getMinutes() + duration
      )

      const overlap =
        newStart < existingEnd &&
        newEnd > existingStart

      if (overlap) {
        return {
          conflict: true,
          message:
            `Orario occupato (${existingStart.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })})`
        }
      }
    }

    return {
      conflict: false,
      message: ''
    }
  }

  // 📅 filtro giorno
  const filteredAppointments =
    appointments.filter(app => {
      const d = new Date(app.data)

      return (
        d.toDateString() ===
        selectedDate.toDateString()
      )
    })

  // 💾 salva appuntamento
  async function saveAppointment() {
    if (!selectedClient || !time) {
      alert('Inserisci cliente e orario')
      return
    }

    const supabase = getSupabase()

    let appId = editingId

    const fullDate = new Date(selectedDate)

    const [hours, minutes] = time.split(':')

    fullDate.setHours(Number(hours || 0))
    fullDate.setMinutes(Number(minutes || 0))
    fullDate.setSeconds(0)

    // ⏱ durata nuova prenotazione
    const totalDuration =
      selectedServices.reduce((tot, id) => {
        const s = services.find(x => x.id === id)

        return tot + Number(s?.durata || 30)
      }, 0)

    // 🚫 CHECK CONFLITTO
    const conflict = hasConflict(
      fullDate,
      totalDuration
    )

    if (conflict.conflict) {
      setConflictMessage(conflict.message)
      return
    }

    setConflictMessage('')

    // ➕ nuovo
    if (!editingId) {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          client_id: Number(selectedClient),
          data: fullDate.toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error(error)
        alert(error.message)
        return
      }

      appId = data.id
    }

    // ✏ modifica
    else {
      const { error } = await supabase
        .from('appointments')
        .update({
          client_id: Number(selectedClient),
          data: fullDate.toISOString()
        })
        .eq('id', editingId)

      if (error) {
        console.error(error)
        alert(error.message)
        return
      }

      await supabase
        .from('appointment_services')
        .delete()
        .eq('appointment_id', editingId)
    }

    // 💅 servizi
    for (let s of selectedServices) {
      await supabase
        .from('appointment_services')
        .insert({
          appointment_id: appId,
          service_id: s
        })
    }

    // reset
    setShowModal(false)

    setEditingId(null)

    setSelectedClient('')
    setSelectedServices([])

    setClientSearch('')
    setTime('')

    setConflictMessage('')

    fetchAll()
  }

  // 🗑 elimina appuntamento
  async function deleteAppointment(id) {
    const confirmDelete = confirm(
      'Eliminare questo appuntamento?'
    )

    if (!confirmDelete) return

    const supabase = getSupabase()

    await supabase
      .from('appointment_services')
      .delete()
      .eq('appointment_id', id)

    await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    fetchAll()
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Calendario 💅
      </h1>

      {/* VIEW */}
      <div className="flex gap-2">

        <button
          onClick={() => setViewMode('day')}
          className={`px-3 py-1 rounded ${
            viewMode === 'day'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-200'
          }`}
        >
          Giorno
        </button>

        <button
          onClick={() => setViewMode('week')}
          className={`px-3 py-1 rounded ${
            viewMode === 'week'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-200'
          }`}
        >
          Settimana
        </button>

      </div>

      {/* NAV */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow">

        <button
          onClick={() =>
            setSelectedDate(
              new Date(
                selectedDate.setDate(
                  selectedDate.getDate() - 1
                )
              )
            )
          }
        >
          ⬅
        </button>

        <div className="font-bold text-pink-600">
          {selectedDate.toLocaleDateString()}
        </div>

        <button
          onClick={() =>
            setSelectedDate(
              new Date(
                selectedDate.setDate(
                  selectedDate.getDate() + 1
                )
              )
            )
          }
        >
          ➡
        </button>

      </div>

      {/* NUOVO */}
      <button
        onClick={() => {
          setEditingId(null)
          setSelectedClient('')
          setSelectedServices([])
          setClientSearch('')
          setTime('')
          setConflictMessage('')
          setShowModal(true)
        }}
        className="bg-pink-600 text-white px-4 py-2 rounded-xl shadow"
      >
        ➕ Nuovo appuntamento
      </button>

      {/* SETTIMANA */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {getWeekDays(selectedDate).map(day => (

            <div
              key={day.toISOString()}
              className="bg-white p-3 rounded-xl shadow"
            >

              <div className="text-xs font-bold text-pink-600 mb-2">
                {day.toLocaleDateString()}
              </div>

              {appointments
                .filter(a =>
                  new Date(a.data).toDateString() ===
                  day.toDateString()
                )
                .map(a => (

                  <div
                    key={a.id}
                    className="text-xs border-b py-1"
                  >

                    {new Date(a.data).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}

                    <br />

                    {a.client?.nome}

                  </div>

                ))}

            </div>

          ))}

        </div>
      )}

      {/* GIORNO */}
      {viewMode === 'day' && (
        <div className="space-y-3">

          {filteredAppointments.map(app => (

            <div
              key={app.id}
              className="bg-gradient-to-r from-pink-500 to-pink-400 text-white p-4 rounded-xl shadow"
            >

              <div className="flex justify-between">

                <div className="font-bold text-lg">
                  {app.client?.nome}
                </div>

                <div className="font-bold">
                  € {getTotal(app)}
                </div>

              </div>

              <div className="text-sm mt-1">
                🕒 {new Date(app.data).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              <div className="text-xs mt-1">
                ⏱ {getDuration(app)} min
              </div>

              <div className="text-xs mt-1">
                {(app.services || [])
                  .map(s => s?.nome)
                  .join(', ')}
              </div>

              {/* BOTTONI */}
              <div className="flex gap-2 mt-3">

                <button
                  onClick={() => sendWhatsApp(app)}
                  className="bg-green-500 px-2 py-1 rounded text-xs"
                >
                  WhatsApp
                </button>

                <button
                  onClick={() => {
                    setEditingId(app.id)

                    setSelectedClient(
                      app.client?.id || ''
                    )

                    setClientSearch(
                      app.client?.nome || ''
                    )

                    setSelectedServices(
                      app.services.map(s => s.id)
                    )

                    setTime(
                      new Date(app.data)
                        .toTimeString()
                        .slice(0, 5)
                    )

                    setConflictMessage('')

                    setShowModal(true)
                  }}
                  className="bg-blue-500 px-2 py-1 rounded text-xs"
                >
                  Modifica
                </button>

                <button
                  onClick={() =>
                    deleteAppointment(app.id)
                  }
                  className="bg-red-500 px-2 py-1 rounded text-xs"
                >
                  Elimina
                </button>

              </div>

            </div>

          ))}

        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-[340px] rounded-2xl shadow-xl p-5 space-y-4">

            <h2 className="text-lg font-bold text-pink-600">

              {editingId
                ? 'Modifica appuntamento'
                : 'Nuovo appuntamento'}

            </h2>

            {/* DATA */}
            <div className="bg-pink-50 p-2 rounded text-center text-sm">
              📅 {selectedDate.toLocaleDateString()}
            </div>

            {/* ORA */}
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full border p-2 rounded"
            />

            {/* 🚫 ERRORE */}
            {conflictMessage && (
              <div className="bg-red-100 text-red-600 text-sm p-2 rounded">
                🚫 {conflictMessage}
              </div>
            )}

            {/* CLIENTE */}
            <div className="space-y-2">

              <input
                placeholder="Cerca cliente..."
                value={clientSearch}
                onChange={e =>
                  setClientSearch(e.target.value)
                }
                className="w-full border p-2 rounded"
              />

              <div className="max-h-32 overflow-y-auto border rounded">

                {filteredClients.map(c => (

                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedClient(c.id)
                      setClientSearch(c.nome)
                    }}
                    className="p-2 hover:bg-pink-100 cursor-pointer text-sm border-b"
                  >
                    {c.nome}
                  </div>

                ))}

              </div>

            </div>

            {/* SERVIZI */}
            <div className="max-h-40 overflow-y-auto border rounded p-2">

              {services.map(s => (

                <label
                  key={s.id}
                  className="flex justify-between text-sm py-1"
                >

                  <div className="flex gap-2">

                    <input
                      type="checkbox"
                      checked={selectedServices.includes(s.id)}
                      onChange={e => {

                        if (e.target.checked) {
                          setSelectedServices([
                            ...selectedServices,
                            s.id
                          ])
                        }

                        else {
                          setSelectedServices(
                            selectedServices.filter(
                              id => id !== s.id
                            )
                          )
                        }

                      }}
                    />

                    {s.nome}

                  </div>

                  <span>
                    €{s.prezzo}
                  </span>

                </label>

              ))}

            </div>

            {/* BUTTONS */}
            <div className="flex justify-between">

              <button
                onClick={() => setShowModal(false)}
              >
                Annulla
              </button>

              <button
                onClick={saveAppointment}
                className="bg-pink-600 text-white px-4 py-2 rounded-xl"
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