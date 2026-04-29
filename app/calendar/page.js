'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CalendarPage() {
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])

  const [isNew, setIsNew] = useState(false)

  const [selectedClient, setSelectedClient] = useState(null)
  const [searchClient, setSearchClient] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editServices, setEditServices] = useState([])

  const [searchService, setSearchService] = useState('')

  useEffect(() => {
    fetchAppointments()
    fetchClients()
    fetchServices()

    const stored = localStorage.getItem('selectedClient')
    if (stored) {
      const cliente = JSON.parse(stored)
      setSelectedClient(cliente)
      setSearchClient(cliente.nome)
      setIsNew(true)
      setEditDate(new Date().toISOString().slice(0,16))
      localStorage.removeItem('selectedClient')
    }
  }, [])

  async function fetchAppointments() {
    const { data } = await supabase
      .from('appointments')
      .select(`
        id,
        data,
        clients (nome),
        appointment_services (
          services (nome)
        )
      `)
      .order('data')

    setAppointments(data || [])
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('*')
    setClients(data || [])
  }

  async function fetchServices() {
    const { data } = await supabase.from('services').select('*')
    setServices(data || [])
  }

  function toggleService(id) {
    if (editServices.includes(id)) {
      setEditServices(editServices.filter(s => s !== id))
    } else {
      setEditServices([...editServices, id])
    }
  }

  function getTotalDuration() {
    return services
      .filter(s => editServices.includes(s.id))
      .reduce((acc, s) => acc + (s.durata || 0), 0)
  }

  function getEndTime() {
    if (!editDate) return ''
    const start = new Date(editDate)
    const end = new Date(start.getTime() + getTotalDuration() * 60000)

    return end.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  async function saveAppointment() {
    if (!selectedClient) return alert('Seleziona cliente')

    const { data } = await supabase
      .from('appointments')
      .insert({
        data: editDate,
        client_id: selectedClient.id
      })
      .select()

    const appointmentId = data[0].id

    const relations = editServices.map(s => ({
      appointment_id: appointmentId,
      service_id: s
    }))

    await supabase.from('appointment_services').insert(relations)

    setIsNew(false)
    setSelectedClient(null)
    setEditServices([])
    setSearchService('')
    fetchAppointments()
  }

  const filteredClients = clients.filter(c =>
    (c.nome || '').toLowerCase().includes(searchClient.toLowerCase())
  )

  const filteredServices = services.filter(s =>
    (s.nome || '').toLowerCase().includes(searchService.toLowerCase())
  )

  const categories = [...new Set(services.map(s => s.categoria || 'Altro'))]

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-pink-700">
          Calendario
        </h1>

        <button
          onClick={() => {
            setIsNew(true)
            setEditDate(new Date().toISOString().slice(0,16))
            setEditServices([])
            setSelectedClient(null)
            setSearchClient('')
            setSearchService('')
          }}
          className="bg-pink-500 text-white px-4 py-2 rounded-xl"
        >
          + Nuovo
        </button>
      </div>

      {/* LISTA */}
      <div className="space-y-3">
        {appointments.map(app => (
          <div
            key={app.id}
            className="p-4 bg-white rounded-2xl shadow border border-pink-100"
          >
            <div className="text-pink-700 font-semibold">
              {app.clients?.nome}
            </div>

            <div className="text-sm text-gray-400">
              {new Date(app.data).toLocaleString()}
            </div>

            <div className="text-sm text-pink-500">
              {app.appointment_services
                ?.map(s => s.services.nome)
                .join(', ')
              }
            </div>
          </div>
        ))}
      </div>

      {/* MODALE */}
      {isNew && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl space-y-4">

            <h2 className="text-lg font-bold text-pink-700">
              Nuovo appuntamento
            </h2>

            {/* CLIENTE */}
            <input
              placeholder="Cerca cliente..."
              value={searchClient}
              onChange={(e) => setSearchClient(e.target.value)}
              className="w-full p-2 border rounded-xl"
            />

            <div className="max-h-24 overflow-y-auto">
              {filteredClients.map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedClient(c)
                    setSearchClient(c.nome)
                  }}
                  className="p-2 hover:bg-pink-100 cursor-pointer rounded"
                >
                  {c.nome}
                </div>
              ))}
            </div>

            {/* DATA */}
            <input
              type="datetime-local"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full p-2 border rounded-xl"
            />

            {/* DURATA */}
            <div className="text-sm text-gray-500">
              ⏱ {getTotalDuration()} min • 🕓 {getEndTime()}
            </div>

            {/* SEARCH SERVIZI */}
            <input
              placeholder="Cerca servizio..."
              value={searchService}
              onChange={(e) => setSearchService(e.target.value)}
              className="w-full p-2 border rounded-xl"
            />

            {/* SERVIZI */}
            <div className="max-h-56 overflow-y-auto space-y-4">

              {/* ⭐ PREFERITI */}
              <div>
                <div className="text-sm font-semibold text-pink-600 mb-1">
                  ⭐ Preferiti
                </div>

                <div className="flex flex-wrap gap-2">
                  {filteredServices
                    .filter(s => s.preferito)
                    .map(s => (
                      <button
                        key={s.id}
                        onClick={() => toggleService(s.id)}
                        className={`px-3 py-1 text-sm rounded-full ${
                          editServices.includes(s.id)
                            ? 'bg-pink-500 text-white'
                            : 'bg-pink-100'
                        }`}
                      >
                        {s.nome}
                      </button>
                    ))}
                </div>
              </div>

              {/* CATEGORIE */}
              {categories.map(cat => (
                <div key={cat}>
                  <div className="text-sm font-semibold text-pink-600 mb-1">
                    {cat}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {filteredServices
                      .filter(s => (s.categoria || 'Altro') === cat)
                      .map(s => (
                        <button
                          key={s.id}
                          onClick={() => toggleService(s.id)}
                          className={`px-3 py-1 text-sm rounded-full ${
                            editServices.includes(s.id)
                              ? 'bg-pink-500 text-white'
                              : 'bg-gray-200'
                          }`}
                        >
                          {s.nome}
                        </button>
                      ))}
                  </div>
                </div>
              ))}

            </div>

            {/* BOTTONI */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsNew(false)}
                className="flex-1 p-3 bg-gray-200 rounded-xl"
              >
                Annulla
              </button>

              <button
                onClick={saveAppointment}
                className="flex-1 p-3 bg-pink-500 text-white rounded-xl"
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