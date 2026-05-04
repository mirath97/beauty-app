'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabaseClient'

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
const [newPhone, setNewPhone] = useState('')

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

  const filtered = clients.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  )

  function openWhatsApp(c) {
    let phone = c.telefono

    if (!phone) return alert('Numero mancante')

    phone = phone.replace(/\D/g, '')

    if (!phone.startsWith('39')) {
      phone = '39' + phone
    }

    const text = `Ciao ${c.nome} 💅`
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`)
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Clienti
      </h1>

      {/* SEARCH */}
      <input
        placeholder="Cerca cliente..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border p-2 w-full rounded-lg"
      />

      {/* LISTA */}
      <div className="space-y-2">
        {filtered.map(c => (
          <div
            key={c.id}
            className="bg-white p-3 rounded-xl shadow flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{c.nome}</div>
              <div className="text-sm text-gray-500">
                {c.telefono}
              </div>
            </div>

            <button
              onClick={() => openWhatsApp(c)}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              📲
            </button>
          </div>
        ))}
      </div>

    </div>
  )
}