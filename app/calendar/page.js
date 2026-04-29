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
        appointment_services (
          services (*)
        )
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
    return app.appointment_services.reduce(
      (acc, s) => acc + (s.services.prezzo || 0),
      0
    )
  }

  function getDailyTotal(dayApps) {
    return dayApps.reduce((tot, app) => tot + getTotal(app), 0)
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
    if (selectedServices.find(x => x.id === s.id)) {
      setSelectedServices(selectedServices.filter(x => x.id !== s.id))
    } else {
      setSelectedServices([...selectedServices, s])
    }
  }

  async function saveAppointment() {
    if (!clientId || !time) return alert('Compila tutto')

    const d = new Date(selectedDate)
    const [h, m] = time.split(':').map(Number)
    d.setHours(h)
    d.setMinutes(m)

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
    if (!phone) return alert('Numero mancante')

    const date = new Date(app.data)

    const text = `Ciao ${app.clients?.nome} 💅
Appuntamento il ${date.toLocaleDateString('it-IT')} alle ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })}`

    window.open(`https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(text)}`)
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

      {/* GRID */}
      <div className="grid grid-cols-7 gap-2">

        {getWeekDays().map((day, i) => {
          const dayApps = getAppointmentsForDay(day)
          const total = getDailyTotal(dayApps)

          return (
            <div key={i} className="bg-gray-100 p-2 rounded flex flex-col min-h-[260px]">

              <div className="flex justify-between">
                <div className="text-sm font-bold">
                  {day.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })}
                </div>

                <button onClick={() => openNew(day)}>➕</button>
              </div>

              <div className="text-green-600 text-xs mb-1">
                € {total}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">

                {dayApps.map(app => {
                  const start = new Date(app.data)

                  return (
                    <div
                      key={app.id}
                      onClick={() => openEdit(app)}
                      className="bg-white p-3 rounded-xl text-xs shadow cursor-pointer border"
                    >
                      <div className="flex justify-between">
                        <div className="font-bold text-pink-700">
                          {start.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        <div className="text-gray-400">
                          {app.durata} min
                        </div>
                      </div>

                      <div className="font-semibold">
                        {app.clients?.nome}
                      </div>

                      <div className="text-gray-500 text-[11px]">
                        {app.appointment_services.map(s => s.services.nome).join(', ')}
                      </div>

                      <div className="text-green-600 font-bold">
                        € {getTotal(app)}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          sendWhatsAppReminder(app)
                        }}
                        className="mt-2 bg-green-500 text-white w-full text-xs rounded py-1"
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

      {/* MODALE */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-4 rounded-xl w-[90%] max-w-md space-y-3">

            <input
              placeholder="Cerca cliente..."
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
              className="w-full border p-2 rounded"
            />

            <div className="max-h-32 overflow-y-auto">
              {filteredClients.map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    setClientId(c.id)
                    setClientSearch(c.nome)
                  }}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                >
                  {c.nome}
                </div>
              ))}
            </div>

            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full border p-2 rounded"
            />

            <input
              type="number"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full border p-2 rounded"
            />

            <button
              onClick={saveAppointment}
              className="w-full bg-pink-600 text-white p-2 rounded"
            >
              Salva
            </button>

            <button
              onClick={() => setOpen(false)}
              className="w-full bg-gray-300 p-2 rounded"
            >
              Annulla
            </button>

          </div>

        </div>
      )}

    </div>
  )
}