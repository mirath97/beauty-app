'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [editingId, setEditingId] = useState(null)

  const [nome, setNome] = useState('')
  const [prezzo, setPrezzo] = useState('')
  const [categoria, setCategoria] = useState('Unghie')

  useEffect(() => {
    fetchServices()
  }, [])

  async function fetchServices() {
    const supabase = getSupabase()

    const { data } = await supabase
      .from('services')
      .select('*')

    setServices(data || [])
  }

  // ➕ aggiungi / modifica
  async function saveService() {
    const supabase = getSupabase()

    if (editingId) {
      await supabase
        .from('services')
        .update({
          nome,
          prezzo,
          categoria
        })
        .eq('id', editingId)
    } else {
      await supabase.from('services').insert({
        nome,
        prezzo,
        categoria
      })
    }

    resetForm()
    fetchServices()
  }

  function resetForm() {
    setNome('')
    setPrezzo('')
    setCategoria('Unghie')
    setEditingId(null)
  }

  function editService(s) {
    setEditingId(s.id)
    setNome(s.nome)
    setPrezzo(s.prezzo)
    setCategoria(s.categoria || 'Unghie')
  }

  // 📦 raggruppa per categoria
  const grouped = services.reduce((acc, s) => {
    const cat = s.categoria || 'Altro'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div className="p-4 space-y-4">

      <h1 className="text-2xl font-bold text-pink-700">
        Servizi 💅
      </h1>

      {/* FORM */}
      <div className="bg-white p-4 rounded-xl shadow space-y-2">

        <input
          placeholder="Nome servizio"
          value={nome}
          onChange={e => setNome(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <input
          placeholder="Prezzo"
          value={prezzo}
          onChange={e => setPrezzo(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option>Unghie</option>
          <option>Capelli</option>
          <option>Estetica</option>
          <option>Altro</option>
        </select>

        <button
          onClick={saveService}
          className="bg-pink-600 text-white px-4 py-2 rounded"
        >
          {editingId ? 'Salva modifica' : '➕ Aggiungi servizio'}
        </button>

      </div>

      {/* LISTA PER CATEGORIA */}
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="bg-white p-4 rounded-xl shadow">

          <div className="font-bold text-pink-600 mb-2">
            {cat}
          </div>

          {items.map(s => (
            <div
              key={s.id}
              className="flex justify-between items-center border-b py-2 text-sm"
            >

              <div>
                {s.nome} - €{s.prezzo}
              </div>

              <button
                onClick={() => editService(s)}
                className="text-blue-500 text-xs"
              >
                Modifica
              </button>

            </div>
          ))}

        </div>
      ))}

    </div>
  )
}