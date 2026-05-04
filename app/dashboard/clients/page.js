'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('clients')
      .select('*')

    console.log('CLIENTS:', data, error)

    setClients(data || [])
  }

  async function addClient() {
    const supabase = getSupabase()

    await supabase.from('clients').insert({
      nome: name,
      telefono: phone
    })

    setName('')
    setPhone('')

    fetchClients()
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-xl font-bold text-pink-700">
        Clienti 👤
      </h1>

      {/* FORM */}
      <div className="bg-white p-3 rounded shadow space-y-2">
        <input
          placeholder="Nome"
          value={name}
          onChange={e => setName(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <input
          placeholder="Telefono"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <button
          onClick={addClient}
          className="bg-pink-600 text-white px-3 py-1 rounded"
        >
          ➕ Aggiungi
        </button>
      </div>

      {/* LISTA */}
      {clients.map(c => (
        <div key={c.id} className="bg-white p-2 rounded shadow">
          {c.nome} - {c.telefono}
        </div>
      ))}

    </div>
  )
}