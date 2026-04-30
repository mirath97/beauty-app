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

  // 🔥 FIX INCASSI
  function getTotal(app) {
    return (app.appointment_services || []).reduce(
      (acc, s) => acc + Number(s.services?.prezzo || 0),
      0
    )
  }

  function getDailyTotal(dayApps) {
    return dayApps.reduce((tot, app) => tot + getTotal(app), 0)
  }

  // 🤖 AI
  function analyzeWeek() {
    return getWeekDays().map(day => {
      const apps = getAppointmentsForDay(day)
      const total = getDailyTotal(apps)

      let color = 'bg-gray-100'
      let icon = '⚪'
      let suggestion = 'Inserisci promozioni'

      if (total > 0 && total < 80) {
        color = 'bg-red-100'
        icon = '🔴'
        suggestion = 'Manda reminder clienti'
      }

      if (total >= 80 && total < 150) {
        color = 'bg-yellow-100'
        icon = '🟡'
        suggestion = 'Fai upsell'
      }

      if (total >= 150) {
        color = 'bg-green-100'
        icon = '🟢'
        suggestion = 'Aumenta prezzi'
      }

      return {
        day: day.toLocaleDateString('it-IT', { weekday: 'short' }),
        total,
        suggestion,
        color,
        icon
      }
    })
  }

  // 🔔 CLIENTI INATTIVI
  function getInactiveClients() {
    const map = {}

    appointments.forEach(app => {
      const id = app.client_id
      const date = new Date(app.data)

      if (!map[id] || new Date(map[id].data) < date) {
        map[id] = app
      }
    })

    const now = new Date()

    return Object.values(map)
      .map(app => {
        const diff = Math.floor(
          (now - new Date(app.data)) / (1000 * 60 * 60 * 24)
        )
        return { ...app, diff }
      })
      .filter(c => c.diff >= 30)
      .sort((a, b) => b.diff - a.diff)
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

  // 📲 WHATSAPP MIGLIORATO
  function sendWhatsAppReminder(app) {
    const phone = app.clients?.telefono
    const nome = app.clients?.nome

    if (!phone) return

    const date = new Date(app.data).toLocaleDateString('it-IT')
    const time = new Date(app.data).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })

    const text = `Ciao ${nome} 💅
Ti ricordiamo il tuo appuntamento:

📅 ${date}
⏰ ${time}

Ti aspettiamo!`

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

      {/* 🔔 CLIENTI DA RICHIAMARE */}
      <div className="bg-yellow-100 p-3 rounded-xl">
        <div className="font-bold mb-2">🔔 Clienti da ricontattare</div>

        {getInactiveClients().slice(0, 3).map((c, i) => (
          <div key={i} className="flex justify-between bg-white p-2 rounded mb-1 text-sm">
            <div>
              <div>{c.clients?.nome}</div>
              <div className="text-xs text-gray-500">{c.diff} giorni</div>
            </div>

            <button
              onClick={() => sendWhatsAppReminder(c)}
              className="bg-green-500 text-white px-2 py-1 rounded text-xs"
            >
              📲 Scrivi
            </button>
          </div>
        ))}
      </div>

      {/* 🤖 AI */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="font-bold text-pink-700 mb-2">
          🤖 Suggerimenti intelligenti
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {analyzeWeek().map((d, i) => (
            <div key={i} className={`p-2 rounded ${d.color}`}>
              <div className="flex justify-between">
                <span>{d.icon} {d.day}</span>
                <span>€ {d.total}</span>
              </div>
              <div>{d.suggestion}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CALENDARIO */}
      <div className="grid grid-cols-7 gap-2">
        {getWeekDays().map((day, i) => {
          const dayApps = getAppointmentsForDay(day)

          return (
            <div key={i} className="bg-gray-100 p-2 rounded flex flex-col min-h-[260px]">

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

    </div>
  )
}