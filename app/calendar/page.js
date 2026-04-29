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
  const [selectedServices, setSelectedServices] = useState([])
  const [time, setTime] = useState('')

  useEffect(() => {
    fetchAll()
  }, [weekStart])

  function getStartOfWeek(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
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
    const end = new Date(weekStart)
    end.setDate(end.getDate() + 7)

    const { data: apps } = await supabase
      .from('appointments')
      .select(`
        id,
        data,
        client_id,
        clients (nome),
        appointment_services (
          services (*)
        )
      `)
      .gte('data', start.toISOString())
      .lte('data', end.toISOString())
      .order('data')

    const { data: clientsData } = await supabase.from('clients').select('*')
    const { data: servicesData } = await supabase.from('services').select('*')

    setAppointments(apps || [])
    setClients(clientsData || [])
    setServices(servicesData || [])
  }

  function changeWeek(offset) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + offset * 7)
    setWeekStart(d)
  }

  function getAppointmentsForDay(day) {
    return appointments.filter(app => {
      const d = new Date(app.data)
      return d.toDateString() === day.toDateString()
    })
  }

  function formatDay(d) {
    return d.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric'
    })
  }

  function isFullDay(dayApps) {
    return dayApps.length >= 6 // 👉 cambia soglia se vuoi
  }

  function openNew(day) {
    setEditMode(false)
    setCurrentId(null)
    setSelectedDate(day)
    setClientId('')
    setSelectedServices([])
    setTime('')
    setOpen(true)
  }

  function openEdit(app) {
    setEditMode(true)
    setCurrentId(app.id)
    setSelectedDate(new Date(app.data))
    setClientId(app.client_id)

    const selected = app.appointment_services.map(s => s.services)
    setSelectedServices(selected)

    setTime(new Date(app.data).toTimeString().slice(0, 5))

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
        .update({
          data: d,
          client_id: clientId
        })
        .eq('id', currentId)

      await supabase
        .from('appointment_services')
        .delete()
        .eq('appointment_id', currentId)
    } else {
      const { data } = await supabase
        .from('appointments')
        .insert([
          {
            data: d,
            client_id: clientId
          }
        ])
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

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <button onClick={() => changeWeek(-1)}>←</button>

        <h1 className="text-2xl font-bold text-pink-700">
          Calendario
        </h1>

        <button onClick={() => changeWeek(1)}>→</button>
      </div>

      {/* SETTIMANA */}
      <div className="space-y-4">

        {getWeekDays().map((day, i) => {
          const dayApps = getAppointmentsForDay(day)

          return (
            <div
              key={i}
              className={`p-4 rounded-2xl shadow ${
                isFullDay(dayApps)
                  ? 'bg-red-100'
                  : 'bg-white'
              }`}
            >

              <div className="flex justify-between items-center mb-2">

                <div className="font-bold text-pink-600">
                  {formatDay(day)}
                </div>

                <button
                  onClick={() => openNew(day)}
                  className="text-pink-600"
                >
                  ➕
                </button>

              </div>

              {dayApps.length === 0 && (
                <div className="text-gray-400 text-sm">
                  Nessun appuntamento
                </div>
              )}

              {dayApps.map(app => (
                <div
                  key={app.id}
                  onClick={() => openEdit(app)}
                  className="bg-pink-50 p-3 rounded-xl mb-2 cursor-pointer"
                >
                  <div className="font-semibold">
                    {new Date(app.data).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>

                  <div className="text-sm">
                    {app.clients?.nome}
                  </div>
                </div>
              ))}

            </div>
          )
        })}

      </div>

      {/* MODALE */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-6 rounded-2xl w-[90%] max-w-md space-y-4">

            <h2 className="text-xl font-bold text-pink-700">
              {editMode ? 'Modifica' : 'Nuovo'} appuntamento
            </h2>

            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full border p-3 rounded-xl"
            >
              <option value="">Cliente</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full border p-3 rounded-xl"
            />

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {services.map(s => (
                <div
                  key={s.id}
                  onClick={() => toggleService(s)}
                  className={`p-2 rounded cursor-pointer ${
                    selectedServices.find(x => x.id === s.id)
                      ? 'bg-pink-200'
                      : 'bg-gray-100'
                  }`}
                >
                  {s.nome}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="w-full bg-gray-200 p-3 rounded-xl"
              >
                Annulla
              </button>

              <button
                onClick={saveAppointment}
                className="w-full bg-pink-600 text-white p-3 rounded-xl"
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