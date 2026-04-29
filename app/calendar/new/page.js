'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function NewAppointment() {
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [grouped, setGrouped] = useState({})

  const [clientId, setClientId] = useState('')
  const [selectedServices, setSelectedServices] = useState([])
  const [startTime, setStartTime] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: clientsData } = await supabase.from('clients').select('*')
    const { data: servicesData } = await supabase.from('services').select('*')

    setClients(clientsData || [])
    setServices(servicesData || [])

    const groupedData = {}

    ;(servicesData || []).forEach(s => {
      const cat = s.categoria || 'Altro'
      if (!groupedData[cat]) groupedData[cat] = []
      groupedData[cat].push(s)
    })

    setGrouped(groupedData)
  }

  function toggleService(service) {
    if (selectedServices.find(s => s.id === service.id)) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id))
    } else {
      setSelectedServices([...selectedServices, service])
    }
  }

  function getTotalDuration() {
    return selectedServices.reduce((acc, s) => acc + (s.durata || 0), 0)
  }

  function getEndDate(startDate) {
    const end = new Date(startDate)
    end.setMinutes(end.getMinutes() + getTotalDuration())
    return end
  }

  // 🔥 CONTROLLO SOVRAPPOSIZIONI
  async function checkOverlap(startDate, endDate) {
    const { data } = await supabase
      .from('appointments')
      .select('data')

    for (const app of data || []) {
      const existingStart = new Date(app.data)

      // per semplicità assumiamo durata media 60 min (puoi migliorare dopo)
      const existingEnd = new Date(existingStart)
      existingEnd.setMinutes(existingEnd.getMinutes() + 60)

      const overlap =
        startDate < existingEnd && endDate > existingStart

      if (overlap) return true
    }

    return false
  }

  async function saveAppointment() {
    if (!clientId || selectedServices.length === 0 || !startTime) {
      alert('Compila tutti i campi')
      return
    }

    const now = new Date()
    const [h, m] = startTime.split(':').map(Number)

    now.setHours(h)
    now.setMinutes(m)

    const endDate = getEndDate(now)

    // 🔥 BLOCCO
    const hasOverlap = await checkOverlap(now, endDate)

    if (hasOverlap) {
      alert('⚠️ Orario già occupato!')
      return
    }

    const { data: app } = await supabase
      .from('appointments')
      .insert([
        {
          data: now,
          client_id: clientId
        }
      ])
      .select()
      .single()

    for (const s of selectedServices) {
      await supabase.from('appointment_services').insert({
        appointment_id: app.id,
        service_id: s.id
      })
    }

    alert('Appuntamento salvato!')
  }

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold text-pink-700">
        Nuovo appuntamento
      </h1>

      {/* CLIENTE */}
      <select
        onChange={e => setClientId(e.target.value)}
        className="w-full border p-3 rounded-xl"
      >
        <option value="">Seleziona cliente</option>
        {clients.map(c => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>

      {/* SERVIZI */}
      <div className="space-y-4">

        {Object.keys(grouped).map(cat => (
          <div key={cat}>

            <h2 className="text-pink-600 font-bold mb-2">
              {cat}
            </h2>

            {grouped[cat].map(s => {
              const selected = selectedServices.find(x => x.id === s.id)

              return (
                <div
                  key={s.id}
                  onClick={() => toggleService(s)}
                  className={`p-3 rounded-xl cursor-pointer flex justify-between ${
                    selected
                      ? 'bg-pink-200'
                      : 'bg-white border border-pink-100'
                  }`}
                >
                  <span>{s.nome}</span>
                  <span className="text-sm text-gray-500">
                    € {s.prezzo}
                  </span>
                </div>
              )
            })}

          </div>
        ))}

      </div>

      {/* ORARIO */}
      <input
        type="time"
        value={startTime}
        onChange={e => setStartTime(e.target.value)}
        className="w-full border p-3 rounded-xl"
      />

      <button
        onClick={saveAppointment}
        className="bg-pink-600 text-white w-full p-4 rounded-2xl text-lg"
      >
        Salva appuntamento
      </button>

    </div>
  )
}