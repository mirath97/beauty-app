'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CalendarPage() {
  const [appointments, setAppointments] = useState([])
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()))

  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentId, setCurrentId] = useState(null)

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])

  const [clientId, setClientId] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [selectedServices, setSelectedServices] = useState([])
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(60)

  useEffect(() => {
    fetchAll()
  }, [weekStart])

  function getStartOfWeek(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  function changeWeek(offset) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + offset * 7)
    setWeekStart(new Date(d))
  }

  function getWeekDays() {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }

  async function fetchAll() {
    const start = new Date(weekStart)
    start.setHours(0, 0, 0, 0)

    const end = new Date(weekStart)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    const { data: apps } = await supabase
      .from('appointments')
      .select(`
        id,
        data,
        durata,
        client_id,
        clients (nome, telefono),
        appointment_services (services (*))
      `)
      .gte('data', start.toISOString())
      .lte('data', end.toISOString())
      .order('data', { ascending: true })

    const { data: clientsData } = await supabase.from('clients').select('*')
    const { data: servicesData } = await supabase.from('services').select('*')

    setAppointments(apps || [])
    setClients(clientsData || [])
    setServices(servicesData || [])
  }

  function getAppointmentsForDay(day) {
    return appointments.filter(app => {
      const d = new Date(app.data)
      return d.toDateString() === day.toDateString()
    })
  }

  function getTotal(app) {
    return (app.appointment_services || []).reduce(
      (acc, s) => acc + Number(s.services?.prezzo || 0),
      0
    )
  }

  // 🔥 CONTROLLO CONFLITTI
  function hasConflict(newDate) {
    return appointments.some(app => {
      const existing = new Date(app.data)
      return existing.getTime() === newDate.getTime() && app.id !== currentId
    })
  }

  function openNew(day) {
    setEditMode(false)
    setCurrentId(null)
    setSelectedDate(day)
    setClientId('')
    setClientSearch('')
    setSelectedServices([])
    setTime('')
    setDuration(60)
    setOpen(true)
  }

  function openEdit(app) {
    setEditMode(true)
    setCurrentId(app.id)

    setSelectedDate(new Date(app.data))
    setClientId(app.client_id)
    setClientSearch(app.clients?.nome || '')

    setSelectedServices(app.appointment_services.map(s => s.services))
    setTime(new Date(app.data).toTimeString().slice(0, 5))
    setDuration(app.durata || 60)

    setOpen(true)
  }

  function toggleService(s) {
    let updated

    if (selectedServices.find(x => x.id === s.id)) {
      updated = selectedServices.filter(x => x.id !== s.id)
    } else {
      updated = [...selectedServices, s]
    }

    setSelectedServices(updated)

    // 🔥 DURATA AUTOMATICA (30 min per servizio)
    setDuration(updated.length * 30 || 30)
  }

  async function saveAppointment() {
    if (!clientId || !time) return alert('Compila tutto')

    const d = new Date(selectedDate)
    const [h, m] = time.split(':').map(Number)
    d.setHours(h)
    d.setMinutes(m)

    if (hasConflict(d)) {
      return alert('⚠️ Orario già occupato')
    }

    let appId = currentId

    if (editMode) {
      await supabase
        .from('appointments')
        .update({ data: d, client_id: clientId, durata: duration })
        .eq('id', currentId)

      await supabase
        .from('appointment_services')
        .delete()
        .eq('appointment_id', currentId)
    } else {
      const { data } = await supabase
        .from('appointments')
        .insert([{ data: d, client_id: clientId, durata: duration }])
        .select()
        .single()

      appId = data.id
    }

    for (const s of selectedServices) {
      await supabase.from('appointment_services').insert({
        appointment_id: appId,
        service_id: s.id
      })
    }

    setOpen(false)
    fetchAll()
  }

  function sendWhatsAppReminder(app) {
    const phone = app.clients?.telefono
    const nome = app.clients?.nome

    if (!phone) return

    const text = `Ciao ${nome} 💅 ti aspettiamo per il tuo appuntamento!`

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`)
  }

  const filteredClients = clients.filter(c =>
    c.nome.toLowerCase().includes(clientSearch.toLowerCase())
  )

  return (
    <div className="p-4 space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <button onClick={() => changeWeek(-1)}>←</button>
        <h1 className="text-xl font-bold text-pink-700">Calendario</h1>
        <button onClick={() => changeWeek(1)}>→</button>
      </div>

      {/* CALENDARIO */}
      <div className="grid grid-cols-7 gap-2">
        {getWeekDays().map((day, i) => {
          const dayApps = getAppointmentsForDay(day)

          return (
            <div
              key={i}
              onDoubleClick={() => openNew(day)}
              className="bg-gray-100 p-2 rounded flex flex-col min-h-[260px]"
            >

              <div className="flex justify-between">
                <div className="text-sm font-bold">
                  {day.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })}
                </div>

                <button onClick={() => openNew(day)}>➕</button>
              </div>

              <div className="flex-1 space-y-2 mt-2">

                {dayApps.map(app => {
                  const start = new Date(app.data)

                  return (
                    <div
                      key={app.id}
                      onClick={() => openEdit(app)}
                      className="bg-white p-2 rounded text-xs shadow cursor-pointer"
                    >
                      <div className="font-bold text-pink-700">
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      <div>{app.clients?.nome}</div>

                      <div>€ {getTotal(app)}</div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          sendWhatsAppReminder(app)
                        }}
                        className="mt-1 bg-green-500 text-white w-full text-xs rounded"
                      >
                        📲 WhatsApp
                      </button>
                    </div>
                  )
                })}

              </div>

            </div>
          )
        })}
      </div>

      {/* 🔥 MODAL */}
 {open && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

    <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-xl flex flex-col">

      {/* HEADER */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-bold text-lg text-pink-700">
          {editMode ? 'Modifica appuntamento' : 'Nuovo appuntamento'}
        </h2>

        <button onClick={() => setOpen(false)}>✖</button>
      </div>

      {/* CONTENUTO SCROLL */}
      <div className="p-4 space-y-4 overflow-y-auto">

        {/* CLIENTE */}
        <div>
          <div className="text-sm font-semibold mb-1">Cliente</div>

          <input
            placeholder="Scrivi nome cliente..."
            value={clientSearch}
            onChange={e => setClientSearch(e.target.value)}
            className="border p-2 w-full rounded-lg"
          />

          <div className="max-h-32 overflow-y-auto mt-2 border rounded-lg">
            {filteredClients.map(c => (
              <div
                key={c.id}
                onClick={() => {
                  setClientId(c.id)
                  setClientSearch(c.nome)
                }}
                className="p-2 hover:bg-pink-100 cursor-pointer text-sm"
              >
                {c.nome}
              </div>
            ))}
          </div>
        </div>

        {/* ORARIO */}
        <div>
          <div className="text-sm font-semibold mb-1">Orario</div>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="border p-2 w-full rounded-lg"
          />
        </div>

        {/* DURATA */}
        <div>
          <div className="text-sm font-semibold mb-1">Durata (min)</div>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="border p-2 w-full rounded-lg"
          />
        </div>

        {/* SERVIZI PER CATEGORIA */}
        <div>
          <div className="text-sm font-semibold mb-2">Servizi</div>

          {Object.entries(
            services.reduce((acc, s) => {
              const cat = s.categoria || 'Altro'
              if (!acc[cat]) acc[cat] = []
              acc[cat].push(s)
              return acc
            }, {})
          ).map(([cat, list]) => (
            <div key={cat} className="mb-3">

              <div className="font-bold text-xs text-gray-500 mb-1">
                {cat}
              </div>

              <div className="space-y-1">
                {list.map(s => {
                  const selected = selectedServices.find(x => x.id === s.id)

                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleService(s)}
                      className={`p-2 rounded-lg cursor-pointer text-sm flex justify-between ${
                        selected ? 'bg-pink-200' : 'bg-gray-100'
                      }`}
                    >
                      <span>{s.nome}</span>

                      <span className="text-xs text-gray-600">
                        €{s.prezzo} • {s.durata || 30}m
                      </span>
                    </div>
                  )
                })}
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* FOOTER */}
      <div className="p-4 border-t flex gap-2">

        <button
          onClick={saveAppointment}
          className="bg-pink-600 text-white w-full py-2 rounded-xl"
        >
          Salva
        </button>

        <button
          onClick={() => setOpen(false)}
          className="bg-gray-300 w-full py-2 rounded-xl"
        >
          Annulla
        </button>

      </div>

    </div>

  </div>
)}