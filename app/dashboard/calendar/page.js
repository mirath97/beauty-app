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
  const [editingId, setEditingId] = useState(null)

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

  // 📲 WhatsApp
  function sendWhatsApp(app) {
    let phone = app.client?.telefono || ''

    phone = phone.replace(/\s+/g, '').replace('+', '')

    if (phone.startsWith('0')) {
      phone = '39' + phone.substring(1)
    }

    const text = `Ciao ${app.client?.nome} 💅 ti ricordiamo il tuo appuntamento!`

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`)
  }

  // ⏱ durata reale
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

  // 🎨 colori categoria
  function getColor(category) {
    if (category === 'Unghie') return 'from-pink-500 to-pink-400'
    if (category === 'Capelli') return 'from-purple-500 to-purple-400'
    if (category === 'Estetica') return 'from-orange-400 to-orange-300'
    return 'from-gray-400 to-gray-300'
  }

  // ➕ CREA / MODIFICA
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

    resetForm()
    fetchAll()
  }

  function resetForm() {
    setShowModal(false)
    setSelectedClient('')
    setSelectedServices([])
    setDate('')
    setEditingId(null)
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Calendario PRO 💅📅
      </h1>

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
          className={`bg-gradient-to-r ${getColor(app.services?.[0]?.categoria)} text-white p-4 rounded-xl shadow space-y-2`}
        >

          <div className="flex justify-between">
            <div className="font-bold text-lg">
              {app.client?.nome}
            </div>

            <div className="text-sm">
              € {getTotal(app)}
            </div>
          </div>

          <div className="text-sm">
            🕒 {new Date(app.data).toLocaleString()}
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

            {/* CLIENTE */}
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

            {/* SERVIZI PER CATEGORIA */}
            <div className="max-h-40 overflow-y-auto space-y-2">

              {Object.entries(
                services.reduce((acc, s) => {
                  const cat = s.categoria || 'Altro'
                  if (!acc[cat]) acc[cat] = []
                  acc[cat].push(s)
                  return acc
                }, {})
              ).map(([cat, items]) => (

                <div key={cat}>

                  <div className="font-bold text-pink-600 text-sm">
                    {cat}
                  </div>

                  {items.map(s => (
                    <label key={s.id} className="flex justify-between text-sm">

                      <div className="flex gap-2">
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
                        {s.nome}
                      </div>

                      <div className="text-xs text-gray-500">
                        €{s.prezzo} • {s.durata || 30} min
                      </div>

                    </label>
                  ))}

                </div>

              ))}

            </div>

            {/* DATA */}
            <input
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border p-2 rounded"
            />

            <div className="flex justify-between">

              <button onClick={resetForm}>
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