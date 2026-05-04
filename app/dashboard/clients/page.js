'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabaseClient'

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    const supabase = createSupabaseClient()
    const { data } = await supabase.from('clients').select('*')
    setClients(data || [])
  }

  async function addClient() {
    const supabase = createSupabaseClient()

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

      <h1 className="text-xl font-bold text-pink-700">Clienti</h1>

      <div className="bg-white p-3 rounded shadow space-y-2">
        <input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Telefono" value={phone} onChange={e => setPhone(e.target.value)} />
        <button onClick={addClient}>➕ Aggiungi</button>
      </div>

      {clients.map(c => (
        <div key={c.id} className="bg-white p-2 rounded shadow">
          {c.nome} - {c.telefono}
        </div>
      ))}

    </div>
  )
}