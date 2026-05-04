'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [editId, setEditId] = useState(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')

  useEffect(() => {
    fetchServices()
  }, [])

  async function fetchServices() {
   const supabase = getSupabase()
    const { data } = await supabase.from('services').select('*')
    setServices(data || [])
  }

  async function updateService() {
    const supabase = createSupabaseClient()

    await supabase
      .from('services')
      .update({ nome: name, prezzo: price })
      .eq('id', editId)

    setEditId(null)
    fetchServices()
  }

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-xl font-bold text-pink-700">Servizi</h1>

      {services.map(s => (
        <div key={s.id} className="bg-white p-2 rounded shadow">

          {editId === s.id ? (
            <>
              <input value={name} onChange={e => setName(e.target.value)} />
              <input value={price} onChange={e => setPrice(e.target.value)} />
              <button onClick={updateService}>Salva</button>
            </>
          ) : (
            <div className="flex justify-between">
              <span>{s.nome} - €{s.prezzo}</span>
              <button onClick={() => {
                setEditId(s.id)
                setName(s.nome)
                setPrice(s.prezzo)
              }}>✏️</button>
            </div>
          )}

        </div>
      ))}

    </div>
  )
}