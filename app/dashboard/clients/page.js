'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [appServices, setAppServices] = useState([])

  const [selectedClient, setSelectedClient] = useState(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const supabase = getSupabase()

    const { data: clientsData } = await supabase.from('clients').select('*')
    const { data: apps } = await supabase.from('appointments').select('*')
    const { data: servicesData } = await supabase.from('services').select('*')
    const { data: rel } = await supabase.from('appointment_services').select('*')

    setClients(clientsData || [])
    setAppointments(apps || [])
    setServices(servicesData || [])
    setAppServices(rel || [])
  }

  async function addClient() {
    if (!name) return

    const supabase = getSupabase()

    await supabase.from('clients').insert({
      nome: name,
      telefono: phone
    })

    setName('')
    setPhone('')
    fetchAll()
  }

  async function updateClient() {
    const supabase = getSupabase()

    await supabase
      .from('clients')
      .update({
        nome: name,
        telefono: phone
      })
      .eq('id', selectedClient.id)

    setSelectedClient(null)
    fetchAll()
  }

  async function deleteClient(id) {
    const supabase = getSupabase()

    await supabase.from('clients').delete().eq('id', id)

    setSelectedClient(null)
    fetchAll()
  }

  const filtered = clients.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase())
  )

  // 📊 DATI CLIENTE
  function getClientData(client) {
    const clientApps = appointments.filter(a => a.client_id === client.id)

    let total = 0
    let servicesCount = {}

    clientApps.forEach(app => {
      const rel = appServices.filter(r => r.appointment_id === app.id)

      rel.forEach(r => {
        const s = services.find(x => x.id === r.service_id)

        if (!s) return

        total += Number(s.prezzo || 0)

        servicesCount[s.nome] =
          (servicesCount[s.nome] || 0) + 1
      })
    })

    return {
      total,
      count: clientApps.length,
      servicesCount,
      apps: clientApps.sort(
        (a, b) => new Date(b.data) - new Date(a.data)
      )
    }
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Clienti 👤
      </h1>

      {/* FORM */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        <div className="font-bold text-pink-600">
          ➕ Nuovo cliente
        </div>

        <input
          placeholder="Nome cliente"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Telefono"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <button
          onClick={addClient}
          className="bg-pink-600 text-white px-4 py-2 rounded-xl"
        >
          Aggiungi
        </button>
      </div>

      {/* SEARCH */}
      <input
        placeholder="🔍 Cerca cliente"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border p-2 rounded"
      />

      {/* LISTA */}
      <div className="space-y-2">
        {filtered.map(c => (
          <div
            key={c.id}
            onClick={() => {
              setSelectedClient(c)
              setName(c.nome)
              setPhone(c.telefono || '')
            }}
            className="bg-white p-4 rounded-xl shadow flex justify-between items-center cursor-pointer"
          >
            <div>
              <div className="font-bold">{c.nome}</div>
              <div className="text-xs text-gray-500">
                {c.telefono || 'Nessun numero'}
              </div>
            </div>

            <a
              href={`https://wa.me/${(c.telefono || '').replace('+', '')}`}
              target="_blank"
              onClick={e => e.stopPropagation()}
              className="bg-green-500 text-white px-3 py-1 rounded text-xs"
            >
              WhatsApp
            </a>
          </div>
        ))}
      </div>

      {/* MODAL CLIENTE */}
      {selectedClient && (() => {
        const data = getClientData(selectedClient)

        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white w-[340px] rounded-2xl p-5 space-y-4">

              <h2 className="text-lg font-bold text-pink-600">
                Scheda cliente
              </h2>

              {/* MODIFICA */}
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border p-2 rounded"
              />

              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full border p-2 rounded"
              />

              {/* KPI */}
              <div className="grid grid-cols-2 gap-2 text-sm">

                <div className="bg-pink-100 p-2 rounded">
                  Visite: {data.count}
                </div>

                <div className="bg-green-100 p-2 rounded">
                  € {data.total}
                </div>

              </div>

              {/* SERVIZI */}
              <div>
                <div className="text-sm font-bold mb-1">
                  Servizi più fatti
                </div>

                {Object.entries(data.servicesCount)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([name, count]) => (
                    <div key={name} className="text-xs">
                      {name} ({count})
                    </div>
                  ))}
              </div>

              {/* STORICO */}
              <div className="max-h-32 overflow-y-auto text-xs">
                {data.apps.map(a => (
                  <div key={a.id} className="border-b py-1">
                    {new Date(a.data).toLocaleDateString()}
                  </div>
                ))}
              </div>

              {/* BOTTONI */}
              <div className="flex justify-between">

                <button
                  onClick={() => deleteClient(selectedClient.id)}
                  className="text-red-500 text-sm"
                >
                  Elimina
                </button>

                <button
                  onClick={updateClient}
                  className="bg-pink-600 text-white px-3 py-1 rounded"
                >
                  Salva
                </button>

              </div>

              <button
                onClick={() => setSelectedClient(null)}
                className="text-gray-500 text-xs"
              >
                Chiudi
              </button>

            </div>

          </div>
        )
      })()}

    </div>
  )
}