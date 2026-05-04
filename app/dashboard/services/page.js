'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabaseClient'

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [grouped, setGrouped] = useState({})

  const [nome, setNome] = useState('')
  const [prezzo, setPrezzo] = useState('')
  const [durata, setDurata] = useState('')
  const [categoria, setCategoria] = useState('Unghie')

  useEffect(() => {
    fetchServices()
  }, [])

  async function fetchServices() {
    const { data } = await supabase.from('services').select('*')

    setServices(data || [])

    const groupedData = {}

    ;(data || []).forEach(s => {
      const cat = s.categoria || 'Altro'

      if (!groupedData[cat]) groupedData[cat] = []
      groupedData[cat].push(s)
    })

    setGrouped(groupedData)
  }

  async function addService() {
    if (!nome) return

    await supabase.from('services').insert([
      {
        nome,
        prezzo: Number(prezzo),
        durata: Number(durata),
        categoria
      }
    ])

    setNome('')
    setPrezzo('')
    setDurata('')
    setCategoria('Unghie')

    fetchServices()
  }

  async function deleteService(id) {
    await supabase.from('services').delete().eq('id', id)
    fetchServices()
  }

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold text-pink-700">
        Listino servizi
      </h1>

      {/* FORM */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-2">

        <input
          placeholder="Nome servizio"
          value={nome}
          onChange={e => setNome(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Prezzo"
          value={prezzo}
          onChange={e => setPrezzo(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Durata (minuti)"
          value={durata}
          onChange={e => setDurata(e.target.value)}
          className="w-full border p-2 rounded"
        />

        {/* CATEGORIA */}
        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option>Unghie</option>
          <option>Viso</option>
          <option>Corpo</option>
          <option>Ciglia</option>
          <option>Altro</option>
        </select>

        <button
          onClick={addService}
          className="bg-pink-600 text-white w-full p-2 rounded-xl"
        >
          Aggiungi servizio
        </button>

      </div>
	  
	  {/* ================= MODIFICA SERVIZIO ================= */}

{(() => {

  const [editId, setEditId] = useState(null)
  const [editNome, setEditNome] = useState('')
  const [editPrezzo, setEditPrezzo] = useState('')

  function openEdit(service) {
    setEditId(service.id)
    setEditNome(service.nome)
    setEditPrezzo(service.prezzo)
  }

  async function updateService() {
    await supabase
      .from('services')
      .update({
        nome: editNome,
        prezzo: editPrezzo
      })
      .eq('id', editId)

    setEditId(null)
    location.reload()
  }

  return (
    <>
      {/* ⚠️ AGGIUNGI QUESTO BOTTONE DOVE HAI OGNI SERVIZIO */}
      {/* <button onClick={() => openEdit(s)}>✏️</button> */}

      {editId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl space-y-2 w-[90%] max-w-sm">

            <input
              value={editNome}
              onChange={e => setEditNome(e.target.value)}
              className="border p-2 w-full rounded"
              placeholder="Nome servizio"
            />

            <input
              value={editPrezzo}
              onChange={e => setEditPrezzo(e.target.value)}
              className="border p-2 w-full rounded"
              placeholder="Prezzo"
            />

            <button
              onClick={updateService}
              className="bg-green-500 text-white w-full p-2 rounded"
            >
              Salva
            </button>

            <button
              onClick={() => setEditId(null)}
              className="bg-gray-300 w-full p-2 rounded"
            >
              Annulla
            </button>

          </div>
        </div>
      )}
    </>
  )

})()}

      {/* LISTA PER CATEGORIE */}
      <div className="space-y-4">

        {Object.keys(grouped).map(cat => (
          <div key={cat}>

            <h2 className="text-xl font-bold text-pink-600 mb-2">
              {cat}
            </h2>

            <div className="space-y-2">

              {grouped[cat].map(s => (
                <div
                  key={s.id}
                  className="bg-white p-4 rounded-2xl shadow flex justify-between"
                >
                  <div>
                    <div className="font-semibold">
                      {s.nome}
                    </div>
                    <div className="text-sm text-gray-400">
                      € {s.prezzo} • {s.durata} min
                    </div>
                  </div>

                  <button
                    onClick={() => deleteService(s.id)}
                    className="text-red-500"
                  >
                    Elimina
                  </button>

                </div>
              ))}

            </div>

          </div>
        ))}

      </div>

    </div>
  )
}