'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CalendarPage() {
  const router = useRouter()

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
        durata,
        client_id,
        clients (nome, telefono),
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

  function getTotal(app) {
    return app.appointment_services.reduce(
      (acc, s) => acc + (s.services.prezzo || 0),
      0
    )
  }

  function getDailyTotal(dayApps) {
    return dayApps.reduce((tot, app) => tot + getTotal(app), 0)
  }

  function getDayColor(total) {
    if (total === 0) return 'bg-gray-100'
    if (total < 80) return 'bg-red-100'
    if (total < 150) return 'bg-yellow-100'
    return 'bg-green-100'
  }

  function goToDay(day) {
    const date = day.toISOString().split('T')[0]
    router.push(`/calendar/day?date=${date}`)
  }

  function openNew(day) {
    setEditMode(false)
    setCurrentId(null)
    setSelectedDate(day)
    setClientId('')
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

  async function checkOverlap(startDate, endDate, excludeId = null) {
    const { data } = await supabase
      .from('appointments')
      .select('id, data, durata')

    for (const app of data || []) {
      if (excludeId && app.id === excludeId) continue

      const existingStart = new Date(app.data)
      const existingEnd = new Date(existingStart)
      existingEnd.setMinutes(existingEnd.getMinutes() + (app.durata || 60))

      if (startDate < existingEnd && endDate > existingStart) return true
    }

    return false
  }

  async function saveAppointment() {
    if (!clientId || !time) return alert('Compila tutto')

    const d = new Date(selectedDate)
    const [h, m] = time.split(':').map(Number)
    d.setHours(h)
    d.setMinutes(m)

    const end = new Date(d)
    end.setMinutes(end.getMinutes() + duration)

    if (await checkOverlap(d, end, editMode ? currentId : null)) {
      alert('Orario occupato')
      return
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
    if (!phone) return alert('Numero mancante')

    const date = new Date(app.data)

    const text = `Ciao ${app.clients?.nome} 💅
Appuntamento il ${date.toLocaleDateString('it-IT')} alle ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })}`

    window.open(`https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(text)}`)
  }

  return (
    <div className="space-y-4 p-4">

      <div className="flex justify-between">
        <button onClick={() => changeWeek(-1)}>←</button>
        <h1 className="text-2xl font-bold text-pink-700">Calendario</h1>
        <button onClick={() => changeWeek(1)}>→</button>
      </div>

      <div className="grid grid-cols-7 gap-2">

        {getWeekDays().map((day, i) => {
          const dayApps = getAppointmentsForDay(day)
          const total = getDailyTotal(dayApps)

          return (
            <div
              key={i}
              onDoubleClick={() => goToDay(day)}
              className={`p-2 rounded-xl min-h-[300px] flex flex-col cursor-pointer ${getDayColor(total)}`}
            >
              <div className="flex justify-between">
                <div>{formatDay(day)}</div>
                <button onClick={() => openNew(day)}>➕</button>
              </div>

              <div className="text-green-600 text-xs">€ {total}</div>

              <div className="space-y-2 mt-2">

                {dayApps.map(app => (
                  <div
                    key={app.id}
                    onClick={() => openEdit(app)}
                    className="bg-white p-2 rounded text-xs shadow"
                  >
                    <div>{app.clients?.nome}</div>
                    <div>€ {getTotal(app)}</div>
                    <div>{app.durata || 60} min</div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        sendWhatsAppReminder(app)
                      }}
                      className="bg-green-500 text-white w-full text-xs mt-1 rounded"
                    >
                      📲
                    </button>
                  </div>
                ))}

              </div>
            </div>
          )
        })}

      </div>

    </div>
  )
}