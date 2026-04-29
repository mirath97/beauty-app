'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

export default function DayClient() {
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')

  function getSafeDate(dateParam) {
    if (!dateParam) return new Date()
    const d = new Date(dateParam)
    return isNaN(d.getTime()) ? new Date() : d
  }

  const [selectedDate, setSelectedDate] = useState(getSafeDate(dateParam))

  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])

  const [open, setOpen] = useState(false)
  const [currentId, setCurrentId] = useState(null)

  const [clientId, setClientId] = useState('')
  const [selectedServices, setSelectedServices] = useState([])
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(60)

  const START_HOUR = 9
  const END_HOUR = 19
  const HOUR_HEIGHT = 80

  useEffect(() => {
    fetchAll()
  }, [selectedDate])

  async function fetchAll() {
    const start = new Date(selectedDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(selectedDate)
    end.setHours(23, 59, 59, 999)

    const { data: apps } = await supabase
      .from('appointments')
      .select(`
        id,
        data,
        durata,
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

  function getTop(date) {
    const h = date.getHours()
    const m = date.getMinutes()
    return (h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT
  }

  function getHeight(duration) {
    return (duration / 60) * HOUR_HEIGHT
  }

  function openEdit(app) {
    setCurrentId(app.id)

    const d = new Date(app.data)

    setClientId(app.client_id)
    setTime(d.toTimeString().slice(0, 5))
    setDuration(app.durata || 60)
    setSelectedServices(app.appointment_services.map(s => s.services))

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

    await supabase
      .from('appointments')
      .update({
        data: d,
        client_id: clientId,
        durata: duration
      })
      .eq('id', currentId)

    await supabase
      .from('appointment_services')
      .delete()
      .eq('appointment_id', currentId)

    for (const s of selectedServices) {
      await supabase.from('appointment_services').insert({
        appointment_id: currentId,
        service_id: s.id
      })
    }

    setOpen(false)
    fetchAll()
  }

  return (
    <div className="p-4">

      <h1 className="text-2xl font-bold text-pink-700 mb-4">
        Timeline Giornaliera
      </h1>

      <input
        type="date"
        value={
          selectedDate instanceof Date && !isNaN(selectedDate)
            ? selectedDate.toISOString().split('T')[0]
            : ''
        }
        onChange={e => setSelectedDate(getSafeDate(e.target.value))}
        className="mb-4 border p-2 rounded"
      />

      <div className="flex">

        {/* ORARI */}
        <div className="w-16 text-xs text-gray-400">
          {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
            <div key={i} style={{ height: HOUR_HEIGHT }}>
              {START_HOUR + i}:00
            </div>
          ))}
        </div>

        {/* TIMELINE */}
        <div
          className="flex-1 relative bg-white border rounded-xl"
          style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}
        >

          {appointments.map(app => {
            const start = new Date(app.data)

            return (
              <div
                key={app.id}
                onClick={() => openEdit(app)}
                className="absolute left-2 right-2 bg-pink-200 rounded-xl p-2 text-xs shadow cursor-pointer"
                style={{
                  top: getTop(start),
                  height: getHeight(app.durata || 60)
                }}
              >
                <div className="font-semibold">
                  {start.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>

                <div>{app.clients?.nome}</div>

                <div className="text-gray-500">
                  {app.durata || 60} min
                </div>
              </div>
            )
          })}

        </div>

      </div>

      {/* MODALE */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-6 rounded-2xl w-[90%] max-w-md space-y-4">

            <h2 className="text-xl font-bold text-pink-700">
              Modifica appuntamento
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

            <input
              type="number"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
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

            <button
              onClick={saveAppointment}
              className="w-full bg-pink-600 text-white p-3 rounded-xl"
            >
              Salva
            </button>

          </div>

        </div>
      )}

    </div>
  )
}