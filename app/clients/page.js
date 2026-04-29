'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)

  const [nome, setNome] = useState('')
  const [telefono, setTelefono] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('nome')

    setClients(data || [])
  }

  async function addClient() {
    if (!nome) return

    await supabase.from('clients').insert({
      nome,
      telefono
    })

    setNome('')
    setTelefono('')
    fetchClients()
  }

  async function updateClient() {
    await supabase
      .from('clients')
      .update({ nome, telefono })
      .eq('id', selectedClient.id)

    setSelectedClient(null)
    fetchClients()
  }

  async function deleteClient(id) {
    await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    setSelectedClient(null)
    fetchClients()
  }

  function sendWhatsApp(cliente) {
    if (!cliente.telefono) return alert('Nessun numero')

    const msg = encodeURIComponent(
      `Ciao ${cliente.nome}, ti scriviamo dal centro estetico 💅`
    )

    window.open(`https://wa.me/${cliente.telefono}?text=${msg}`, '_blank')
  }

  function createAppointment(cliente) {
    localStorage.setItem('selectedClient', JSON.stringify(cliente))
    window.location.href = '/calendar'
  }

  const filtered = clients.filter(c =>
    (c.nome || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.telefono || '').includes(search)
  )

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <h1 className="text-3xl font-bold text-pink-700">
        Clienti
      </h1>

      {/* AGGIUNGI */}
      <div className="flex gap-2">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome cliente"
          className="flex-1 p-3 border rounded-xl"
        />

        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="Telefono"
          className="flex-1 p-3 border rounded-xl"
        />

        <button
          onClick={addClient}
          className="bg-pink-500 text-white px-5 rounded-xl"
        >
          +
        </button>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Cerca cliente..."
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 border rounded-xl"
      />

      {/* LISTA CLIENTI */}
      <div className="space-y-3">

        {filtered.map(c => (
          <div
            key={c.id}
            className="flex justify-between items-center p-4 bg-white rounded-2xl shadow hover:shadow-md border border-pink-100"
          >

            <div>
              <div className="text-pink-700 font-semibold">
                {c.nome}
              </div>

              <div className="text-sm text-gray-400">
                {c.telefono}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedClient(c)
                setNome(c.nome)
                setTelefono(c.telefono || '')
              }}
              className="bg-pink-500 text-white px-4 py-2 rounded-xl"
            >
              Modifica
            </button>

          </div>
        ))}

      </div>

      {/* MODALE CLIENTE */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">

            <h2 className="text-xl font-bold text-pink-700">
              Scheda cliente
            </h2>

            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full p-3 border rounded-xl"
            />

            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full p-3 border rounded-xl"
            />

            {/* BOTTONI */}
            <div className="flex flex-wrap gap-2">

              <button
                onClick={() => setSelectedClient(null)}
                className="flex-1 p-3 bg-gray-200 rounded-xl"
              >
                Chiudi
              </button>

              <button
                onClick={updateClient}
                className="flex-1 p-3 bg-pink-500 text-white rounded-xl"
              >
                Salva
              </button>

              <button
                onClick={() => sendWhatsApp(selectedClient)}
                className="flex-1 p-3 bg-green-500 text-white rounded-xl"
              >
                WhatsApp
              </button>

              <button
                onClick={() => createAppointment(selectedClient)}
                className="flex-1 p-3 bg-pink-600 text-white rounded-xl"
              >
                Appuntamento
              </button>

              <button
                onClick={() => deleteClient(selectedClient.id)}
                className="w-full p-3 bg-red-400 text-white rounded-xl"
              >
                Elimina cliente
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}